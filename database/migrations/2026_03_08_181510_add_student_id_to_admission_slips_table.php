<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admission_slips', function (Blueprint $table) {
            $table->unsignedBigInteger('student_id')->nullable()->after('id');
            $table->index('student_id');
        });
    }

    public function down(): void
    {
        Schema::table('admission_slips', function (Blueprint $table) {
            $table->dropIndex(['student_id']);
            $table->dropColumn('student_id');
        });
    }
};
