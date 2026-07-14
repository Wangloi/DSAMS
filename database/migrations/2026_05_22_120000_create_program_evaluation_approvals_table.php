<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('program_evaluation_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('evaluation_id')->constrained()->cascadeOnDelete();
            $table->string('program', 120);
            $table->unsignedInteger('eligible_count')->default(0);
            $table->unsignedInteger('submitted_count')->default(0);
            $table->decimal('completion_percent', 5, 2)->default(0);
            $table->boolean('approved_for_next_activity')->default(false);
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by_admin_id')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['evaluation_id', 'program']);
        });

        if (Schema::hasTable('evaluations') && ! Schema::hasColumn('evaluations', 'published_at')) {
            Schema::table('evaluations', function (Blueprint $table) {
                $table->timestamp('published_at')->nullable()->after('is_active');
            });
        }

        if (Schema::hasTable('certificates')) {
            Schema::table('certificates', function (Blueprint $table) {
                if (! Schema::hasColumn('certificates', 'evaluation_id')) {
                    $table->foreignId('evaluation_id')->nullable()->after('event_id')->constrained()->nullOnDelete();
                }
                if (! Schema::hasColumn('certificates', 'certificate_type')) {
                    $table->string('certificate_type', 40)->default('participation')->after('title');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('certificates')) {
            Schema::table('certificates', function (Blueprint $table) {
                if (Schema::hasColumn('certificates', 'evaluation_id')) {
                    $table->dropConstrainedForeignId('evaluation_id');
                }
                if (Schema::hasColumn('certificates', 'certificate_type')) {
                    $table->dropColumn('certificate_type');
                }
            });
        }

        if (Schema::hasTable('evaluations') && Schema::hasColumn('evaluations', 'published_at')) {
            Schema::table('evaluations', function (Blueprint $table) {
                $table->dropColumn('published_at');
            });
        }

        Schema::dropIfExists('program_evaluation_approvals');
    }
};
