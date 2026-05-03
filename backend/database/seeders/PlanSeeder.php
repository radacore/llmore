<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Seed paket/pricing plans.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Free',
                'slug' => 'free',
                'description' => 'Paket gratis untuk mencoba layanan LLMore.id.',
                'price' => 0,
                'token_quota' => 10000,
                'rate_limit_per_minute' => 5,
                'max_api_keys' => 1,
                'features' => json_encode(['basic_models']),
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Mahasiswa',
                'slug' => 'mahasiswa',
                'description' => 'Paket khusus mahasiswa dengan harga terjangkau.',
                'price' => 25000,
                'token_quota' => 100000,
                'rate_limit_per_minute' => 20,
                'max_api_keys' => 2,
                'features' => json_encode(['basic_models', 'priority_support']),
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'description' => 'Paket profesional untuk developer dan bisnis kecil.',
                'price' => 150000,
                'token_quota' => 1000000,
                'rate_limit_per_minute' => 100,
                'max_api_keys' => 10,
                'features' => json_encode(['all_models', 'priority_support', 'analytics']),
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Custom plan for enterprise. Contact us.',
                'price' => 0,
                'token_quota' => 0,
                'rate_limit_per_minute' => 0,
                'max_api_keys' => 0,
                'features' => json_encode(['all_models', 'dedicated_support', 'analytics', 'custom_models', 'sla']),
                'is_active' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }
    }
}
