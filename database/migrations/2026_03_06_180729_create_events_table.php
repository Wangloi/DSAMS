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
        if (!Schema::hasTable('events')) {
            Schema::create('events', function (Blueprint $table) {
                $table->id();
                $table->string('event_name');
                $table->string('organizer');
                $table->string('location');
                $table->date('event_date');
                $table->time('event_time');
                $table->integer('expected_attendees')->nullable();
                $table->text('description')->nullable();
                $table->enum('status', ['upcoming', 'ongoing', 'completed'])->default('upcoming');
                $table->integer('total_attendees')->default(0);
                $table->integer('present_count')->default(0);
                $table->timestamps();
                
                // Indexes for better performance
                $table->index('status');
                $table->index('event_date');
                $table->index('organizer');
            });
        } else {
            Schema::table('events', function (Blueprint $table) {
                if (!Schema::hasColumn('events', 'expected_attendees')) {
                    $table->integer('expected_attendees')->nullable();
                }
                if (!Schema::hasColumn('events', 'total_attendees')) {
                    $table->integer('total_attendees')->default(0);
                }
                if (!Schema::hasColumn('events', 'present_count')) {
                    $table->integer('present_count')->default(0);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
