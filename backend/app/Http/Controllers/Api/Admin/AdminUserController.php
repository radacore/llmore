<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminUserResource;
use App\Http\Resources\ApiKeyResource;
use App\Http\Resources\SubscriptionResource;
use App\Http\Resources\TransactionResource;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\UsageLog;
use App\Models\User;
use App\Services\ApiKeyCacheService;
use App\Services\QuotaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Validator;

class AdminUserController extends Controller
{
    public function __construct(
        private readonly QuotaService $quotaService,
        private readonly ApiKeyCacheService $apiKeyCacheService,
    ) {}

    /**
     * Paginated list of all users.
     *
     * Filterable: ?status=active, ?role=admin, ?search=keyword
     * Sortable: ?sort=created_at&order=desc
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::query()
            ->withCount("apiKeys")
            ->with([
                "subscriptions" => fn($q) => $q
                    ->where("status", "active")
                    ->with("plan"),
            ]);

        // Filter by status
        if ($request->filled("status")) {
            $query->where("status", $request->input("status"));
        }

        // Filter by role
        if ($request->filled("role")) {
            $query->where("role", $request->input("role"));
        }

        // Search by name or email
        if ($request->filled("search")) {
            $search = $request->input("search");
            $query->where(function ($q) use ($search) {
                $q->where("name", "like", "%{$search}%")->orWhere(
                    "email",
                    "like",
                    "%{$search}%",
                );
            });
        }

        // Sorting
        $sortField = $request->input("sort", "created_at");
        $sortOrder = $request->input("order", "desc");

        $allowedSorts = ["created_at", "name", "email", "status", "role"];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder === "asc" ? "asc" : "desc");
        }

        $users = $query->paginate(15);

        return AdminUserResource::collection($users);
    }

    /**
     * Detail user dengan subscription, API keys, transaksi terakhir, dan usage summary.
     */
    public function show(string $id): JsonResponse
    {
        $user = User::with([
            "subscriptions" => fn($q) => $q
                ->where("status", "active")
                ->with("plan"),
            "apiKeys",
        ])->findOrFail($id);

        $recentTransactions = $user
            ->transactions()
            ->with("plan")
            ->latest()
            ->take(10)
            ->get();

        // Usage summary bulan ini
        $currentMonth = now();
        $totalTokensThisMonth = UsageLog::where("user_id", $user->id)
            ->whereMonth("created_at", $currentMonth->month)
            ->whereYear("created_at", $currentMonth->year)
            ->sum("total_tokens");

        $totalRequestsThisMonth = UsageLog::where("user_id", $user->id)
            ->whereMonth("created_at", $currentMonth->month)
            ->whereYear("created_at", $currentMonth->year)
            ->count();

        $activeSubscription = $user->subscriptions
            ->where("status", "active")
            ->first();

        return response()->json([
            "data" => [
                "user" => new AdminUserResource($user),
                "active_subscription" => $activeSubscription
                    ? new SubscriptionResource(
                        $activeSubscription->load("plan"),
                    )
                    : null,
                "api_keys" => ApiKeyResource::collection($user->apiKeys),
                "recent_transactions" => TransactionResource::collection(
                    $recentTransactions,
                ),
                "usage_summary" => [
                    "total_tokens_this_month" => (int) $totalTokensThisMonth,
                    "total_requests_this_month" => $totalRequestsThisMonth,
                ],
            ],
        ]);
    }

    /**
     * Update status user (active, suspended, inactive).
     *
     * Aturan:
     * - Admin tidak bisa di-suspend / di-nonaktifkan via API.
     * - Admin tidak bisa mengubah status diri sendiri.
     * - Jika suspended: revoke semua API keys dari Redis cache.
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $request->validate([
            "status" => "required|in:active,suspended,inactive",
        ]);

        $user = User::findOrFail($id);

        // Cegah admin mengubah statusnya sendiri
        if ((int) $id === $request->user()->id) {
            return response()->json(
                [
                    "message" =>
                        "Anda tidak dapat mengubah status akun Anda sendiri.",
                ],
                403,
            );
        }

        // Cegah perubahan status untuk user dengan role admin
        if ($user->role === "admin") {
            return response()->json(
                [
                    "message" =>
                        "Status user dengan role admin tidak dapat diubah.",
                ],
                403,
            );
        }

        $user->update(["status" => $request->input("status")]);

        // Jika user di-suspend, invalidate semua API keys dari Redis
        if ($request->input("status") === "suspended") {
            $apiKeys = $user->apiKeys()->where("status", "active")->get();
            foreach ($apiKeys as $apiKey) {
                $this->apiKeyCacheService->invalidateKey($apiKey);
            }
        }

        return response()->json([
            "message" => "Status user berhasil diperbarui.",
            "data" => new AdminUserResource($user->fresh()),
        ]);
    }

    /**
     * Update role user (user, admin).
     *
     * Aturan:
     * - Promote user → admin DINONAKTIFKAN via API. Admin baru hanya boleh
     *   dibuat lewat database seeder/migrasi.
     * - Demote admin → user DINONAKTIFKAN via API.
     * - Endpoint dipertahankan agar route tidak 404, tetapi selalu menolak
     *   request dengan 403.
     */
    public function updateRole(Request $request, string $id): JsonResponse
    {
        $request->validate([
            "role" => "required|in:user,admin",
        ]);

        // Pastikan user-nya ada (404 kalau tidak)
        User::findOrFail($id);

        return response()->json(
            [
                "message" =>
                    "Perubahan role tidak diizinkan via API. " .
                    "Pengelolaan admin harus dilakukan langsung melalui database seeder.",
            ],
            403,
        );
    }

