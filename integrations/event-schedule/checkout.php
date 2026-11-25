<?php
declare(strict_types=1);

use App\Exceptions\BusinessException;
use App\Models\Sale;
use App\Services\AppointmentService;
use App\Utils\UrlUtils;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Stripe\Checkout\Session;
use Stripe\Exception\InvalidRequestException;
use Stripe\StripeClient;

final class PreviewPriceChanged extends RuntimeException
{
    public function __construct(public readonly int $amount)
    {
        parent::__construct('The preview price changed');
    }
}

function validBookingAttempt(mixed $attempt): bool
{
    return is_string($attempt) && preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/D', $attempt) === 1;
}

function previewStripe(): StripeClient
{
    $key = (string) config('services.stripe_platform.secret');
    if ((!str_starts_with($key, 'sk_test_') && !str_starts_with($key, 'rk_test_'))
        || !str_starts_with((string) config('services.stripe_platform.webhook_secret'), 'whsec_')) {
        throw new RuntimeException('The Stripe sandbox and webhook must be configured');
    }

    return new StripeClient($key);
}

function checkoutKey(string $attempt): string
{
    return 'hot-rocks-preview-checkout:'.$attempt;
}

function verifyPreviewSession(Session $session, array $record): void
{
    if ($session->livemode !== false || $session->currency !== 'gbp' || $session->amount_total !== $record['visit']['amount']
        || ($session->metadata->sale_id ?? null) !== $record['reference']) {
        throw new RuntimeException('Unexpected Stripe checkout session');
    }
}

function reservePreviewSale(string $service, int $guests, string $slot, string $name, string $email, string $attempt): ?Sale
{
    if ($service !== FOREST_SERVICE) {
        [$status, $result] = reserve($service, $guests, $slot, $name, $email, $attempt, CHECKOUT_WINDOW_MINUTES);

        return $status === 201 ? Sale::query()->findOrFail(UrlUtils::decodeId($result['reference'])) : null;
    }

    $pattern = 'Y-m-d\TH:i:s\Z';
    $start = DateTimeImmutable::createFromFormat('!'.$pattern, $slot, new DateTimeZone('UTC'));
    if (!$start || $start->format($pattern) !== $slot || $start->getTimestamp() <= time() + CHECKOUT_WINDOW_MINUTES * 60) {
        return null;
    }
    $type = forestType();
    $role = $type->role;
    if (!$role->canCreateEvent($role->user)) {
        return null;
    }

    // The public preview hands off to Stripe directly, so it does not need the appointment API's emailed pay link.
    // Stamp the preview price on the new sale without saving a change to the installed appointment type.
    $type->price = FOREST_TEST_PRICE;
    $type->payment_method = 'stripe';
    try {
        $sale = app(AppointmentService::class)->book($type, $role, [
            'slot' => $slot,
            'name' => $name,
            'email' => $email,
            'custom_values' => ['0' => $guests],
            'source' => 'api',
        ]);
    } catch (BusinessException) {
        return null;
    }
    labelForestBooking($sale, $type, $guests);

    return $sale;
}

