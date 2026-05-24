<?php

use App\Models\Plan;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pisahkan plan resmi (dari Plan::officialPricingPlans) vs plan custom
     * admin agar syncOfficialPricingPlans tidak menonaktifkan plan custom.
     */
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->boolean('is_official')->default(false)->after('is_active');
        });

        // Backfill: plan dengan slug yang match officialPricingPlans ditandai official.
        $officialSlugs = array_column(Plan::officialPricingPlans(), 'slug');
        if (! empty($officialSlugs)) {
            Plan::query()
                ->whereIn('slug', $officialSlugs)
                ->update(['is_official' => true]);
        }
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn('is_official');
        });
    }
};
