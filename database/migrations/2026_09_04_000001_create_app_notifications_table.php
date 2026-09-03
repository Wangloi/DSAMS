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
        Schema::create('app_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('user_type')->default('App\\Models\\User')->index(); // Supports multi-auth (User, Student, AdminUser, ProgramHead)
            $table->string('type')->default('general')->index();
            $table->string('title');
            $table->text('message');
            $table->string('related_id')->nullable()->index();
            $table->string('related_type')->nullable()->index();
            $table->boolean('is_read')->default(false)->index();
            $table->json('meta_data')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_notifications');
    }
};
