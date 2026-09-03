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
            if (!Schema::hasColumn('incidents', 'calling_notice_sent_at')) {
                $table->timestamp('calling_notice_sent_at')->nullable()->after('investigation_details');
            }
            if (!Schema::hasColumn('incidents', 'calling_notice_details')) {
                $table->json('calling_notice_details')->nullable()->after('calling_notice_sent_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            if (Schema::hasColumn('incidents', 'calling_notice_details')) {
                $table->dropColumn('calling_notice_details');
            }
            if (Schema::hasColumn('incidents', 'calling_notice_sent_at')) {
                $table->dropColumn('calling_notice_sent_at');
            }
        });
    }
};
