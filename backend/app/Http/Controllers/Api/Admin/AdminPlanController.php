<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PlanResource;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPlanController extends Controller
{
    /**
     * Return official plans dengan count active subscriptions.
     */
    public function index(): JsonResponse
    {
        Plan::syncOfficialPricingPlans();

        $plans = Plan::withCount(['subscriptions' => fn ($q) => $q->where('status', 'active')])
            ->whereIn('slug', Plan::officialPricingSlugs())
            ->orderBy('sort_order')
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

    /**
     * Create plan baru.
     *
     * Validasi: name, slug (unique), price, token_quota,
     * rate_limit_per_minute, max_api_keys.
     */
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

    /**
     * Update plan yang sudah ada.
     *
     * CATATAN: Perubahan plan TIDAK retroaktif ke subscription yang sudah active.
     * Slug harus unique kecuali milik plan ini sendiri.
     */
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
}
