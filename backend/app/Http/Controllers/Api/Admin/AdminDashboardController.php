<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\TransactionResource;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Transaction;
use App\Models\UsageLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class AdminDashboardController extends Controller
{
    /**
     * Dashboard overview statistics.
     *
     * Menampilkan ringkasan: total users, active users, subscriptions,
     * revenue (total, bulan ini, bulan lalu), usage, distribusi plan,
     * dan 10 transaksi terakhir.
     */
    public function index(): JsonResponse
    {
        $now = now();
        $lastMonth = now()->subMonth();
        Plan::syncOfficialPricingPlans();

        // Subquery: ID user non-admin (digunakan untuk exclude admin dari semua metrik user-centric)
        $nonAdminUserIds = User::where("role", "!=", "admin")->pluck("id");

        return response()->json([
            "data" => [
                // Hanya hitung user dengan role 'user' (admin tidak counted)
                "total_users" => User::where("role", "!=", "admin")->count(),
                "active_users" => User::where("role", "!=", "admin")
                    ->where("status", "active")
                    ->count(),
                // Subscription milik admin tidak dihitung
                "total_subscriptions" => Subscription::where("status", "active")
                    ->whereIn("user_id", $nonAdminUserIds)
                    ->count(),
                "revenue" => [
                    "total" => (int) Transaction::where("status", "paid")->sum(
                        "amount",
                    ),
                    "this_month" => (int) Transaction::where("status", "paid")
                        ->whereMonth("paid_at", $now->month)
                        ->whereYear("paid_at", $now->year)
                        ->sum("amount"),
                    "last_month" => (int) Transaction::where("status", "paid")
                        ->whereMonth("paid_at", $lastMonth->month)
                        ->whereYear("paid_at", $lastMonth->year)
                        ->sum("amount"),
                ],
                // Usage admin tidak dihitung
                "usage" => [
                    "total_tokens_this_month" => (int) UsageLog::whereMonth(
                        "created_at",
                        $now->month,
                    )
                        ->whereYear("created_at", $now->year)
                        ->whereIn("user_id", $nonAdminUserIds)
                        ->sum("total_tokens"),
                    "total_requests_this_month" => UsageLog::whereMonth(
                        "created_at",
                        $now->month,
                    )
                        ->whereYear("created_at", $now->year)
                        ->whereIn("user_id", $nonAdminUserIds)
                        ->count(),
                ],
                // Distribusi plan: subscription admin tidak dihitung
                "plans_distribution" => Plan::withCount([
                    "subscriptions" => fn($q) => $q
                        ->where("status", "active")
                        ->whereIn("user_id", $nonAdminUserIds),
                ])
                    ->whereIn("slug", Plan::officialPricingSlugs())
                    ->orderBy("sort_order")
                    ->get()
                    ->map(
                        fn($p) => [
                            "name" => $p->name,
                            "slug" => $p->slug,
                            "active_subscriptions" => $p->subscriptions_count,
                        ],
                    ),
                "recent_transactions" => TransactionResource::collection(
                    Transaction::with("user", "plan")
                        ->latest()
                        ->take(10)
                        ->get(),
                ),
            ],
        ]);
    }

    /**
     * System health check.
     *
     * Mengecek status database, Redis, storage, dan info server.
     */
    public function health(): JsonResponse
    {
        return response()->json([
            "status" => "ok",
            "services" => [
                "database" => $this->checkDatabase(),
                "redis" => $this->checkRedis(),
                "storage" => $this->checkStorage(),
            ],
            "server" => [
                "php_version" => PHP_VERSION,
                "laravel_version" => app()->version(),
                "memory_usage" => memory_get_usage(true),
                "memory_usage_formatted" => $this->formatBytes(
                    memory_get_usage(true),
                ),
            ],
            "timestamp" => now()->toISOString(),
        ]);
    }

    /**
     * Cek koneksi database.
     */
    private function checkDatabase(): array
    {
        try {
            DB::select("SELECT 1");

            return [
                "status" => "ok",
                "message" => "Database connection is healthy.",
            ];
        } catch (\Throwable $e) {
            return [
                "status" => "error",
                "message" => "Database connection failed: " . $e->getMessage(),
            ];
        }
    }

    /**
     * Cek koneksi Redis.
     */
    private function checkRedis(): array
    {
        try {
            $pong = Redis::ping();

            return [
                "status" => "ok",
                "message" => "Redis connection is healthy.",
                "response" => (string) $pong,
            ];
        } catch (\Throwable $e) {
            return [
                "status" => "error",
                "message" => "Redis connection failed: " . $e->getMessage(),
            ];
        }
    }

    /**
     * Cek disk space storage.
     */
    private function checkStorage(): array
    {
        try {
            $storagePath = storage_path();
            $freeBytes = disk_free_space($storagePath);
            $totalBytes = disk_total_space($storagePath);
            $usedPercentage =
                $totalBytes > 0
                    ? round((($totalBytes - $freeBytes) / $totalBytes) * 100, 2)
                    : 0;

            return [
                "status" => $usedPercentage > 90 ? "warning" : "ok",
                "message" => "Disk usage: {$usedPercentage}%",
                "free_space" => $this->formatBytes($freeBytes),
                "total_space" => $this->formatBytes($totalBytes),
                "used_percentage" => $usedPercentage,
            ];
        } catch (\Throwable $e) {
            return [
                "status" => "error",
                "message" => "Storage check failed: " . $e->getMessage(),
            ];
        }
    }

    /**
     * Format bytes menjadi string yang mudah dibaca.
     */
    private function formatBytes(int|float $bytes, int $precision = 2): string
    {
        $units = ["B", "KB", "MB", "GB", "TB"];

        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= 1 << (10 * $pow);

        return round($bytes, $precision) . " " . $units[$pow];
    }
}
