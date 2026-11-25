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

function sendJson(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_THROW_ON_ERROR);
    exit;
}

function findSeries(string $service): iterable
{
    $source = $service === PACKAGE_SERVICE ? 'communal' : $service;
    $schedule = bookingSchedule(SHARED_SCHEDULE);

    return Event::query()->where('creator_role_id', $schedule->id)
        ->where('external_id', 'like', 'hot-rocks-preview-'.$source.'-____')
        ->where('is_cancelled', false)->where('is_draft', false)
        ->with(['tickets', 'addons', 'roles', 'creatorRole'])->get();
}

function forestType(): AppointmentType
{
    return AppointmentType::query()->where('role_id', bookingSchedule(FOREST_SCHEDULE)->id)
        ->where('slug', 'forest-view-private')->where('is_active', true)->where('is_deleted', false)->firstOrFail();
}

function occurrence(Event $event, CarbonImmutable $day, bool $package): ?array
{
    $date = $day->toDateString();
    $ticket = $event->tickets->first();
    if (!$ticket || !$event->matchesDate($day, BOOKING_TIMEZONE) || !$event->canSellTickets($date)) {
        return null;
    }
    $start = $event->getStartDateTime($date, true, BOOKING_TIMEZONE);
    if (!$start || $start->lte(CarbonImmutable::now(BOOKING_TIMEZONE))) {
        return null;
    }

    if ($package) {
        $addon = $event->addons->firstWhere('type', PACKAGE_ADDON);
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

function availability(string $service, int $guests): array
{
    $today = CarbonImmutable::today(BOOKING_TIMEZONE);
    $horizon = $today->addDays(BOOKING_HORIZON);
    if ($service === FOREST_SERVICE) {
        $slots = [];
        for ($day = $today; $day->lt($horizon); $day = $day->addDays(30)) {
            $result = app(AppointmentService::class)->availableSlots(forestType(), $day->toDateString(), 30);
            foreach ($result['days'] as $date => $windows) {
                foreach ($windows as $window) {
                    $slots[] = [
                        'id' => $window['utc'],
                        'date' => $date,
                        'time' => CarbonImmutable::parse($window['utc'])->setTimezone(BOOKING_TIMEZONE)->format('H:i'),
                        'remaining' => 8,
                    ];
                }
            }
        }

        return $slots;
    }

    $slots = [];
    foreach (findSeries($service) as $event) {
        for ($day = $today; $day->lt($horizon); $day = $day->addDay()) {
            $slot = occurrence($event, $day, $service === PACKAGE_SERVICE);
            if ($slot && $slot['remaining'] >= $guests) {
                $slots[] = $slot;
            }
        }
    }
    usort($slots, static fn (array $a, array $b) => [$a['date'], $a['time']] <=> [$b['date'], $b['time']]);

    return $slots;
}

function reserve(string $service, int $guests, string $slot, string $name, string $email, string $attempt): array
{
    if ($service === FOREST_SERVICE) {
        $type = forestType();
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
        $package = $service === PACKAGE_SERVICE;
        [$eventId, $date] = array_pad(explode(':', $slot, 2), 2, '');
        $event = collect(findSeries($service))->first(static fn (Event $event) => UrlUtils::encodeId($event->id) === $eventId);
        $day = Event::isOccurrenceDate($date) ? CarbonImmutable::parse($date, BOOKING_TIMEZONE) : null;
        $today = CarbonImmutable::today(BOOKING_TIMEZONE);
        if (!$event || !$day || $day->toDateString() !== $date || $day->lt($today) || $day->gte($today->addDays(BOOKING_HORIZON))) {
            return [409, []];
        }

        $current = occurrence($event, $day, $package);
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
        if ($package) {
            $fields['addons'] = [UrlUtils::encodeId($event->addons->firstWhere('type', PACKAGE_ADDON)->id) => 1];
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

    if ($service === FOREST_SERVICE) {
        // Sales counts one exclusive booking. Show group size alongside it for the operator.
        $sale = Sale::query()->with('event')->findOrFail(UrlUtils::decodeId($data['data']['id']));
        $event = $sale->event;
        $suffix = ' · '.$guests.($guests === 1 ? ' guest' : ' guests');
        if (!str_ends_with($event->name, $suffix)) {
            $event->name .= $suffix;
        }
        $event->custom_fields = $type->custom_fields;
        $event->save();
    }

    return [201, ['reference' => $data['data']['id']]];
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
    $service = $data['service'] ?? null;
    $guests = filter_var($data['guests'] ?? null, FILTER_VALIDATE_INT);
    $limits = is_string($service) ? match ($service) {
        FOREST_SERVICE => [1, 8],
        PACKAGE_SERVICE => [2, 2],
        default => isset(PREVIEW_SERIES[$service]) ? [1, PREVIEW_SERIES[$service][3]] : null,
    } : null;
    if (!$limits || !$guests || $guests < $limits[0] || $guests > $limits[1]) {
        sendJson(['error' => 'Invalid session or guest count.'], 422);
    }

    eventScheduleApp();
    if ($method === 'GET') {
        sendJson(availability($service, $guests));
    }

    $slot = $data['slot'] ?? null;
    $name = $data['name'] ?? null;
    $email = $data['email'] ?? null;
    $attempt = $data['attempt'] ?? null;
    if (!is_string($slot) || strlen($slot) > 80 || !is_string($name) || trim($name) === '' || mb_strlen($name) > 100
        || !is_string($email) || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)
        || !preg_match('/@example\.(com|net|org)$/iD', $email)
        || !is_string($attempt) || !preg_match('/^[a-f0-9-]{36}$/D', $attempt)) {
        sendJson(['error' => 'Enter a name and a test email such as sam@example.com.'], 422);
    }

    $rateKey = 'hot-rocks-preview:'.hash('sha256', $_SERVER['REMOTE_ADDR'] ?? '');
    if (RateLimiter::tooManyAttempts($rateKey, 20)) {
        sendJson(['error' => 'Too many test requests. Try again in a minute.'], 429);
    }
    RateLimiter::hit($rateKey, 60);

    $fingerprint = hash('sha256', json_encode([$service, $guests, $slot, $name, $email], JSON_THROW_ON_ERROR));
    $cacheKey = 'hot-rocks-attempt:'.$attempt;
    [$status, $result] = Cache::store('file')->lock($cacheKey.':lock', 60)->block(5, function () use ($cacheKey, $fingerprint, $service, $guests, $slot, $name, $email, $attempt) {
        $cache = Cache::store('file');
        $previous = $cache->get($cacheKey);
        if ($previous) {
            return $previous['fingerprint'] === $fingerprint ? $previous['result'] : [422, []];
        }

        $cache->put($cacheKey, ['fingerprint' => $fingerprint, 'result' => [503, []]], now()->addDay());
        $outcome = reserve($service, $guests, $slot, $name, $email, $attempt);
        $cache->put($cacheKey, ['fingerprint' => $fingerprint, 'result' => $outcome], now()->addDay());

        return $outcome;
    });
    sendJson($result, $status);
} catch (Throwable $error) {
    error_log('Hot Rocks booking preview: '.$error->getMessage());
    sendJson(['error' => 'Booking is temporarily unavailable.'], 503);
}
