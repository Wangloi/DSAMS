<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('disciplinary_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained()->onDelete('cascade'); // Assuming students table exists
            $table->enum('recommended_action', ['Warning', 'Suspension', 'Exclusion', 'Expulsion']);
            $table->text('recommendation_reason')->nullable();
            $table->enum('final_action', ['Warning', 'Suspension', 'Exclusion', 'Expulsion'])->nullable();
            $table->text('final_action_reason')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('admin_users')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->enum('status', ['Pending', 'Approved', 'Modified', 'Overridden'])->default('Pending');
            $table->json('decision_history')->nullable(); // Track changes
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('disciplinary_actions');
    }
};
