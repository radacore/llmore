<?php

namespace App\Services;

use App\Models\ApiKey;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class ApiKeyCacheService
{
    /**
     * Prefix untuk Redis key API key lookup.
     */
    private const KEY_PREFIX = 'apikey:';

    /**
     * Cache API key ke Redis untuk fast lookup oleh gateway.
     *
     * Redis key: apikey:{key_hash}
     * Value: JSON { user_id, api_key_id, subscription_id, plan_slug, rate_limit_per_minute, status }
     */
    public function cacheKey(ApiKey $apiKey): void
    {
        $apiKey->loadMissing(['user']);

        $subscription = $apiKey->user->activeSubscription();

        if (! $subscription) {
            Log::warning("ApiKeyCacheService: No active subscription for user {$apiKey->user_id}, skipping cache for key {$apiKey->id}");
            return;
        }

        $subscription->loadMissing('plan');

        $data = json_encode([
            'user_id' => $apiKey->user_id,
            'api_key_id' => $apiKey->id,
            'subscription_id' => $subscription->id,
            'plan_slug' => $subscription->plan->slug,
            'rate_limit_per_minute' => $subscription->plan->rate_limit_per_minute,
            'status' => $apiKey->status,
        ]);

        Redis::set(self::KEY_PREFIX . $apiKey->key_hash, $data);

        Log::info("ApiKeyCacheService: Cached API key {$apiKey->id} (prefix: {$apiKey->key_prefix})");
    }

    /**
     * Hapus API key dari Redis cache.
     */
    public function invalidateKey(ApiKey $apiKey): void
    {
        Redis::del(self::KEY_PREFIX . $apiKey->key_hash);

        Log::info("ApiKeyCacheService: Invalidated API key {$apiKey->id} (prefix: {$apiKey->key_prefix})");
    }

    /**
     * Refresh semua active API keys ke Redis.
     * Digunakan untuk recovery/startup atau scheduled refresh.
     */
    public function refreshAllKeys(): void
    {
        $apiKeys = ApiKey::where('status', 'active')
            ->with(['user.subscriptions' => function ($query) {
                $query->active()->with('plan');
            }])
            ->get();

        $cached = 0;
        $skipped = 0;

        foreach ($apiKeys as $apiKey) {
            $subscription = $apiKey->user->subscriptions
                ->sortByDesc('starts_at')
                ->first();

            if (! $subscription) {
                $skipped++;
                continue;
            }

            $data = json_encode([
                'user_id' => $apiKey->user_id,
                'api_key_id' => $apiKey->id,
                'subscription_id' => $subscription->id,
                'plan_slug' => $subscription->plan->slug,
                'rate_limit_per_minute' => $subscription->plan->rate_limit_per_minute,
                'status' => $apiKey->status,
            ]);

            Redis::set(self::KEY_PREFIX . $apiKey->key_hash, $data);
            $cached++;
        }

        Log::info("ApiKeyCacheService: Refreshed {$cached} API keys, skipped {$skipped}");
    }
}
