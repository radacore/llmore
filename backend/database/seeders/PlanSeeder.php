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
        $plans = Plan::officialPricingPlans();

        Plan::whereNotIn('slug', array_column($plans, 'slug'))
            ->whereDoesntHave('subscriptions')
            ->whereDoesntHave('transactions')
            ->delete();

        Plan::whereNotIn('slug', array_column($plans, 'slug'))
            ->update(['is_active' => false]);

        Plan::syncOfficialPricingPlans();
    }
}