function startPreviewCheckout(string $service, int $guests, string $slot, string $name, string $email, string $attempt, int $expectedAmount): array
{
    $stripe = previewStripe();
    $cache = Cache::store('database');
    $key = checkoutKey($attempt);
    $fingerprint = hash('sha256', json_encode([$service, $guests, $slot, $name, $email, $expectedAmount], JSON_THROW_ON_ERROR));

    return $cache->lock($key.':lock', 120)->block(5, function () use ($stripe, $cache, $key, $fingerprint, $service, $guests, $slot, $name, $email, $attempt, $expectedAmount) {
        $record = $cache->get($key);
        if (!$record) {
            try {
                $record = DB::transaction(function () use ($cache, $key, $fingerprint, $service, $guests, $slot, $name, $email, $attempt, $expectedAmount) {
                    $sale = reservePreviewSale($service, $guests, $slot, $name, $email, $attempt);
                    if (!$sale) {
                        return null;
                    }

                    $amount = (int) round((float) $sale->payment_amount * 100);
                    if ($sale->status !== 'unpaid' || $amount <= 0 || strtoupper($sale->event->ticket_currency_code) !== 'GBP'
                        || (int) $sale->event->expire_unpaid_tickets < 1) {
                        throw new RuntimeException('The preview sale needs a positive GBP total and automatic hold expiry');
                    }
                    if ($amount !== $expectedAmount) {
                        throw new PreviewPriceChanged($amount);
                    }

                    $date = $sale->event_date;
                    $start = $sale->event->getStartDateTime($date, true, BOOKING_TIMEZONE);
                    $sale->payment_method = 'stripe';
                    $sale->save();
                    $product = match ($service) {
                        'communal' => 'Hot Rocks communal sauna',
                        FOREST_SERVICE => 'Forest View private sauna',
                        PACKAGE_SERVICE => 'Sauna and steak for two',
                        default => PREVIEW_SERIES[$service][0],
                    };
                    $record = [
                        'fingerprint' => $fingerprint,
                        'sale' => $sale->id,
                        'reference' => UrlUtils::encodeId($sale->id),
                        'product' => $product.' (test booking)',
                        'session' => null,
                        'expires' => min($start->getTimestamp(), $sale->created_at->copy()->addMinutes(CHECKOUT_WINDOW_MINUTES)->getTimestamp()),
                        'visit' => ['service' => $service, 'slot' => $slot, 'date' => $date, 'time' => $start->format('H:i'), 'guests' => $guests, 'amount' => $amount],
                    ];
                    if (!$cache->put($key, $record, now()->addDays(2))) {
                        throw new RuntimeException('Could not store the preview checkout');
                    }

                    return $record;
                });
            } catch (PreviewPriceChanged $change) {
                return [409, ['amount' => $change->amount]];
            }
            if (!$record) {
                return [409, []];
            }
        }
        if ($record['fingerprint'] !== $fingerprint) {
            return [422, []];
        }

        if ($record['session']) {
            $session = $stripe->checkout->sessions->retrieve($record['session']);
        } else {
            if ($record['expires'] <= time() + 31 * 60) {
                return [409, ['checkoutExpired' => true]];
            }
            $return = PREVIEW_ORIGIN.'/book/?booking='.$attempt.'&checkout=';
            $session = $stripe->checkout->sessions->create([
                'mode' => 'payment',
                'payment_method_types' => ['card'],
                'adaptive_pricing' => ['enabled' => false],
                'customer_email' => $email,
                'expires_at' => $record['expires'],
                'success_url' => $return.'return',
                'cancel_url' => $return.'cancel',
                'metadata' => ['sale_id' => $record['reference']],
                'payment_intent_data' => ['metadata' => ['sale_id' => $record['reference']]],
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'gbp',
                        'unit_amount' => $record['visit']['amount'],
                        'product_data' => [
                            'name' => $record['product'] ?? 'Hot Rocks communal sauna (test booking)',
                            'description' => $record['visit']['date'].' at '.$record['visit']['time'].' for '.$guests.($guests === 1 ? ' guest' : ' guests'),
                        ],
                    ],
                    'quantity' => 1,
                ]],
            ], ['idempotency_key' => $key]);
            verifyPreviewSession($session, $record);
            $record['session'] = $session->id;
            if (!$cache->put($key, $record, now()->addDays(2))) {
                throw new RuntimeException('Could not save the Stripe checkout reference');
            }
        }
        verifyPreviewSession($session, $record);
        if ($session->status !== 'open' || !$session->url) {
            return [200, ['checkStatus' => true]];
        }

        return [201, ['checkoutUrl' => $session->url]];
    });
}

function previewPaymentStatus(string $attempt, bool $cancel): array
{
    $cache = Cache::store('database');
    $key = checkoutKey($attempt);
    $record = $cache->get($key);
    if (!$record) {
        return [404, []];
    }

    $sale = Sale::query()->findOrFail($record['sale']);
    if ($cancel && $sale->status === 'unpaid' && $record['session']) {
        $cache->lock($key.':lock', 120)->block(5, function () use ($record) {
            $stripe = previewStripe();
            $checkout = $stripe->checkout->sessions;
            $session = $checkout->retrieve($record['session']);
            verifyPreviewSession($session, $record);
            if ($session->status === 'open') {
                try {
                    $session = $checkout->expire($session->id, []);
                } catch (InvalidRequestException) {
                    $session = $checkout->retrieve($session->id);
                }
            }
            if ($session->status !== 'expired' || $session->payment_status !== 'unpaid') {
                return;
            }

            DB::transaction(function () use ($record) {
                $current = Sale::query()->lockForUpdate()->findOrFail($record['sale']);
                if ($current->status === 'unpaid') {
                    $current->status = 'cancelled';
                    $current->save();
                }
            });
        });
        $sale->refresh();
    }

    $status = match ($sale->status) {
        'paid' => str_starts_with((string) $sale->transaction_reference, 'pi_') ? 'paid' : 'review',
        'cancelled', 'expired', 'refunded' => $sale->status,
        'unpaid' => 'pending',
        default => 'review',
    };

    return [200, ['status' => $status, 'reference' => $record['reference'], 'visit' => $record['visit']]];
}
