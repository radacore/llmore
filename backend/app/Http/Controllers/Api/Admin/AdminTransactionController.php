<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminTransactionResource;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminTransactionController extends Controller
{
    /**
     * Paginated list of ALL transactions (across all users).
     *
     * Filterable: ?status=paid, ?user_id=1, ?date_from=2026-01-01, ?date_to=2026-12-31
     * Include: user (name, email), plan (name)
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Transaction::query()->with(['user', 'plan']);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by user_id
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $transactions = $query->latest()->paginate(15);

        return AdminTransactionResource::collection($transactions);
    }

    /**
     * Detail transaksi dengan full midtrans_response.
     * Include: user, plan.
     */
    public function show(string $id): JsonResponse
    {
        $transaction = Transaction::with(['user', 'plan'])->findOrFail($id);

        return response()->json([
            'data' => new AdminTransactionResource($transaction),
        ]);
    }
}
