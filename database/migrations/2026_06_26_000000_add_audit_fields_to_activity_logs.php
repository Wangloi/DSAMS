<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->string('ip_address', 45)->nullable()->after('details');
            $table->text('user_agent')->nullable()->after('ip_address');
            $table->text('old_value')->nullable()->after('user_agent');
            $table->text('new_value')->nullable()->after('old_value');
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropColumn(['old_value', 'new_value', 'user_agent', 'ip_address']);
        });
    }
};
