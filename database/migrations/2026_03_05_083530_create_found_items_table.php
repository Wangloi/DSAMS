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
        Schema::create('found_items', function (Blueprint $table) {
            $table->id();
            $table->date('date_found');
            $table->time('time_found');
            $table->text('item_description');
            $table->string('place_found');
            $table->string('finder_name');
            $table->string('contact_info')->nullable();
            $table->string('program');
            $table->string('year_level');
            $table->string('image_path')->nullable();
            $table->string('status')->default('In Storage');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('found_items');
    }
};
