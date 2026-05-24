<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PlanResource;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPlanController extends Controller
{
    public function index(): JsonResponse
    {
        $plans = Plan::withCount(['subscriptions' => fn ($q) => $q->where('status', 'active')])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $plans->map(fn ($plan) => array_merge(
                (new PlanResource($plan))->resolve(),
                [
                    'is_active' => $plan->is_active,
                    'active_subscriptions_count' => $plan->subscriptions_count,
                ]
            )),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:plans,slug',
            'description' => 'nullable|string|max:1000',
            'price' => 'required|integer|min:0',
            'token_quota' => 'required|integer|min:0',
            'rate_limit_per_minute' => 'required|integer|min:1',
            'max_api_keys' => 'required|integer|min:1',
            'features' => 'nullable|array',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $plan = Plan::create($validated);

        return response()->json([
            'message' => 'Plan berhasil dibuat.',
            'data' => new PlanResource($plan),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $plan = Plan::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|max:255|unique:plans,slug,' . $plan->id,
            'description' => 'nullable|string|max:1000',
            'price' => 'sometimes|required|integer|min:0',
            'token_quota' => 'sometimes|required|integer|min:0',
            'rate_limit_per_minute' => 'sometimes|required|integer|min:1',
            'max_api_keys' => 'sometimes|required|integer|min:1',
            'features' => 'nullable|array',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $plan->update($validated);

        return response()->json([
            'message' => 'Plan berhasil diperbarui. Perubahan tidak berlaku retroaktif untuk subscription yang sudah aktif.',
            'data' => new PlanResource($plan->fresh()),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $plan = Plan::withCount(['subscriptions', 'transactions'])->findOrFail($id);

        $activeSubscriptions = $plan->subscriptions()
            ->where('status', 'active')
            ->count();

        if ($activeSubscriptions > 0) {
            return response()->json([
                'message' => "Plan masih dipakai oleh {$activeSubscriptions} subscription aktif. Tunggu sampai semua subscription berakhir, atau migrasikan dulu user ke plan lain.",
            ], 422);
        }

        if ($plan->subscriptions_count > 0 || $plan->transactions_count > 0) {
            return response()->json([
                'message' => "Plan punya riwayat {$plan->subscriptions_count} subscription dan {$plan->transactions_count} transaksi. Hapus akan merusak audit trail; set is_active=false saja.",
            ], 422);
        }

        $planName = $plan->name;
        $plan->delete();

        return response()->json([
            'message' => "Plan \"{$planName}\" berhasil dihapus.",
        ]);
    }
}
