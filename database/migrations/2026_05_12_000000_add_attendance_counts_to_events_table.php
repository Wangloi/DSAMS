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
        Schema::table('events', function (Blueprint $table) {
            // Add total_attendees column if it doesn't exist
            if (!Schema::hasColumn('events', 'total_attendees')) {
                $table->integer('total_attendees')->default(0)->after('status');
            }

            // Add present_count column if it doesn't exist
            if (!Schema::hasColumn('events', 'present_count')) {
                $table->integer('present_count')->default(0)->after('total_attendees');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['total_attendees', 'present_count']);
        });
    }
};
