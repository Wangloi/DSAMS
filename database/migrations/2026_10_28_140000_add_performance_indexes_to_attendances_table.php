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
        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $table) {
                // High-performance composite indexes for QR attendance monitoring & reports
                $table->index(['event_id', 'status'], 'attendances_event_id_status_idx');
                $table->index(['event_id', 'scanned_at'], 'attendances_event_id_scanned_at_idx');
                $table->index(['event_id', 'checked_in_at'], 'attendances_event_id_checked_in_at_idx');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->dropIndex('attendances_event_id_status_idx');
                $table->dropIndex('attendances_event_id_scanned_at_idx');
                $table->dropIndex('attendances_event_id_checked_in_at_idx');
            });
        }
    }
};
