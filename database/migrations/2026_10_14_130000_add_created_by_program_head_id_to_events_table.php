<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('events') && ! Schema::hasColumn('events', 'created_by_program_head_id')) {
            Schema::table('events', function (Blueprint $table) {
                // When set, the event was created by a program head and is hidden from the admin side.
                $table->unsignedBigInteger('created_by_program_head_id')->nullable()->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('events') && Schema::hasColumn('events', 'created_by_program_head_id')) {
            Schema::table('events', function (Blueprint $table) {
                $table->dropIndex(['created_by_program_head_id']);
                $table->dropColumn('created_by_program_head_id');
            });
        }
    }
};
