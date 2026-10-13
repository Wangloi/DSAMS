<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('program_heads') && !Schema::hasColumn('program_heads', 'office')) {
            Schema::table('program_heads', function (Blueprint $table) {
                $table->string('office')->nullable()->after('role');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('program_heads') && Schema::hasColumn('program_heads', 'office')) {
            Schema::table('program_heads', function (Blueprint $table) {
                $table->dropColumn('office');
            });
        }
    }
};
