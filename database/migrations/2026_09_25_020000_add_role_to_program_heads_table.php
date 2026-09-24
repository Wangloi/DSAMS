<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('program_heads') && !Schema::hasColumn('program_heads', 'role')) {
            Schema::table('program_heads', function (Blueprint $table) {
                $table->string('role')->default('Program Head')->after('program');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('program_heads') && Schema::hasColumn('program_heads', 'role')) {
            Schema::table('program_heads', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }
};
