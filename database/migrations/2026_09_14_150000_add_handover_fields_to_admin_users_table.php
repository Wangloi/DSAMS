<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admin_users', function (Blueprint $table) {
            if (!Schema::hasColumn('admin_users', 'handover_expires_at')) {
                $table->timestamp('handover_expires_at')->nullable()->after('password');
            }
            if (!Schema::hasColumn('admin_users', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('handover_expires_at');
            }
            if (!Schema::hasColumn('admin_users', 'created_by_admin_id')) {
                $table->unsignedBigInteger('created_by_admin_id')->nullable()->after('is_active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('admin_users', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('admin_users', 'handover_expires_at')) {
                $columnsToDrop[] = 'handover_expires_at';
            }
            if (Schema::hasColumn('admin_users', 'is_active')) {
                $columnsToDrop[] = 'is_active';
            }
            if (Schema::hasColumn('admin_users', 'created_by_admin_id')) {
                $columnsToDrop[] = 'created_by_admin_id';
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
