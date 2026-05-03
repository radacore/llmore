<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Free, Mahasiswa, Pro, Enterprise
            $table->string('slug')->unique(); // free, mahasiswa, pro, enterprise
            $table->text('description')->nullable();
            $table->integer('price'); // harga dalam rupiah (0 untuk free)
            $table->integer('token_quota'); // jumlah token per bulan
            $table->integer('rate_limit_per_minute'); // req per menit
            $table->integer('max_api_keys'); // jumlah max API keys
            $table->json('features')->nullable(); // fitur tambahan dalam JSON
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
