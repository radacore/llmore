<?php

use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminPlanController;
use App\Http\Controllers\Api\Admin\AdminTransactionController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\ApiKeyController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\ModelController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Semua route di file ini otomatis diberi prefix /api
| oleh konfigurasi routing di bootstrap/app.php.
|
*/

// ──────────────────────────────────────────────
// Auth Routes (public)
// ──────────────────────────────────────────────

Route::prefix('auth')->group(function () {
    Route::post('/google', [AuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    // Logout membutuhkan autentikasi
    Route::post('/logout', [AuthController::class, 'logout'])
        ->middleware(['auth:sanctum', 'active']);
});

// ──────────────────────────────────────────────
// User Profile Routes (auth required)
// ──────────────────────────────────────────────

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('/user', [UserController::class, 'profile']);
    Route::put('/user', [UserController::class, 'update']);
    Route::get('/user/subscription', [UserController::class, 'subscription']);
    Route::get('/user/usage-summary', [UserController::class, 'usageSummary']);

    // ──────────────────────────────────────────────
    // API Key Management Routes
    // ──────────────────────────────────────────────

    Route::get('/api-keys', [ApiKeyController::class, 'index']);
    Route::post('/api-keys', [ApiKeyController::class, 'store']);
    Route::get('/api-keys/{id}', [ApiKeyController::class, 'show']);
    Route::delete('/api-keys/{id}', [ApiKeyController::class, 'revoke']);

    // ──────────────────────────────────────────────
    // Billing Routes (auth required)
    // ──────────────────────────────────────────────

    Route::post('/billing/purchase', [BillingController::class, 'purchase']);
    Route::get('/billing/transactions', [BillingController::class, 'transactions']);
    Route::get('/billing/transactions/{id}', [BillingController::class, 'transactionDetail']);
    Route::get('/billing/payment-status/{orderId}', [BillingController::class, 'checkPaymentStatus']);

    // ──────────────────────────────────────────────
    // AI Models Routes
    // ──────────────────────────────────────────────

    Route::get('/models', [ModelController::class, 'index']);
});

// ──────────────────────────────────────────────
// Public Routes (no auth)
// ──────────────────────────────────────────────

// Plans - bisa diakses tanpa auth
Route::get('/plans', [BillingController::class, 'plans']);

// KlikQRIS Webhook - HARUS public, dipanggil oleh server KlikQRIS
Route::post('/payment/webhook', [BillingController::class, 'handleWebhook']);

// ──────────────────────────────────────────────
// Admin Routes (auth:sanctum + active + admin)
// ──────────────────────────────────────────────

Route::prefix('admin')->middleware(['auth:sanctum', 'active', 'admin'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);

    // User Management
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::get('/users/{id}', [AdminUserController::class, 'show']);
    Route::put('/users/{id}/status', [AdminUserController::class, 'updateStatus']);
    Route::put('/users/{id}/role', [AdminUserController::class, 'updateRole']);
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
    Route::post('/users/{id}/quota', [AdminUserController::class, 'adjustQuota']);
    Route::post('/users/{id}/activate-enterprise', [AdminUserController::class, 'activateEnterprise']);

    // Transaction Management
    Route::get('/transactions', [AdminTransactionController::class, 'index']);
    Route::get('/transactions/{id}', [AdminTransactionController::class, 'show']);

    // Plan Management
    Route::get('/plans', [AdminPlanController::class, 'index']);
    Route::post('/plans', [AdminPlanController::class, 'store']);
    Route::put('/plans/{id}', [AdminPlanController::class, 'update']);
    Route::delete('/plans/{id}', [AdminPlanController::class, 'destroy']);

    // System Health
    Route::get('/system/health', [AdminDashboardController::class, 'health']);
});
