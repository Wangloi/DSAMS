<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->boolean('geofence_enabled')->default(false)->after('scanner_portal_active');
            $table->decimal('geofence_latitude', 10, 7)->nullable()->after('geofence_enabled');
            $table->decimal('geofence_longitude', 10, 7)->nullable()->after('geofence_latitude');
            $table->unsignedInteger('geofence_radius_m')->default(50)->after('geofence_longitude');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn([
                'geofence_enabled',
                'geofence_latitude',
                'geofence_longitude',
                'geofence_radius_m',
            ]);
        });
    }
};
