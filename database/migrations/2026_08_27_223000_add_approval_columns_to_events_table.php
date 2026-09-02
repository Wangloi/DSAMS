<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('events')) {
            Schema::table('events', function (Blueprint $table) {
                if (!Schema::hasColumn('events', 'approval_status')) {
                    $table->string('approval_status', 20)->default('approved');
                }
                if (!Schema::hasColumn('events', 'activity_plan_path')) {
                    $table->string('activity_plan_path')->nullable();
                }
                if (!Schema::hasColumn('events', 'requested_by')) {
                    $table->string('requested_by')->nullable();
                }
                if (!Schema::hasColumn('events', 'rejection_reason')) {
                    $table->text('rejection_reason')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('events')) {
            Schema::table('events', function (Blueprint $table) {
                if (Schema::hasColumn('events', 'approval_status')) {
                    $table->dropColumn('approval_status');
                }
                if (Schema::hasColumn('events', 'activity_plan_path')) {
                    $table->dropColumn('activity_plan_path');
                }
                if (Schema::hasColumn('events', 'requested_by')) {
                    $table->dropColumn('requested_by');
                }
                if (Schema::hasColumn('events', 'rejection_reason')) {
                    $table->dropColumn('rejection_reason');
                }
            });
        }
    }
};
