<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

use App\Http\Controllers\Api\ApiEventController;
use App\Http\Controllers\Api\ApiScheduleController;
use App\Models\AppointmentType;
use App\Models\Event;
use App\Models\Role;
use App\Models\User;
use Carbon\CarbonImmutable;

require __DIR__.'/application.php';
eventScheduleApp();

function createSchedule(string $slug, string $name, User $owner): Role
{
    $existing = Role::query()->where('subdomain', $slug)->where('is_deleted', false)->first();
    if ($existing) {
        if ($existing->user_id !== $owner->id) {
            throw new RuntimeException('Preview schedule belongs to a different owner');
        }

        return $existing;
    }

    $created = Role::query()->where('name', $name)->where('user_id', $owner->id)->where('is_deleted', false)->first();
    if (!$created) {
        $request = bookingRequest('POST', '/api/schedules', [
            'name' => $name,
            'type' => 'venue',
            'timezone' => BOOKING_TIMEZONE,
            'description' => 'Hot Rocks booking preview. Test reservations only.',
        ]);
        auth()->setUser($owner);
        $response = app(ApiScheduleController::class)->store($request);
        if ($response->getStatusCode() !== 201) {
            throw new RuntimeException('Creating test schedule failed: '.$response->getContent());
        }
        $created = Role::query()->where('subdomain', $response->getData(true)['data']['subdomain'])->firstOrFail();
    }
    $created->subdomain = $slug;
    $created->save();

    return $created;
}

$admins = User::query()->where('is_admin', true);
$ownerEmail = getenv('HOT_ROCKS_PREVIEW_OWNER_EMAIL');
if ($ownerEmail !== false && $ownerEmail !== '') {
    $admins->where('email', $ownerEmail);
}
$owner = $admins->sole();
$shared = createSchedule(SHARED_SCHEDULE, 'Hot Rocks Sauna Preview', $owner);
$forest = createSchedule(FOREST_SCHEDULE, 'Hot Rocks Forest View Preview', $owner);
$lough = createSchedule(LOUGH_SCHEDULE, 'Hot Rocks Lough View Preview', $owner);
$now = CarbonImmutable::now(BOOKING_TIMEZONE);

foreach (PREVIEW_SERIES as $service => [$name, $minutes, $price, $quantity, $days, $times]) {
    foreach ($times as $time) {
        $externalId = previewSeriesId($service, $time);
        $event = Event::query()->where('creator_role_id', $shared->id)->where('external_id', $externalId)->first();
        if ($event) {
            // Upgrade only entries created by the first preview installer.
            if ($event->is_internal && $event->description === 'Test reservations for the Astro booking preview.') {
                $event->is_internal = false;
                $event->is_draft = false;
                $event->is_private = true;
                $event->save();
            }
            continue;
        }

        $start = $now->setTimeFromTimeString($time);
        while ($start->lte($now) || $days[$start->dayOfWeek] !== '1') {
            $start = $start->addDay();
        }

        $fields = [
            'external_id' => $externalId,
            'name' => $name.' · '.$time.' (preview)',
            'starts_at' => $start->utc()->format('Y-m-d H:i:s'),
            'description' => 'Test reservations for the Astro booking preview.',
            'duration' => $minutes / 60,
            'is_private' => true,
            'tickets_enabled' => true,
            'ticket_currency_code' => 'GBP',
            'schedule_type' => 'recurring',
            'recurring_frequency' => 'weekly',
            'recurring_end_type' => 'never',
            'days_of_week' => $days,
            'tickets' => [[
                'type' => 'Sauna place',
                'quantity' => $quantity,
                'price' => $price,
            ]],
        ];
        if ($service === 'communal') {
            $fields['addons'] = [['type' => PACKAGE_ADDON, 'quantity' => 1, 'price' => 42]];
        }
        $request = bookingRequest('POST', '/api/events/'.$shared->subdomain, $fields, $shared);
        $response = app(ApiEventController::class)->store($request, $shared->subdomain);
        if ($response->getStatusCode() !== 201) {
            throw new RuntimeException('Creating '.$externalId.' failed: '.$response->getContent());
        }
        $event = Event::query()->where('creator_role_id', $shared->id)->where('external_id', $externalId)->firstOrFail();
        $event->expire_unpaid_tickets = 1;
        $event->save();
        $event->tickets()->update(['max_per_order' => $quantity]);
        echo $externalId.PHP_EOL;
    }
}

$windows = array_map(static fn (string $start, string $end) => compact('start', 'end'), ['09:00', '12:00', '16:00'], ['10:00', '13:00', '17:00']);
$forestType = AppointmentType::query()->firstOrCreate(['role_id' => $forest->id, 'slug' => 'forest-view-private'], [
    'name' => 'Forest View private sauna (preview)',
    'description' => 'Exclusive slot for up to eight guests. Test reservations only.',
    'duration_minutes' => 60,
    'slot_interval_minutes' => 60,
    'weekly_windows' => [0 => $windows, 6 => $windows],
    'min_notice_hours' => 0,
    'max_advance_days' => BOOKING_HORIZON,
    'currency_code' => 'GBP',
    'price' => 0,
    'requires_approval' => false,
    'capacity' => 1,
    'custom_fields' => [['name' => 'Number of guests (1–8)', 'type' => 'number', 'required' => true]],
    'is_active' => true,
    'is_deleted' => false,
]);

// The preview has no outgoing mail. The appointment API only offers free,
// immediately confirmed types in that configuration.
if ($forestType->requires_approval && $forestType->description === 'Exclusive slot for up to eight guests. Test reservations only.') {
    $forestType->requires_approval = false;
    $forestType->save();
}

AppointmentType::query()->firstOrCreate(['role_id' => $lough->id, 'slug' => 'lough-view-by-request'], [
    'name' => 'Lough View private sauna (by request)',
    'description' => 'Exclusive 60-minute session for up to 15 guests. Handle requests manually.',
    'duration_minutes' => 60,
    'slot_interval_minutes' => 60,
    'weekly_windows' => [],
    'currency_code' => 'GBP',
    'price' => 0,
    'capacity' => 1,
    'custom_fields' => [['name' => 'Number of guests (1–15)', 'type' => 'number', 'required' => true]],
    'is_active' => false,
    'is_deleted' => false,
]);

echo "Booking preview entries ready\n";
