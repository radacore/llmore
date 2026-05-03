<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ──────────────────────────────────────────────
// Scheduled Jobs
// ──────────────────────────────────────────────

Schedule::command('quota:sync')->everyFiveMinutes();
Schedule::command('apikey:cache-refresh')->hourly();
Schedule::command('usage:process --batch=500')->everyMinute();
