<?php
declare(strict_types=1);

use App\Http\Controllers\Api\ApiAppointmentController;
use App\Http\Controllers\Api\ApiSaleController;
use App\Models\AppointmentType;
use App\Models\Event;
use App\Models\Sale;
use App\Services\AppointmentService;
use App\Utils\UrlUtils;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

require dirname(__DIR__).'/hot-rocks-booking/application.php';
require dirname(__DIR__).'/hot-rocks-booking/booking-source.php';
require dirname(__DIR__).'/hot-rocks-booking/checkout.php';

function sendJson(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_THROW_ON_ERROR);
    exit;
}

function findSeries(array $booking): iterable
{
    $schedule = bookingSchedule(SHARED_SCHEDULE);
    $events = Event::query()->where('creator_role_id', $schedule->id)
        ->where('is_cancelled', false)->where('is_draft', false)
        ->with(['tickets', 'addons', 'roles', 'creatorRole']);
    if ($booking['legacy']) {
        $service = $booking['service'] === PACKAGE_SERVICE ? 'communal' : $booking['service'];
        return $events->where('external_id', 'like', 'hot-rocks-preview-'.$service.'-____')->get();
    }

    return $events->whereIn('slug', $booking['events'])->get()
        ->groupBy('slug')->filter(static fn ($matches) => $matches->count() === 1)
        ->map(static fn ($matches) => $matches->first());
}

function bookingAppointment(array $booking): ?AppointmentType
{
    $type = AppointmentType::query()->where('role_id', bookingSchedule(FOREST_SCHEDULE)->id)
        ->where('slug', $booking['appointment'] ?? 'forest-view-private')
        ->where('is_active', true)->where('is_deleted', false)->first();
    if (!$type || $type->requires_approval) {
        return null;
    }
    if (!$booking['legacy'] && ((float) $type->price <= 0 || $type->currency_code !== 'GBP'
        || (int) $type->capacity !== 1 || $type->require_phone
        || array_filter($type->custom_fields ?? [], static fn ($field) => !empty($field['required'])))) {
        return null;
    }

    return $type;
}

function occurrence(Event $event, CarbonImmutable $day, array $booking, int $noticeMinutes = 0): ?array
{
    $addonName = $booking['addonName'];
    $date = $day->toDateString();
    $ticket = $event->tickets->first();
    if (!$ticket || !$event->matchesDate($day, BOOKING_TIMEZONE) || !$event->canSellTickets($date)) {
        return null;
    }
    $start = $event->getStartDateTime($date, true, BOOKING_TIMEZONE);
    if (!$start || $start->lte(CarbonImmutable::now(BOOKING_TIMEZONE)->addMinutes($noticeMinutes))) {
        return null;
    }

    if ((!$booking['legacy'] && $event->tickets->count() !== 1) || $ticket->is_pass || (float) $ticket->price <= 0 || $event->ticket_currency_code !== 'GBP'
        || (int) $event->expire_unpaid_tickets < 1 || $ticket->isAllocated($date)) {
        return null;
    }
    if ($addonName !== null) {
        $addon = $event->addons->firstWhere('type', $addonName);
        if (!$addon || $addon->availableQuantity($date) < 1) {
            return null;
        }
    }

    return [
        'id' => UrlUtils::encodeId($event->id).':'.$date,
        'date' => $date,
        'time' => $start->copy()->setTimezone(BOOKING_TIMEZONE)->format('H:i'),
        'remaining' => $ticket->availableQuantity($date),
    ];
}

