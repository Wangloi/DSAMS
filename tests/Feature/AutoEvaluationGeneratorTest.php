<?php

use App\Models\AdminUser;
use Illuminate\Http\UploadedFile;

test('guests are redirected from the auto-generate route', function () {
    $this->post(route('admin.evaluation.auto-generate'))
        ->assertRedirect();
});

test('authenticated admin can access the auto-generate route but validation fails without a file', function () {
    $admin = AdminUser::create([
        'name' => 'Admin User',
        'email' => 'admin@example.com',
        'password' => bcrypt('password'),
    ]);

    $response = $this->actingAs($admin, 'admin')
        ->postJson(route('admin.evaluation.auto-generate'), []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['file']);
});

test('auto-generate endpoint validates supported file formats', function () {
    $admin = AdminUser::create([
        'name' => 'Admin User',
        'email' => 'admin@example.com',
        'password' => bcrypt('password'),
    ]);

    // TXT is not supported
    $file = UploadedFile::fake()->create('document.txt', 100, 'text/plain');

    $response = $this->actingAs($admin, 'admin')
        ->postJson(route('admin.evaluation.auto-generate'), [
            'file' => $file,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['file']);
});

test('auto-generate endpoint handles parser failures gracefully on corrupt/fake uploads', function () {
    $admin = AdminUser::create([
        'name' => 'Admin User',
        'email' => 'admin@example.com',
        'password' => bcrypt('password'),
    ]);

    // Create a fake PDF that is actually just plain text (will cause the parser to fail)
    $file = UploadedFile::fake()->create('corrupt.pdf', 10, 'application/pdf');

    $response = $this->actingAs($admin, 'admin')
        ->postJson(route('admin.evaluation.auto-generate'), [
            'file' => $file,
        ]);

    $response->assertStatus(422)
        ->assertJsonStructure(['error']);
});
