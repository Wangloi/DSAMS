<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void { Schema::table('attendances', function (Blueprint $table) { $table->string('check_in_token_id', 64)->nullable()->after('check_in_distance_m'); $table->text('check_in_user_agent')->nullable()->after('check_in_token_id'); }); }
    public function down(): void { Schema::table('attendances', function (Blueprint $table) { $table->dropColumn(['check_in_token_id', 'check_in_user_agent']); }); }
};
