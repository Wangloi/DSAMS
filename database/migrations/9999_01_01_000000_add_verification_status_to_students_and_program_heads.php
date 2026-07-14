<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('students') && !Schema::hasColumn('students', 'verification_status')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('verification_status', 20)->default('pending');
            });
        }

        if (Schema::hasTable('program_heads') && !Schema::hasColumn('program_heads', 'verification_status')) {
            Schema::table('program_heads', function (Blueprint $table) {
                $table->string('verification_status', 20)->default('pending');
            });
        }

        // If legacy `status` exists (pending/approved/rejected), migrate its values.
        // Keeps existing data meaningful after introducing the new field.
        if (Schema::hasColumn('students', 'status') && Schema::hasColumn('students', 'verification_status')) {
            DB::table('students')->update([
                'verification_status' => DB::raw("CASE WHEN status IN ('approved','rejected','pending') THEN status ELSE 'pending' END"),
            ]);
        }

        // For program_heads we currently don't have legacy status; they remain pending by default.
    }

    public function down(): void
    {
        if (Schema::hasTable('students') && Schema::hasColumn('students', 'verification_status')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropColumn('verification_status');
            });
        }

        if (Schema::hasTable('program_heads') && Schema::hasColumn('program_heads', 'verification_status')) {
            Schema::table('program_heads', function (Blueprint $table) {
                $table->dropColumn('verification_status');
            });
        }
    }
};

