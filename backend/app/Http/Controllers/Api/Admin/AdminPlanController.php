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
     * List semua plan (official + custom) dengan count active subscriptions.
     *
     * Plan official ditampilkan dulu agar konsisten dengan landing page,
     * lalu plan custom buatan admin di bawahnya.
     */
    public function index(): JsonResponse
    {
        Plan::syncOfficialPricingPlans();

        $plans = Plan::withCount(['subscriptions' => fn ($q) => $q->where('status', 'active')])
            ->orderByDesc('is_official')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $plans->map(fn ($plan) => array_merge(
                (new PlanResource($plan))->resolve(),
                [
                    'is_active' => $plan->is_active,
                    'is_official' => $plan->is_official,
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

        // Plan buatan admin selalu non-official supaya tidak ikut disentuh syncOfficialPricingPlans.
        $validated['is_official'] = false;

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
     * Plan official: slug tidak bisa diubah (jadi anchor untuk sync), tapi
     * harga/kuota/dll boleh — perubahan akan ditimpa ulang oleh sync kecuali
     * array di Plan::officialPricingPlans() juga diupdate.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $plan = Plan::findOrFail($id);

        $rules = [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'price' => 'sometimes|required|integer|min:0',
            'token_quota' => 'sometimes|required|integer|min:0',
            'rate_limit_per_minute' => 'sometimes|required|integer|min:1',
            'max_api_keys' => 'sometimes|required|integer|min:1',
            'features' => 'nullable|array',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ];

        if (! $plan->is_official) {
            $rules['slug'] = 'sometimes|required|string|max:255|unique:plans,slug,' . $plan->id;
        }

        $validated = $request->validate($rules);

        // is_official tidak pernah bisa diubah dari API.
        unset($validated['is_official']);

        $plan->update($validated);

        return response()->json([
            'message' => 'Plan berhasil diperbarui. Perubahan tidak berlaku retroaktif untuk subscription yang sudah aktif.',
            'data' => new PlanResource($plan->fresh()),
        ]);
    }

    /**
     * Hapus plan custom.
     *
     * Invariants yang dijaga:
     * - Plan official TIDAK pernah bisa dihapus (anchor untuk sync). Admin
     *   yang ingin "menyembunyikan" plan official cukup set is_active=false.
     * - Plan dengan subscription aktif ditolak (mencegah orphan billing).
     * - Plan dengan riwayat subscription/transaction apa pun ditolak agar
     *   audit trail historis tetap utuh. DB sendiri juga ON DELETE RESTRICT,
     *   tapi check eksplisit di sini memberi pesan ramah ke admin.
     */
    public function destroy(string $id): JsonResponse
    {
        $plan = Plan::withCount(['subscriptions', 'transactions'])->findOrFail($id);

        if ($plan->is_official) {
            return response()->json([
                'message' => 'Plan official tidak dapat dihapus. Set is_active=false untuk menyembunyikan plan dari publik.',
            ], 422);
        }

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