function availability(array $booking, int $guests): array
{
    $today = CarbonImmutable::today(BOOKING_TIMEZONE);
    $horizon = $today->addDays(BOOKING_HORIZON);
    if ($booking['kind'] === 'appointment') {
        $slots = [];
        $earliest = CarbonImmutable::now(BOOKING_TIMEZONE)->addMinutes(CHECKOUT_WINDOW_MINUTES);
        $type = bookingAppointment($booking);
        if (!$type) {
            return [];
        }
        for ($day = $today; $day->lt($horizon); $day = $day->addDays(30)) {
            $result = app(AppointmentService::class)->availableSlots($type, $day->toDateString(), 30, withNextAvailable: false);
            foreach ($result['days'] as $date => $windows) {
                foreach ($windows as $window) {
                    $start = CarbonImmutable::parse($window['utc'])->setTimezone(BOOKING_TIMEZONE);
                    if ($start->lte($earliest)) {
                        continue;
                    }
                    $slots[] = [
                        'id' => $window['utc'],
                        'date' => $date,
                        'time' => $start->format('H:i'),
                        'remaining' => $booking['max'],
                        'amount' => (int) round(100 * ($booking['legacy'] ? FOREST_TEST_PRICE : (float) $type->price)),
                    ];
                }
            }
        }

        return $slots;
    }

    $slots = [];
    foreach (findSeries($booking) as $event) {
        for ($day = $today; $day->lt($horizon); $day = $day->addDay()) {
            $slot = occurrence($event, $day, $booking, CHECKOUT_WINDOW_MINUTES);
            if ($slot && $slot['remaining'] >= $guests) {
                $ticketTotal = $event->tickets->first()->lineSubtotalAfterVolumeDiscount($guests);
                $addon = $booking['addonName'] === null ? null : $event->addons->firstWhere('type', $booking['addonName']);
                $slot['amount'] = (int) round(100 * ($ticketTotal + (float) ($addon?->price ?? 0)));
                if ($slot['amount'] > 0) {
                    $slots[] = $slot;
                }
            }
        }
    }
    usort($slots, static fn (array $a, array $b) => [$a['date'], $a['time']] <=> [$b['date'], $b['time']]);

    return $slots;
}

function reserve(array $booking, int $guests, string $slot, string $name, string $email, string $attempt, int $noticeMinutes = 0): array
{
    if ($booking['kind'] === 'appointment') {
        $type = bookingAppointment($booking);
        if (!$type) {
            return [409, []];
        }
        $path = '/api/appointment-types/'.UrlUtils::encodeId($type->id).'/bookings';
        $request = bookingRequest('POST', $path, [
            'slot' => $slot,
            'name' => $name,
            'email' => $email,
            'answers' => ['0' => $guests],
        ], $type->role);
        $request->headers->set('Idempotency-Key', $attempt);
        $response = app(ApiAppointmentController::class)->book($request, UrlUtils::encodeId($type->id));
    } else {
        $addonName = $booking['addonName'];
        [$eventId, $date] = array_pad(explode(':', $slot, 2), 2, '');
        $event = collect(findSeries($booking))->first(static fn (Event $event) => UrlUtils::encodeId($event->id) === $eventId);
        $day = Event::isOccurrenceDate($date) ? CarbonImmutable::parse($date, BOOKING_TIMEZONE) : null;
        $today = CarbonImmutable::today(BOOKING_TIMEZONE);
        if (!$event || !$day || $day->toDateString() !== $date || $day->lt($today) || $day->gte($today->addDays(BOOKING_HORIZON))) {
            return [409, []];
        }

        $current = occurrence($event, $day, $booking, $noticeMinutes);
        if (!$current || $current['remaining'] < $guests) {
            return [409, []];
        }

        $fields = [
            'event_id' => $eventId,
            'event_date' => $date,
            'name' => $name,
            'email' => $email,
            'tickets' => [UrlUtils::encodeId($event->tickets->first()->id) => $guests],
        ];
        if ($addonName !== null) {
            $fields['addons'] = [UrlUtils::encodeId($event->addons->firstWhere('type', $addonName)->id) => 1];
        }
        $request = bookingRequest('POST', '/api/sales', $fields, bookingSchedule(SHARED_SCHEDULE));
        $response = app(ApiSaleController::class)->store($request);
    }

    $data = $response->getData(true);
    $status = $response->getStatusCode();
    if (in_array($status, [409, 422], true)) {
        return [409, []];
    }
    if ($status !== 201 || empty($data['data']['id'])) {
        throw new RuntimeException('Event Schedule returned an unexpected response with status '.$status);
    }

    if ($booking['kind'] === 'appointment') {
        $sale = Sale::query()->with('event')->findOrFail(UrlUtils::decodeId($data['data']['id']));
        labelAppointmentBooking($sale, $type, $guests);
    }

    return [201, ['reference' => $data['data']['id']]];
}

function labelAppointmentBooking(Sale $sale, AppointmentType $type, int $guests): void
{
    // Sales counts one exclusive booking. Show group size alongside it for the operator.
    $event = $sale->event;
    $suffix = ' · '.$guests.($guests === 1 ? ' guest' : ' guests');
    if (!str_ends_with($event->name, $suffix)) {
        $event->name .= $suffix;
    }
    $event->custom_fields = $type->custom_fields;
    $event->save();
}

