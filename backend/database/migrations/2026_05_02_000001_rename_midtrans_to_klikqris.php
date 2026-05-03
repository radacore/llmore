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
        Schema::table('transactions', function (Blueprint $table) {
            $table->renameColumn('midtrans_transaction_id', 'payment_transaction_id');
            $table->renameColumn('midtrans_response', 'payment_response');
        });

        // Tambah kolom signature dalam call terpisah karena rename + add dalam satu call bisa bermasalah
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('payment_signature')->nullable()->after('payment_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('payment_signature');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->renameColumn('payment_transaction_id', 'midtrans_transaction_id');
            $table->renameColumn('payment_response', 'midtrans_response');
        });
    }
};
