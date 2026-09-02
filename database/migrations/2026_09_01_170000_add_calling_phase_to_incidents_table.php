<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('incidents', 'calling_phase')) {
            Schema::table('incidents', function (Blueprint $table) {
                $table->unsignedTinyInteger('calling_phase')->default(1)->after('status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('incidents', 'calling_phase')) {
            Schema::table('incidents', function (Blueprint $table) {
                $table->dropColumn('calling_phase');
            });
        }
    }
};