    /**
     * Hapus user biasa beserta data terkaitnya.
     *
     * Aturan:
     * - Admin tidak bisa menghapus akun sendiri.
     * - Akun admin lain tidak bisa dihapus dari endpoint ini.
     * - API key aktif dihapus dari Redis sebelum data user cascade-delete.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = User::with("apiKeys")->findOrFail($id);

        if ((int) $id === $request->user()->id) {
            return response()->json(
                [
                    "message" => "Anda tidak dapat menghapus akun Anda sendiri.",
                ],
                403,
            );
        }

        if ($user->role === "admin") {
            return response()->json(
                [
                    "message" => "User dengan role admin tidak dapat dihapus dari halaman ini.",
                ],
                403,
            );
        }

        foreach ($user->apiKeys as $apiKey) {
            $this->apiKeyCacheService->invalidateKey($apiKey);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            "message" => "User berhasil dihapus.",
        ]);
    }

    /**
     * Adjust token quota untuk user tertentu.
     * Amount bisa positif (tambah) atau negatif (kurangi).
     */
    public function adjustQuota(Request $request, string $id): JsonResponse
    {
        $request->validate([
            "amount" => "required|integer",
            "reason" => "nullable|string|max:500",
        ]);

        $user = User::findOrFail($id);
        $subscription = $user->activeSubscription();

        if (!$subscription) {
            return response()->json(
                [
                    "message" => "User tidak memiliki subscription aktif.",
                ],
                422,
            );
        }

        $amount = $request->input("amount");
        $newQuota = $subscription->token_quota + $amount;

        // Pastikan quota tidak negatif
        if ($newQuota < 0) {
            return response()->json(
                [
                    "message" =>
                        "Kuota tidak boleh menjadi negatif. Kuota saat ini: " .
                        $subscription->token_quota,
                ],
                422,
            );
        }

        // Update di database
        $subscription->update(["token_quota" => $newQuota]);

        // Update di Redis via QuotaService
        $this->quotaService->initializeQuota($subscription->fresh());

        return response()->json([
            "message" => "Kuota berhasil disesuaikan.",
            "new_quota" => $newQuota,
            "adjustment" => $amount,
        ]);
    }

    /**
     * Activate custom token plan untuk user tertentu.
     * Hanya bisa dilakukan oleh admin secara manual.
     */
    public function activateEnterprise(
        Request $request,
        string $id,
    ): JsonResponse {
        $validator = Validator::make($request->all(), [
            "token_quota" => "required|integer|min:1",
            "duration_days" => "required|integer|min:1|max:365",
        ]);

        if ($validator->fails()) {
            return response()->json(["errors" => $validator->errors()], 422);
        }

        $user = User::findOrFail($id);
        $enterprisePlan = Plan::where("slug", "enterprise")->first();

        if (!$enterprisePlan) {
            return response()->json(
                ["error" => "Custom token plan not found"],
                404,
            );
        }

        // Expire existing subscriptions
        Subscription::where("user_id", $user->id)
            ->where("status", "active")
            ->update(["status" => "expired"]);

        // Create custom token subscription
        $subscription = Subscription::create([
            "user_id" => $user->id,
            "plan_id" => $enterprisePlan->id,
            "status" => "active",
            "token_quota" => $request->token_quota,
            "token_used" => 0,
            "starts_at" => now(),
            "expires_at" => now()->addDays($request->duration_days),
        ]);

        // Initialize quota in Redis
        $this->quotaService->initializeQuota($subscription);

        return response()->json([
            "message" => "Custom token plan activated successfully",
            "subscription" => $subscription->load("plan"),
        ]);
    }
}
