<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiKeyResource;
use App\Models\ApiKey;
use App\Services\ApiKeyCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Redis;

class ApiKeyController extends Controller
{
    public function __construct(
        private ApiKeyCacheService $cacheService,
    ) {}

    /**
     * List semua API keys milik user yang authenticated.
     * Tidak menampilkan key_hash atau full key.
     * Enriches last_used_at from Redis for real-time accuracy.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $apiKeys = $request->user()
            ->apiKeys()
            ->orderByDesc('created_at')
            ->get();

        // Enrich last_used_at from Redis (gateway stores it there on each request)
        foreach ($apiKeys as $key) {
            $lastUsed = Redis::get("apikey_last_used:{$key->id}");
            if ($lastUsed) {
                $key->last_used_at = $lastUsed;
            }
        }

        return ApiKeyResource::collection($apiKeys);
    }

    /**
     * Buat API key baru.
     * Key hanya ditampilkan sekali di response ini.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $subscription = $user->activeSubscription();

        if (! $subscription) {
            return response()->json([
                'error' => 'no_active_subscription',
                'message' => 'Anda belum punya paket aktif. Silakan berlangganan terlebih dahulu untuk membuat API key.',
            ], 422);
        }

        $subscription->loadMissing('plan');

        // Paket gratis (price <= 0) tidak boleh generate API key.
        // Free plan hanya buat ekspor fitur dashboard; akses API butuh upgrade ke paket berbayar.
        if ($subscription->plan->price <= 0) {
            return response()->json([
                'error' => 'paid_plan_required',
                'message' => 'Paket gratis tidak bisa membuat API key. Upgrade ke paket berbayar untuk mengakses API.',
            ], 422);
        }

        $maxKeys = $subscription->plan->max_api_keys;

        // Cek apakah jumlah active keys sudah mencapai limit
        $activeKeysCount = $user->apiKeys()->where('status', 'active')->count();

        if ($activeKeysCount >= $maxKeys) {
            return response()->json([
                'error' => 'api_key_limit_reached',
                'message' => 'Jumlah API key sudah mencapai batas paket Anda (' . $maxKeys . ' key).',
            ], 422);
        }

        // Generate API key dengan prefix `llmora_` (brand-aligned).
        // Format: llmora_ + 48 hex char (24 random bytes) = 55 char total.
        $rawKey = 'llmora_' . bin2hex(random_bytes(24));
        $prefix = substr($rawKey, 0, 16);
        $hash = hash('sha256', $rawKey);

        // Simpan ke database
        $apiKey = $user->apiKeys()->create([
            'name' => $request->input('name'),
            'key_prefix' => $prefix,
            'key_hash' => $hash,
            'status' => 'active',
        ]);

        // Cache ke Redis untuk fast lookup oleh gateway
        $this->cacheService->cacheKey($apiKey);

        return response()->json([
            'id' => $apiKey->id,
            'name' => $apiKey->name,
            'key' => $rawKey,
            'plain_text_key' => $rawKey,
            'key_prefix' => $apiKey->key_prefix,
            'created_at' => $apiKey->created_at->toISOString(),
        ], 201);
    }

    /**
     * Detail API key termasuk statistics dari usage_logs.
     * Tidak menampilkan full key.
     * Hanya bisa lihat key milik sendiri.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $apiKey = $request->user()
            ->apiKeys()
            ->where('id', $id)
            ->first();

        if (! $apiKey) {
            return response()->json([
                'error' => 'not_found',
                'message' => 'API key not found',
            ], 404);
        }

        // Ambil statistics dari usage_logs
        $stats = $apiKey->usageLogs()
            ->selectRaw('COUNT(*) as total_requests')
            ->selectRaw('COALESCE(SUM(total_tokens), 0) as total_tokens_used')
            ->first();

        return response()->json([
            'id' => $apiKey->id,
            'name' => $apiKey->name,
            'key_prefix' => $apiKey->key_prefix,
            'status' => $apiKey->status,
            'last_used_at' => $apiKey->last_used_at?->toISOString(),
            'created_at' => $apiKey->created_at->toISOString(),
            'revoked_at' => $apiKey->revoked_at?->toISOString(),
            'statistics' => [
                'total_requests' => (int) $stats->total_requests,
                'total_tokens_used' => (int) $stats->total_tokens_used,
            ],
        ]);
    }

    /**
     * Revoke API key.
     * Set status ke 'revoked', hapus dari Redis cache.
     * Hanya bisa revoke key milik sendiri.
     */
    public function revoke(Request $request, int $id): JsonResponse
    {
        $apiKey = $request->user()
            ->apiKeys()
            ->where('id', $id)
            ->where('status', 'active')
            ->first();

        if (! $apiKey) {
            return response()->json([
                'error' => 'not_found',
                'message' => 'API key not found or already revoked',
            ], 404);
        }

        // Update status di database
        $apiKey->update([
            'status' => 'revoked',
            'revoked_at' => now(),
        ]);

        // Hapus dari Redis cache
        $this->cacheService->invalidateKey($apiKey);

        return response()->json([
            'message' => 'API key revoked successfully',
        ]);
    }
}
