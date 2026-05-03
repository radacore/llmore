<?php

namespace App\Console\Commands;

use App\Models\UsageLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

class ProcessUsageLogsCommand extends Command
{
    protected $signature = 'usage:process {--batch=100 : Number of logs to process per batch}';
    protected $description = 'Process usage logs from Redis queue to PostgreSQL';

    public function handle(): int
    {
        $batch = (int) $this->option('batch');
        $processed = 0;

        while ($processed < $batch) {
            $log = Redis::lpop('usage_logs_queue');
            if (!$log) break;

            try {
                $data = json_decode($log, true);
                
                UsageLog::create([
                    'user_id' => $data['user_id'],
                    'api_key_id' => $data['api_key_id'],
                    'subscription_id' => $data['subscription_id'],
                    'model' => $data['model'] ?? 'unknown',
                    'prompt_tokens' => $data['prompt_tokens'] ?? 0,
                    'completion_tokens' => $data['completion_tokens'] ?? 0,
                    'total_tokens' => $data['total_tokens'] ?? 0,
                    'response_time_ms' => $data['response_time_ms'] ?? 0,
                    'status_code' => $data['status_code'] ?? 0,
                    'ip_address' => $data['ip_address'] ?? null,
                    'created_at' => $data['created_at'] ?? now(),
                ]);

                $processed++;
            } catch (\Exception $e) {
                $this->error("Failed to process log: {$e->getMessage()}");
            }
        }

        $this->info("Processed {$processed} usage logs.");
        return Command::SUCCESS;
    }
}
