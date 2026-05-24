<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Basic',
                'slug' => 'basic',
                'description' => 'Cocok untuk eksperimen, hobi, atau proyek kecil.',
                'price' => 49000,
                'token_quota' => 70000,
                'rate_limit_per_minute' => 30,
                'max_api_keys' => 1,
                'features' => [
                    '70.000 token per bulan',
                    '30 request per menit',
                    '1 API key',
                    'Akses ke semua model utama',
                    'Dukungan email standar',
                ],
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'description' => 'Untuk developer aktif yang butuh kuota lebih besar.',
                'price' => 99000,
                'token_quota' => 150000,
                'rate_limit_per_minute' => 60,
                'max_api_keys' => 3,
                'features' => [
                    '150.000 token per bulan',
                    '60 request per menit',
                    '3 API key',
                    'Akses ke semua model utama',
                    'Dukungan email prioritas',
                ],
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Advance',
                'slug' => 'advance',
                'description' => 'Untuk tim atau aplikasi produksi dengan trafik tinggi.',
                'price' => 199000,
                'token_quota' => 320000,
                'rate_limit_per_minute' => 120,
                'max_api_keys' => 10,
                'features' => [
                    '320.000 token per bulan',
                    '120 request per menit',
                    '10 API key',
                    'Akses ke semua model utama',
                    'Dukungan prioritas + Slack channel',
                ],
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::firstOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
