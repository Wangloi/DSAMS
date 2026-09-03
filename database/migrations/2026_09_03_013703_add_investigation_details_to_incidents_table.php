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
        if (!Schema::hasColumn('incidents', 'investigation_details')) {
            Schema::table('incidents', function (Blueprint $table) {
                $table->json('investigation_details')->nullable()->after('calling_phase_history');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('incidents', 'investigation_details')) {
            Schema::table('incidents', function (Blueprint $table) {
                $table->dropColumn('investigation_details');
            });
        }
    }
};
