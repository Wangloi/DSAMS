<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admission_slips', function (Blueprint $table) {
            $table->dropUnique(['slip_id']);
            $table->dropColumn('slip_id');
        });
    }

    public function down(): void
    {
        Schema::table('admission_slips', function (Blueprint $table) {
            $table->string('slip_id')->unique()->after('id');
        });
    }
};
