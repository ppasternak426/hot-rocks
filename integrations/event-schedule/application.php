<?php
declare(strict_types=1);

use App\Models\Role;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Facade;

require_once __DIR__.'/config.php';

function eventScheduleApp(): void
{
    $root = dirname(__DIR__).'/event-schedule';
    require_once $root.'/vendor/autoload.php';
    $app = require $root.'/bootstrap/app.php';
    $app->make(Kernel::class)->bootstrap();
}

function bookingSchedule(string $slug): Role
{
    return Role::query()->where('subdomain', $slug)->where('is_deleted', false)->firstOrFail();
}

function bookingRequest(string $method, string $path, array $values, ?Role $schedule = null): Request
{
    $request = Request::create('https://'.PREVIEW_HOST.$path, $method, $values, [], [], [
        'HTTP_ACCEPT' => 'application/json',
    ]);
    app()->instance('request', $request);
    Facade::clearResolvedInstance('request');
    if ($schedule !== null) {
        auth()->setUser($schedule->user);
    }

    return $request;
}
