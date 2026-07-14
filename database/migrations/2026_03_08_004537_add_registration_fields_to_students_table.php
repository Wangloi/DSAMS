<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Student Information Sheet fields
            $table->string('entry_status')->nullable();
            $table->string('program')->nullable();
            $table->string('major')->nullable();
            
            // Personal Information
            $table->text('home_address')->nullable();
            $table->date('birthday')->nullable();
            $table->string('place_of_birth')->nullable();
            $table->string('religion')->nullable();
            $table->string('gender')->nullable();
            $table->string('contact_no')->nullable();
            $table->string('nationality')->nullable();
            
            // Academic Background
            $table->string('elementary_school')->nullable();
            $table->integer('elementary_year_graduated')->nullable();
            $table->string('junior_high_school')->nullable();
            $table->integer('junior_high_year_graduated')->nullable();
            $table->string('senior_high_school')->nullable();
            $table->integer('senior_high_year_graduated')->nullable();
            
            // Family Background
            $table->string('mother_name')->nullable();
            $table->string('mother_contact')->nullable();
            $table->string('father_name')->nullable();
            $table->string('father_contact')->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_relation')->nullable();
            $table->string('guardian_contact')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Student Information Sheet fields
            $table->dropColumn(['entry_status', 'program', 'major']);
            
            // Personal Information
            $table->dropColumn(['home_address', 'birthday', 'place_of_birth', 'religion', 'gender', 'contact_no', 'nationality']);
            
            // Academic Background
            $table->dropColumn(['elementary_school', 'elementary_year_graduated', 'junior_high_school', 'junior_high_year_graduated', 'senior_high_school', 'senior_high_year_graduated']);
            
            // Family Background
            $table->dropColumn(['mother_name', 'mother_contact', 'father_name', 'father_contact', 'guardian_name', 'guardian_relation', 'guardian_contact']);
        });
    }
};
