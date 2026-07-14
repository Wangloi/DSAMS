<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('lost_reports');
        Schema::dropIfExists('found_items');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tables dropped – restore manually if needed
    }
};
