<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lost_reports', function (Blueprint $table) {
            $table->id();
            $table->string('student_identifier');
            $table->text('item_description');
            $table->date('date_lost');
            $table->time('time_lost')->nullable();
            $table->string('last_seen_location');
            $table->string('contact_info')->nullable();
            $table->string('image_path')->nullable();
            $table->string('status')->default('Pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lost_reports');
    }
};
