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
        if (Schema::hasTable('students')) {
            Schema::table('students', function (Blueprint $table) {
                if (! Schema::hasColumn('students', 'elementary_year_started')) {
                    $table->integer('elementary_year_started')->nullable()->after('elementary_school');
                }
                if (! Schema::hasColumn('students', 'junior_high_year_started')) {
                    $table->integer('junior_high_year_started')->nullable()->after('junior_high_school');
                }
                if (! Schema::hasColumn('students', 'senior_high_year_started')) {
                    $table->integer('senior_high_year_started')->nullable()->after('senior_high_school');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'elementary_year_started',
                'junior_high_year_started',
                'senior_high_year_started',
            ]);
        });
    }
};