header('Content-Type: application/json');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('Vary: Origin');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== PREVIEW_ORIGIN) {
    sendJson(['error' => 'Open the Hot Rocks booking preview to continue.'], 403);
}
header('Access-Control-Allow-Origin: '.PREVIEW_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if (!in_array($method, ['GET', 'POST'], true)) {
    sendJson(['error' => 'Method not allowed.'], 405);
}

try {
    $data = $_GET;
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input', false, null, 0, 4096), true);
    }
    $action = $data['action'] ?? 'reserve';
    if ($method === 'POST' && in_array($action, ['payment_status', 'cancel_checkout'], true)) {
        $attempt = $data['attempt'] ?? null;
        if (!validBookingAttempt($attempt)) {
            sendJson(['error' => 'Invalid booking reference.'], 422);
        }
        eventScheduleApp();
        [$status, $result] = previewPaymentStatus($attempt, $action === 'cancel_checkout');
        sendJson($result, $status);
    }
    $service = $data['service'] ?? null;
    $guests = filter_var($data['guests'] ?? null, FILTER_VALIDATE_INT);
    if (!isBookingSlug($service) || !$guests || $guests < 1) {
        sendJson(['error' => 'Invalid session or guest count.'], 422);
    }
    eventScheduleApp();
    $booking = bookingSource($service);
    if (!$booking) {
        sendJson(['error' => 'Online booking is unavailable for this session. Contact us to enquire.'], 404);
    }
    if ($guests < $booking['min'] || $guests > $booking['max']) {
        sendJson(['error' => 'Invalid guest count for this session.'], 422);
    }
    if ($method === 'GET') {
        sendJson(availability($booking, $guests));
    }

    $slot = $data['slot'] ?? null;
    $name = $data['name'] ?? null;
    $email = $data['email'] ?? null;
    $attempt = $data['attempt'] ?? null;
    if (!is_string($slot) || strlen($slot) > 80 || !is_string($name) || trim($name) === '' || mb_strlen($name) > 100
        || !is_string($email) || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)
        || !validBookingAttempt($attempt)) {
        sendJson(['error' => 'Check your booking details and try again.'], 422);
    }

    $rateKey = 'hot-rocks-preview:'.hash('sha256', $_SERVER['REMOTE_ADDR'] ?? '');
    if (RateLimiter::tooManyAttempts($rateKey, 20)) {
        sendJson(['error' => 'Too many test requests. Try again in a minute.'], 429);
    }
    RateLimiter::hit($rateKey, 60);

    if ($action === 'checkout') {
        $amount = $data['amount'] ?? null;
        if (!is_int($amount) || $amount < 0) {
            sendJson(['error' => 'Invalid test checkout.'], 422);
        }
        [$status, $result] = startPreviewCheckout($booking, $guests, $slot, $name, $email, $attempt, $amount);
        sendJson($result, $status);
    }
    if ($action !== 'reserve' || !$booking['legacy']) {
        sendJson(['error' => 'Invalid booking action.'], 422);
    }

    $fingerprint = hash('sha256', json_encode([$service, $guests, $slot, $name, $email], JSON_THROW_ON_ERROR));
    $cacheKey = 'hot-rocks-attempt:'.$attempt;
    [$status, $result] = Cache::store('file')->lock($cacheKey.':lock', 60)->block(5, function () use ($cacheKey, $fingerprint, $booking, $guests, $slot, $name, $email, $attempt) {
        $cache = Cache::store('file');
        $previous = $cache->get($cacheKey);
        if ($previous) {
            return $previous['fingerprint'] === $fingerprint ? $previous['result'] : [422, []];
        }

        $cache->put($cacheKey, ['fingerprint' => $fingerprint, 'result' => [503, []]], now()->addDay());
        $outcome = reserve($booking, $guests, $slot, $name, $email, $attempt);
        $cache->put($cacheKey, ['fingerprint' => $fingerprint, 'result' => $outcome], now()->addDay());

        return $outcome;
    });
    sendJson($result, $status);
} catch (Throwable $error) {
    error_log('Hot Rocks booking preview: '.$error::class);
    sendJson(['error' => 'Booking is temporarily unavailable.'], 503);
}
