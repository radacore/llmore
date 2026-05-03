<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PlanResource;
use App\Http\Resources\TransactionResource;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Transaction;
use App\Services\ApiKeyCacheService;
use App\Services\KlikQrisService;
use App\Services\QuotaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BillingController extends Controller
{
    public function __construct(
        private KlikQrisService $klikQrisService,
        private QuotaService $quotaService,
        private ApiKeyCacheService $apiKeyCacheService,
    ) {}

    // ──────────────────────────────────────────────
    // Plans
    // ──────────────────────────────────────────────

    /**
     * Return semua active plans.
     */
    public function plans(): AnonymousResourceCollection
    {
        $plans = Plan::active()->orderBy('sort_order')->get();

        return PlanResource::collection($plans);
    }

    // ──────────────────────────────────────────────
    // Purchase
    // ──────────────────────────────────────────────

    /**
     * Buat transaksi pembelian plan baru via KlikQRIS.
     */
    public function purchase(Request $request): JsonResponse
    {
        $request->validate([
            'plan_slug' => 'required|string|exists:plans,slug',
        ]);

        $plan = Plan::where('slug', $request->plan_slug)->first();

        // Plan free tidak perlu dibeli
        if ($plan->slug === 'free') {
            return response()->json([
                'message' => 'Paket Free tidak perlu dibeli.',
            ], 422);
        }

        // Plan enterprise harus custom/contact sales
        if ($plan->slug === 'enterprise') {
            return response()->json([
                'message' => 'Paket Enterprise memerlukan penawaran khusus. Silakan hubungi tim sales.',
            ], 422);
        }

        $user = $request->user();

        // Cek apakah user sudah punya subscription active ke plan yang sama
        $existingSubscription = Subscription::where('user_id', $user->id)
            ->where('plan_id', $plan->id)
            ->active()
            ->first();

        if ($existingSubscription) {
            return response()->json([
                'message' => 'Anda sudah memiliki subscription aktif untuk paket ini.',
            ], 422);
        }

        try {
            // Generate order_id: LLM-{userId}-{timestamp}-{random4digit}
            $orderId = 'LLM-' . $user->id . '-' . time() . '-' . str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);

            // Buat transaksi via KlikQRIS
            $qrisResult = $this->klikQrisService->createTransaction($user, $plan, $orderId);

            // Simpan record transaksi dengan status pending
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'order_id' => $orderId,
                'amount' => $plan->price,
                'status' => 'pending',
                'payment_type' => 'qris',
                'payment_signature' => $qrisResult['signature'] ?? null,
                'payment_response' => $qrisResult,
            ]);

            return response()->json([
                'message' => 'Transaksi berhasil dibuat.',
                'data' => [
                    'order_id' => $orderId,
                    'total_amount' => $qrisResult['total_amount'] ?? null,
                    'direct_url' => $qrisResult['direct_url'] ?? null,
                    'qris_url' => $qrisResult['qris_url'] ?? null,
                    'qris_image' => $qrisResult['qris_image'] ?? null,
                    'expired_at' => $qrisResult['expired_at'] ?? null,
                    'signature' => $qrisResult['signature'] ?? null,
                    'transaction_id' => $transaction->id,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('BillingController: Purchase failed', [
                'user_id' => $user->id,
                'plan_slug' => $plan->slug,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Gagal membuat transaksi. Silakan coba lagi.',
            ], 500);
        }
    }

    // ──────────────────────────────────────────────
    // Check Payment Status
    // ──────────────────────────────────────────────

    /**
     * Cek status pembayaran via KlikQRIS.
     */
    public function checkPaymentStatus(Request $request, string $orderId): JsonResponse
    {
        $transaction = Transaction::where('order_id', $orderId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $transaction) {
            return response()->json([
                'message' => 'Transaksi tidak ditemukan.',
            ], 404);
        }

        // Jika sudah paid, langsung return
        if ($transaction->isPaid()) {
            return response()->json([
                'data' => [
                    'order_id' => $transaction->order_id,
                    'status' => 'paid',
                    'message' => 'Pembayaran sudah diterima.',
                ],
            ]);
        }

        try {
            $statusResult = $this->klikQrisService->checkStatus($orderId);

            $klikqrisStatus = strtoupper($statusResult['status'] ?? '');

            if ($klikqrisStatus === 'SUCCESS' || $klikqrisStatus === 'PAID') {
                // Proses pembayaran sukses
                $this->handlePaymentSuccess($transaction, [
                    'status' => 'PAID',
                    'data' => $statusResult,
                ]);

                return response()->json([
                    'data' => [
                        'order_id' => $transaction->order_id,
                        'status' => 'paid',
                        'message' => 'Pembayaran berhasil!',
                    ],
                ]);
            }

            if ($klikqrisStatus === 'EXPIRED') {
                $transaction->update([
                    'status' => 'expired',
                    'payment_response' => $statusResult,
                ]);

                return response()->json([
                    'data' => [
                        'order_id' => $transaction->order_id,
                        'status' => 'expired',
                        'message' => 'Transaksi sudah kedaluwarsa.',
                    ],
                ]);
            }

            return response()->json([
                'data' => [
                    'order_id' => $transaction->order_id,
                    'status' => 'pending',
                    'message' => 'Menunggu pembayaran...',
                    'expired_at' => $statusResult['expired_at'] ?? null,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('BillingController: Check payment status failed', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'data' => [
                    'order_id' => $transaction->order_id,
                    'status' => $transaction->status,
                    'message' => 'Gagal mengecek status pembayaran.',
                ],
            ]);
        }
    }

    // ──────────────────────────────────────────────
    // Webhook (KlikQRIS Notification)
    // ──────────────────────────────────────────────

    /**
     * Handle webhook notification dari KlikQRIS.
     *
     * Endpoint ini HARUS public (tanpa auth middleware)
     * karena dipanggil langsung oleh server KlikQRIS.
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        $payload = $request->all();

        Log::info('BillingController: Received KlikQRIS webhook', [
            'order_id' => $payload['data']['order_id'] ?? 'unknown',
            'status' => $payload['data']['status'] ?? 'unknown',
        ]);

        $data = $payload['data'] ?? [];
        $orderId = $data['order_id'] ?? null;
        $receivedSignature = $data['signature'] ?? null;
        $paymentStatus = strtoupper($data['status'] ?? '');

        if (! $orderId) {
            Log::warning('BillingController: Webhook missing order_id');

            return response()->json(['message' => 'Missing order_id'], 400);
        }

        // Cari transaksi berdasarkan order_id
        $transaction = Transaction::where('order_id', $orderId)->first();

        if (! $transaction) {
            Log::warning('BillingController: Transaction not found for webhook', [
                'order_id' => $orderId,
            ]);

            return response()->json(['message' => 'Transaction not found'], 404);
        }

        // Validasi signature: bandingkan signature webhook dengan yang disimpan saat create
        if ($receivedSignature && $transaction->payment_signature) {
            if (! $this->klikQrisService->verifySignature($receivedSignature, $transaction->payment_signature)) {
                Log::warning('BillingController: Invalid webhook signature', [
                    'order_id' => $orderId,
                ]);

                return response()->json(['message' => 'Invalid signature'], 403);
            }
        }

        // Handle berdasarkan status
        if ($paymentStatus === 'PAID' || $paymentStatus === 'SUCCESS') {
            $this->handlePaymentSuccess($transaction, $payload);
        } elseif ($paymentStatus === 'EXPIRED') {
            $this->handlePaymentExpired($transaction, $payload);
        }

        // KlikQRIS expects HTTP 200
        return response()->json(['message' => 'OK']);
    }

    /**
     * Handle pembayaran sukses (PAID/SUCCESS).
     */
    private function handlePaymentSuccess(Transaction $transaction, array $payload): void
    {
        // Skip jika sudah paid (idempotent)
        if ($transaction->isPaid()) {
            Log::info('BillingController: Transaction already paid, skipping', [
                'order_id' => $transaction->order_id,
            ]);

            return;
        }

        DB::transaction(function () use ($transaction, $payload) {
            // Update transaction
            $transaction->update([
                'status' => 'paid',
                'paid_at' => now(),
                'payment_type' => 'qris',
                'payment_transaction_id' => $payload['data']['order_id'] ?? null,
                'payment_response' => $payload,
            ]);

            $user = $transaction->user;
            $plan = $transaction->plan;

            // Expire subscription lama yang masih active di plan lain
            Subscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->where('plan_id', '!=', $plan->id)
                ->update(['status' => 'expired']);

            // Buat atau update subscription
            $subscription = Subscription::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'plan_id' => $plan->id,
                ],
                [
                    'status' => 'active',
                    'token_quota' => $plan->token_quota,
                    'token_used' => 0,
                    'starts_at' => now(),
                    'expires_at' => now()->addDays(30),
                ]
            );

            // Initialize quota di Redis
            $this->quotaService->initializeQuota($subscription);

            // Refresh API key cache karena subscription berubah
            $this->refreshUserApiKeyCache($user->id);

            Log::info('BillingController: Payment success processed', [
                'order_id' => $transaction->order_id,
                'user_id' => $user->id,
                'plan' => $plan->slug,
                'subscription_id' => $subscription->id,
            ]);
        });
    }

    /**
     * Handle pembayaran expired.
     */
    private function handlePaymentExpired(Transaction $transaction, array $payload): void
    {
        $transaction->update([
            'status' => 'expired',
            'payment_response' => $payload,
        ]);

        Log::info('BillingController: Payment expired', [
            'order_id' => $transaction->order_id,
        ]);
    }

    /**
     * Refresh cache API keys milik user tertentu.
     */
    private function refreshUserApiKeyCache(int $userId): void
    {
        $apiKeys = \App\Models\ApiKey::where('user_id', $userId)
            ->where('status', 'active')
            ->get();

        foreach ($apiKeys as $apiKey) {
            $this->apiKeyCacheService->cacheKey($apiKey);
        }

        Log::info('BillingController: Refreshed API key cache for user', [
            'user_id' => $userId,
            'keys_refreshed' => $apiKeys->count(),
        ]);
    }

    // ──────────────────────────────────────────────
    // Transactions
    // ──────────────────────────────────────────────

    /**
     * Return paginated list transaksi user (terbaru dulu).
     */
    public function transactions(Request $request): AnonymousResourceCollection
    {
        $transactions = Transaction::where('user_id', $request->user()->id)
            ->with('plan')
            ->orderByDesc('created_at')
            ->paginate(15);

        return TransactionResource::collection($transactions);
    }

    /**
     * Return detail transaksi tertentu milik user.
     */
    public function transactionDetail(Request $request, int $id): TransactionResource|JsonResponse
    {
        $transaction = Transaction::where('user_id', $request->user()->id)
            ->with('plan')
            ->find($id);

        if (! $transaction) {
            return response()->json([
                'message' => 'Transaksi tidak ditemukan.',
            ], 404);
        }

        return new TransactionResource($transaction);
    }
}
