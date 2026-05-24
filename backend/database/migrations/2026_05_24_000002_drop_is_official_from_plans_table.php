<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('plans', 'is_official')) {
            Schema::table('plans', function (Blueprint $table) {
                $table->dropColumn('is_official');
            });
        }
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->boolean('is_official')->default(false)->after('is_active');
        });

        DB::table('plans')
            ->whereIn('slug', ['basic', 'pro', 'advance'])
            ->update(['is_official' => true]);
    }
};
