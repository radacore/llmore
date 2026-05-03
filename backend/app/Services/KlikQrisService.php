<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class KlikQrisService
{
    /**
     * KlikQRIS API Key.
     */
    private string $apiKey;

    /**
     * KlikQRIS Merchant ID.
     */
    private string $merchantId;

    /**
     * Base URL untuk KlikQRIS API.
     */
    private string $baseUrl = 'https://klikqris.com/api';

    public function __construct()
    {
        $this->apiKey = config('services.klikqris.api_key');
        $this->merchantId = config('services.klikqris.merchant_id');
    }

    /**
     * Buat transaksi pembayaran QRIS via KlikQRIS.
     *
     * @return array{order_id: string, amount: string, total_amount: string, status: string, direct_url: string, qris_url: string, expired_at: string, signature: string}
     *
     * @throws \Exception
     */
    public function createTransaction(User $user, Plan $plan, string $orderId, ?int $customAmount = null, ?string $keterangan = null): array
    {
        $amount = $customAmount ?? $plan->price;
        $description = $keterangan ?? "Pembayaran Paket {$plan->name} - {$user->email}";

        Log::info('KlikQrisService: Creating transaction', [
            'order_id' => $orderId,
            'amount' => $amount,
            'user_id' => $user->id,
        ]);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'x-api-key' => $this->apiKey,
            'id_merchant' => $this->merchantId,
        ])->post("{$this->baseUrl}/qris/create", [
            'order_id' => $orderId,
            'id_merchant' => $this->merchantId,
            'amount' => $amount,
            'keterangan' => $description,
        ]);

        if (! $response->successful() || ! $response->json('status')) {
            Log::error('KlikQrisService: Failed to create transaction', [
                'order_id' => $orderId,
                'response_status' => $response->status(),
                'response_body' => $response->body(),
            ]);

            throw new \Exception('Failed to create KlikQRIS transaction: ' . $response->body());
        }

        Log::info('KlikQrisService: Transaction created successfully', [
            'order_id' => $orderId,
            'total_amount' => $response->json('data.total_amount'),
        ]);

        return $response->json('data');
    }

    /**
     * Cek status transaksi di KlikQRIS.
     *
     * @return array{order_id: string, status: string, total_amount: int, expired_at: string}
     *
     * @throws \Exception
     */
    public function checkStatus(string $orderId): array
    {
        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey,
            'id_merchant' => $this->merchantId,
        ])->get("{$this->baseUrl}/qris/status/{$orderId}");

        if (! $response->successful()) {
            Log::error('KlikQrisService: Failed to check status', [
                'order_id' => $orderId,
                'response_status' => $response->status(),
                'response_body' => $response->body(),
            ]);

            throw new \Exception('Failed to check KlikQRIS status: ' . $response->body());
        }

        return $response->json('data');
    }

    /**
     * Verifikasi signature dari webhook KlikQRIS.
     *
     * Bandingkan signature yang diterima di webhook dengan
     * signature yang disimpan saat create transaction.
     */
    public function verifySignature(string $receivedSignature, string $storedSignature): bool
    {
        return hash_equals($storedSignature, $receivedSignature);
    }
}
