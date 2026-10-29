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
                if (! Schema::hasColumn('attendances', 'mid_session_verified_at')) {
                    $table->timestamp('mid_session_verified_at')->nullable()->after('checked_out_at');
                }
                if (! Schema::hasColumn('attendances', 'is_flagged')) {
                    $table->boolean('is_flagged')->default(false)->after('mid_session_verified_at');
                }
                if (! Schema::hasColumn('attendances', 'flagged_reason')) {
                    $table->string('flagged_reason', 255)->nullable()->after('is_flagged');
                }
                if (! Schema::hasColumn('attendances', 'flag_cleared_by_admin_id')) {
                    $table->unsignedBigInteger('flag_cleared_by_admin_id')->nullable()->after('flagged_reason');
                }
                if (! Schema::hasColumn('attendances', 'flag_cleared_at')) {
                    $table->timestamp('flag_cleared_at')->nullable()->after('flag_cleared_by_admin_id');
                }
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
                $columns = array_filter([
                    Schema::hasColumn('attendances', 'mid_session_verified_at') ? 'mid_session_verified_at' : null,
                    Schema::hasColumn('attendances', 'is_flagged') ? 'is_flagged' : null,
                    Schema::hasColumn('attendances', 'flagged_reason') ? 'flagged_reason' : null,
                    Schema::hasColumn('attendances', 'flag_cleared_by_admin_id') ? 'flag_cleared_by_admin_id' : null,
                    Schema::hasColumn('attendances', 'flag_cleared_at') ? 'flag_cleared_at' : null,
                ]);
                if (! empty($columns)) {
                    $table->dropColumn(array_values($columns));
                }
            });
        }
    }
};
