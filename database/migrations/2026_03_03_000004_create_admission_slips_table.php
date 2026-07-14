<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admission_slips', function (Blueprint $table) {
            $table->id();
            $table->string('slip_id')->unique();
            $table->string('student_name');
            $table->string('program_year_level');
            $table->string('date_issued');
            $table->string('case_text');
            $table->string('reason_text');
            $table->string('valid_until');
            $table->string('status')->default('PENDING');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admission_slips');
    }
};
