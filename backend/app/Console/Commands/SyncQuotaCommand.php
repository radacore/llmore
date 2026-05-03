<?php

namespace App\Console\Commands;

use App\Services\QuotaService;
use Illuminate\Console\Command;

class SyncQuotaCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'quota:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync token quota from Redis to PostgreSQL';

    /**
     * Execute the console command.
     */
    public function handle(QuotaService $quotaService): int
    {
        $this->info('Starting quota sync from Redis to PostgreSQL...');

        try {
            $quotaService->syncToDatabase();
            $this->info('Quota sync completed successfully.');

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("Quota sync failed: {$e->getMessage()}");

            return self::FAILURE;
        }
    }
}
