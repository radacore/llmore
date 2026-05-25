<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionResource;
use App\Http\Resources\UserResource;
use App\Models\UsageLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Get profil user yang sedang login.
     *
     * Include active subscription beserta plan info.
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        $activeSubscription = $user->activeSubscription();

        $response = [
            'user' => new UserResource($user),
        ];

        if ($activeSubscription) {
            $activeSubscription->load('plan');
            $response['subscription'] = new SubscriptionResource($activeSubscription);
        }

        return response()->json($response);
    }

    /**
     * Update profil user.
     *
     * Saat ini hanya mendukung update field 'name'.
     */
    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'validation_error',
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        if ($request->has('name')) {
            $user->update(['name' => $request->name]);
        }

        return response()->json([
            'user' => new UserResource($user->fresh()),
        ]);
    }

    /**
     * Get active subscription user beserta detail plan.
     *
     * Include remaining tokens, usage percentage, dan expires_at.
     */
    public function subscription(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = $user->activeSubscription();

        if (! $subscription) {
            return response()->json([
                'message' => 'No active subscription found.',
                'subscription' => null,
            ]);
        }

        $subscription->load('plan');

        return response()->json([
            'subscription' => new SubscriptionResource($subscription),
        ]);
    }

    /**
     * Get usage summary untuk user.
     *
     * Hasil di-scope ke subscription aktif saat ini: penggunaan dari plan lama
     * (yang sudah expired) TIDAK ikut diagregat. Tanpa filter ini, card "Token
     * Terpakai" akan terlihat tidak sinkron dengan "Sisa Token" setiap kali
     * user pindah plan, karena Redis quota di-reset per subscription baru tapi
     * usage_logs historis tetap ada untuk audit.
     */
    public function usageSummary(Request $request): JsonResponse
    {
        $user = $request->user();
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();
        $sevenDaysAgo = $now->copy()->subDays(7)->startOfDay();

        $activeSubscription = $user->activeSubscription();
        $activeSubscriptionId = $activeSubscription?->id;

        $baseQuery = fn () => UsageLog::where('user_id', $user->id)
            ->when($activeSubscriptionId, fn ($q) => $q->where('subscription_id', $activeSubscriptionId));

        // Total token dipakai bulan ini
        $monthlyTokens = $baseQuery()
            ->where('created_at', '>=', $startOfMonth)
            ->sum('total_tokens');

        // Total request bulan ini
        $monthlyRequests = $baseQuery()
            ->where('created_at', '>=', $startOfMonth)
            ->count();

        // Usage per hari (7 hari terakhir)
        $dailyUsage = $baseQuery()
            ->where('created_at', '>=', $sevenDaysAgo)
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_tokens) as tokens'),
                DB::raw('COUNT(*) as requests')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'asc')
            ->get();

        // Top models used (bulan ini)
        $topModels = $baseQuery()
            ->where('created_at', '>=', $startOfMonth)
            ->select(
                'model',
                DB::raw('COUNT(*) as request_count'),
                DB::raw('SUM(total_tokens) as total_tokens')
            )
            ->groupBy('model')
            ->orderByDesc('request_count')
            ->limit(5)
            ->get();

        // Average response time bulan ini
        $avgResponseTime = $baseQuery()
            ->where('created_at', '>=', $startOfMonth)
            ->where('response_time_ms', '>', 0)
            ->avg('response_time_ms');

        return response()->json([
            'monthly_tokens' => (int) $monthlyTokens,
            'monthly_requests' => (int) $monthlyRequests,
            'avg_response_time_ms' => (int) round($avgResponseTime ?? 0),
            'daily_usage' => $dailyUsage,
            'top_models' => $topModels,
        ]);
    }
}
