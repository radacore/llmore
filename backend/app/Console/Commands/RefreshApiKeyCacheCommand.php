<?php

namespace App\Console\Commands;

use App\Services\ApiKeyCacheService;
use Illuminate\Console\Command;

class RefreshApiKeyCacheCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'apikey:cache-refresh';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Refresh all active API keys cache in Redis';

    /**
     * Execute the console command.
     */
    public function handle(ApiKeyCacheService $cacheService): int
    {
        $this->info('Starting API key cache refresh...');

        try {
            $cacheService->refreshAllKeys();
            $this->info('API key cache refresh completed successfully.');

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("API key cache refresh failed: {$e->getMessage()}");

            return self::FAILURE;
        }
    }
}
