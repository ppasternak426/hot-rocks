<?php
declare(strict_types=1);

use Illuminate\Support\Facades\Http;

function isBookingSlug(mixed $value): bool
{
    return is_string($value) && strlen($value) <= 160 && preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $value) === 1;
}

function bookingSource(string $service): ?array
{
    if ($service === 'private-sauna-lough-view') {
        return null;
    }

    $documents = Http::acceptJson()->connectTimeout(2)->timeout(5)
        ->get('https://mdwbejwr.api.sanity.io/v2026-03-01/data/query/production', [
            'perspective' => 'published',
            'query' => '*[_type == "saunaSession" && slug.current == $slug][0...2]{title, bookingSource, "limits": bookingDemo{minGuests, maxGuests}}',
            '$slug' => json_encode($service, JSON_THROW_ON_ERROR),
        ])->throw()->json('result');
    if (!is_array($documents) || count($documents) !== 1) {
        return null;
    }
    $document = $documents[0];
    $source = $document['bookingSource'] ?? null;
    $booking = ['service' => $service, 'label' => $document['title'], 'events' => [], 'appointment' => null];
    if ($source === null) {
        $limits = match ($service) {
            FOREST_SERVICE => [1, 8],
            PACKAGE_SERVICE => [2, 2],
            default => isset(PREVIEW_SERIES[$service]) ? [1, PREVIEW_SERIES[$service][3]] : null,
        };
        if (!$limits || empty($document['limits'])) {
            return null;
        }

        return $booking + [
            'legacy' => true,
            'kind' => $service === FOREST_SERVICE ? 'appointment' : 'tickets',
            'min' => $limits[0],
            'max' => $limits[1],
            'addonName' => $service === PACKAGE_SERVICE ? PACKAGE_ADDON : null,
        ];
    }

    $min = $document['limits']['minGuests'] ?? null;
    $max = $document['limits']['maxGuests'] ?? null;
    if (!is_int($min) || !is_int($max) || $min < 1 || $max < $min) {
        return null;
    }

    $kind = $source['kind'] ?? null;
    $booking += ['legacy' => false, 'kind' => $kind, 'min' => $min, 'max' => $max, 'addonName' => null];
    if ($kind === 'appointment' && isBookingSlug($source['appointmentSlug'] ?? null)) {
        $booking['appointment'] = $source['appointmentSlug'];

        return $booking;
    }
    $events = $source['eventSlugs'] ?? null;
    $addon = $source['addonName'] ?? null;
    if ($kind !== 'tickets' || !is_array($events) || !$events || count($events) > 24
        || array_filter($events, static fn ($slug) => !isBookingSlug($slug))
        || ($addon !== null && (!is_string($addon) || strlen($addon) > 120))) {
        return null;
    }
    $booking['events'] = array_values(array_unique($events));
    $booking['addonName'] = $addon === null || trim($addon) === '' ? null : trim($addon);

    return $booking;
}
