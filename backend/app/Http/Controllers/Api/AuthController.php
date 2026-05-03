<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionResource;
use App\Http\Resources\UserResource;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Return Google OAuth redirect URL untuk frontend.
     */
    public function redirectToGoogle(): JsonResponse
    {
        $url = Socialite::driver('google')->stateless()->redirect()->getTargetUrl();

        return response()->json([
            'url' => $url,
        ]);
    }

    /**
     * Handle Google OAuth callback.
     *
     * Terima code dari Google, cari/buat user, generate Sanctum token.
     */
    public function handleGoogleCallback(Request $request): JsonResponse
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'google_auth_failed',
                'message' => 'Failed to authenticate with Google.',
            ], 401);
        }

        // Cari user berdasarkan google_id atau email
        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        $isNewUser = false;

        if (! $user) {
            // Buat user baru
            $user = User::create([
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'role' => 'user',
                'status' => 'active',
            ]);

            $isNewUser = true;
        } else {
            // Update google_id dan avatar jika belum diset atau berubah
            $updates = [];

            if (! $user->google_id) {
                $updates['google_id'] = $googleUser->getId();
            }

            if ($googleUser->getAvatar() && $user->avatar !== $googleUser->getAvatar()) {
                $updates['avatar'] = $googleUser->getAvatar();
            }

            if (! empty($updates)) {
                $user->update($updates);
            }
        }

        // Cek status user
        if ($user->status === 'suspended') {
            return response()->json([
                'error' => 'account_suspended',
                'message' => 'Your account has been suspended.',
            ], 403);
        }

        // Berikan paket Free jika user baru
        $subscription = null;
        if ($isNewUser) {
            $subscription = $this->assignFreePlan($user);
        } else {
            $subscription = $user->activeSubscription();
        }

        // Generate Sanctum token
        $token = $user->createToken('auth-token')->plainTextToken;

        $response = [
            'user' => new UserResource($user),
            'token' => $token,
        ];

        if ($subscription) {
            $subscription->load('plan');
            $response['subscription'] = new SubscriptionResource($subscription);
        }

        return response()->json($response, $isNewUser ? 201 : 200);
    }

    /**
     * Login dengan email dan password.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'validation_error',
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        if (! Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'error' => 'invalid_credentials',
                'message' => 'The provided credentials are incorrect.',
            ], 401);
        }

        $user = User::where('email', $request->email)->first();

        // Cek status user
        if ($user->status === 'suspended') {
            return response()->json([
                'error' => 'account_suspended',
                'message' => 'Your account has been suspended.',
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    /**
     * Register user baru dengan email dan password.
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'validation_error',
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'user',
            'status' => 'active',
        ]);

        // Berikan paket Free otomatis
        $subscription = $this->assignFreePlan($user);

        $token = $user->createToken('auth-token')->plainTextToken;

        $response = [
            'user' => new UserResource($user),
            'token' => $token,
        ];

        if ($subscription) {
            $subscription->load('plan');
            $response['subscription'] = new SubscriptionResource($subscription);
        }

        return response()->json($response, 201);
    }

    /**
     * Logout — revoke current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Assign paket Free ke user baru.
     *
     * Buat subscription dengan plan Free, kuota 10.000 token,
     * expires_at 30 hari dari sekarang.
     */
    private function assignFreePlan(User $user): ?Subscription
    {
        $freePlan = Plan::where('slug', 'free')->first();

        if (! $freePlan) {
            return null;
        }

        return Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $freePlan->id,
            'status' => 'active',
            'token_quota' => $freePlan->token_quota ?? 10000,
            'token_used' => 0,
            'starts_at' => now(),
            'expires_at' => now()->addDays(30),
        ]);
    }
}
