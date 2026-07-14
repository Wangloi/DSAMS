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
        Schema::table('found_items', function (Blueprint $table) {
            $table->string('claimed_by')->nullable()->after('status');
            $table->text('admin_notes')->nullable()->after('claimed_by');
            $table->timestamp('claimed_at')->nullable()->after('admin_notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('found_items', function (Blueprint $table) {
            $table->dropColumn(['claimed_by', 'admin_notes', 'claimed_at']);
        });
    }
};
