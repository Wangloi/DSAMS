<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('disciplinary_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('trigger_section', ['Warning', 'Suspension', 'Exclusion', 'Expulsion']);
            $table->json('conditions'); // e.g. {"same_offense_count": 3, "total_warnings": 4}
            $table->enum('result_action', ['Warning', 'Suspension', 'Exclusion', 'Expulsion']);
            $table->integer('priority')->default(0); // Higher priority rules evaluated first
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('disciplinary_rules');
    }
};
