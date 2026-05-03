<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Seed admin user with Pro subscription.
     */
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@llmore.id'],
            [
                'name' => 'Admin LLMore',
                'email' => 'admin@llmore.id',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // Give admin a Pro subscription if they don't have one
        $hasActiveSubscription = Subscription::where('user_id', $admin->id)
            ->where('status', 'active')
            ->exists();

        if (!$hasActiveSubscription) {
            $proPlan = Plan::where('slug', 'pro')->first();

            if ($proPlan) {
                Subscription::create([
                    'user_id' => $admin->id,
                    'plan_id' => $proPlan->id,
                    'status' => 'active',
                    'token_quota' => $proPlan->token_quota,
                    'token_used' => 0,
                    'starts_at' => now(),
                    'expires_at' => now()->addYear(),
                ]);
            }
        }
    }
}
