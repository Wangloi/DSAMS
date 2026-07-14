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
        Schema::table('incidents', function (Blueprint $table) {
            $table->string('reported_by')->nullable()->after('location');
            $table->text('immediate_action')->nullable()->after('description');
            $table->string('received_by')->nullable()->after('immediate_action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            $table->dropColumn(['reported_by', 'immediate_action', 'received_by']);
        });
    }
};
