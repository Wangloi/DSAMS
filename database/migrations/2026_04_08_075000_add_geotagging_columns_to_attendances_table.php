<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->timestamp('checked_in_at')->nullable()->after('scanned_at');
            $table->timestamp('checked_out_at')->nullable()->after('checked_in_at');

            $table->decimal('check_in_latitude', 10, 7)->nullable()->after('checked_out_at');
            $table->decimal('check_in_longitude', 10, 7)->nullable()->after('check_in_latitude');
            $table->unsignedInteger('check_in_accuracy_m')->nullable()->after('check_in_longitude');
            $table->unsignedInteger('check_in_distance_m')->nullable()->after('check_in_accuracy_m');

            $table->decimal('check_out_latitude', 10, 7)->nullable()->after('check_in_distance_m');
            $table->decimal('check_out_longitude', 10, 7)->nullable()->after('check_out_latitude');
            $table->unsignedInteger('check_out_accuracy_m')->nullable()->after('check_out_longitude');
            $table->unsignedInteger('check_out_distance_m')->nullable()->after('check_out_accuracy_m');

            $table->boolean('is_manual_override')->default(false)->after('check_out_distance_m');
            $table->unsignedBigInteger('manual_override_by_admin_id')->nullable()->after('is_manual_override');
            $table->string('manual_override_reason')->nullable()->after('manual_override_by_admin_id');
            $table->text('manual_override_notes')->nullable()->after('manual_override_reason');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn([
                'checked_in_at',
                'checked_out_at',
                'check_in_latitude',
                'check_in_longitude',
                'check_in_accuracy_m',
                'check_in_distance_m',
                'check_out_latitude',
                'check_out_longitude',
                'check_out_accuracy_m',
                'check_out_distance_m',
                'is_manual_override',
                'manual_override_by_admin_id',
                'manual_override_reason',
                'manual_override_notes',
            ]);
        });
    }
};
