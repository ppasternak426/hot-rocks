<?php
declare(strict_types=1);

const PREVIEW_ORIGIN = 'https://tender-palegoldenrod-porcupine-90.hostingersite.com';
const PREVIEW_HOST = 'aquatic-paleturquoise-albatross-43.hostingersite.com';
const BOOKING_TIMEZONE = 'Europe/London';
const SHARED_SCHEDULE = 'hot-rocks-sauna-preview';
const CHECKOUT_WINDOW_MINUTES = 35;
const FOREST_SCHEDULE = 'hot-rocks-forest-view-preview';
const LOUGH_SCHEDULE = 'hot-rocks-lough-view-preview';
const FOREST_SERVICE = 'private';
const FOREST_TEST_PRICE = 115;
const PACKAGE_SERVICE = 'sauna-and-steak-for-two';
const PACKAGE_ADDON = 'Steak for two package';
const BOOKING_HORIZON = 90;
const PREVIEW_SERIES = [
    'communal' => ['Communal session', 60, 14, 6, '1000001', ['09:00', '15:00']],
    'textile-free-sauna' => ['Textile Free session', 60, 14, 6, '1000001', ['10:00']],
    'slow-sauna' => ['Slow Sauna', 120, 24, 6, '1000001', ['11:00']],
    'slow-sauna-textile-free' => ['Slow Sauna Textile Free', 120, 24, 6, '1000001', ['13:00']],
    'rituals' => ['Sauna master’s ritual', 180, 50, 4, '0000001', ['16:00']],
    'whisking-it-up' => ['Whisking it up', 120, 55, 4, '1000000', ['16:00']],
];

function previewSeriesId(string $service, string $time): string
{
    return 'hot-rocks-preview-'.$service.'-'.str_replace(':', '', $time);
}
