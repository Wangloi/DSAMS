<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('admission_slips') && Schema::hasColumn('admission_slips', 'valid_until')) {
            Schema::table('admission_slips', function (Blueprint $table) {
                $table->string('valid_until')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        Schema::table('admission_slips', function (Blueprint $table) {
            $table->string('valid_until')->nullable(false)->change();
        });
    }
};
