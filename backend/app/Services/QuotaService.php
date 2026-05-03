<?php

namespace App\Services;

use App\Models\Subscription;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class QuotaService
{
    /**
     * Prefix untuk Redis key quota.
     */
    private const KEY_PREFIX = 'quota:';

    /**
     * Lua script untuk atomic check-and-deduct quota.
     */
    private const DEDUCT_SCRIPT = <<<'LUA'
        local used = tonumber(redis.call('hget', KEYS[1], 'used'))
        local total = tonumber(redis.call('hget', KEYS[1], 'total'))
        local tokens = tonumber(ARGV[1])
        if (used + tokens) > total then
            return 0
        end
        redis.call('hincrby', KEYS[1], 'used', tokens)
        return 1
    LUA;

    /**
     * Set quota di Redis saat subscription dibuat/diaktifkan.
     *
     * Redis key: quota:{user_id} → Hash { total, used, subscription_id }
     * TTL: sesuai expiry subscription
     */
    public function initializeQuota(Subscription $subscription): void
    {
        $redisKey = self::KEY_PREFIX . $subscription->user_id;

        $ttl = now()->diffInSeconds($subscription->expires_at);

        if ($ttl <= 0) {
            Log::warning("QuotaService: Subscription {$subscription->id} already expired, skipping initialization");
            return;
        }

        Redis::hmset($redisKey, [
            'total' => $subscription->token_quota,
            'used' => $subscription->token_used,
            'subscription_id' => $subscription->id,
        ]);

        Redis::expire($redisKey, (int) $ttl);

        Log::info("QuotaService: Initialized quota for user {$subscription->user_id} (total: {$subscription->token_quota}, used: {$subscription->token_used}, TTL: {$ttl}s)");
    }

    /**
     * Cek sisa kuota dari Redis.
     * Jika key tidak ada di Redis, ambil dari database dan re-cache.
     *
     * @return array{has_quota: bool, remaining: int, total: int, used: int}
     */
    public function checkQuota(int $userId): array
    {
        $redisKey = self::KEY_PREFIX . $userId;

        $data = Redis::hgetall($redisKey);

        // Fallback ke database jika tidak ada di Redis
        if (empty($data)) {
            return $this->loadFromDatabase($userId);
        }

        $total = (int) $data['total'];
        $used = (int) $data['used'];
        $remaining = max(0, $total - $used);

        return [
            'has_quota' => $remaining > 0,
            'remaining' => $remaining,
            'total' => $total,
            'used' => $used,
        ];
    }

    /**
     * Kurangi kuota di Redis menggunakan Lua script (atomic check-and-deduct).
     *
     * @return bool false jika kuota tidak cukup
     */
    public function deductQuota(int $userId, int $tokens): bool
    {
        $redisKey = self::KEY_PREFIX . $userId;

        // Pastikan key ada di Redis, jika tidak load dari DB dulu
        if (! Redis::exists($redisKey)) {
            $quota = $this->loadFromDatabase($userId);
            if (! $quota['has_quota']) {
                return false;
            }
        }

        $result = Redis::eval(self::DEDUCT_SCRIPT, 1, $redisKey, $tokens);

        return (bool) $result;
    }

    /**
     * Return info kuota lengkap dari Redis (atau fallback ke DB).
     *
     * @return array{total: int, used: int, remaining: int, percentage: float}
     */
    public function getQuotaInfo(int $userId): array
    {
        $quota = $this->checkQuota($userId);

        $percentage = $quota['total'] > 0
            ? round(($quota['used'] / $quota['total']) * 100, 2)
            : 0;

        return [
            'total' => $quota['total'],
            'used' => $quota['used'],
            'remaining' => $quota['remaining'],
            'percentage' => $percentage,
        ];
    }

    /**
     * Sync semua quota data dari Redis ke PostgreSQL.
     * Field `token_used` di subscriptions table akan diupdate.
     * Dipanggil oleh scheduled command setiap 5 menit.
     */
    public function syncToDatabase(): void
    {
        $subscriptions = Subscription::active()->get();
        $synced = 0;

        foreach ($subscriptions as $subscription) {
            $redisKey = self::KEY_PREFIX . $subscription->user_id;
            $used = Redis::hget($redisKey, 'used');

            if ($used !== null) {
                $subscription->update(['token_used' => (int) $used]);
                $synced++;
            }
        }

        Log::info("QuotaService: Synced {$synced} quota records to database");
    }

    /**
     * Reset kuota saat subscription di-renew.
     */
    public function resetQuota(Subscription $subscription): void
    {
        $redisKey = self::KEY_PREFIX . $subscription->user_id;

        $ttl = now()->diffInSeconds($subscription->expires_at);

        if ($ttl <= 0) {
            Log::warning("QuotaService: Subscription {$subscription->id} already expired, skipping reset");
            return;
        }

        Redis::hmset($redisKey, [
            'total' => $subscription->token_quota,
            'used' => 0,
            'subscription_id' => $subscription->id,
        ]);

        Redis::expire($redisKey, (int) $ttl);

        Log::info("QuotaService: Reset quota for user {$subscription->user_id} (total: {$subscription->token_quota})");
    }

    /**
     * Load quota dari database dan cache ke Redis.
     *
     * @return array{has_quota: bool, remaining: int, total: int, used: int}
     */
    private function loadFromDatabase(int $userId): array
    {
        $subscription = Subscription::where('user_id', $userId)
            ->active()
            ->with('plan')
            ->latest('starts_at')
            ->first();

        if (! $subscription) {
            return [
                'has_quota' => false,
                'remaining' => 0,
                'total' => 0,
                'used' => 0,
            ];
        }

        // Re-cache ke Redis
        $this->initializeQuota($subscription);

        $remaining = max(0, $subscription->token_quota - $subscription->token_used);

        return [
            'has_quota' => $remaining > 0,
            'remaining' => $remaining,
            'total' => $subscription->token_quota,
            'used' => $subscription->token_used,
        ];
    }
}
