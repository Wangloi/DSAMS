<?php

use App\Models\AdminUser;
use Illuminate\Support\Facades\Hash;

test('profile page is displayed', function () {
    $admin = AdminUser::create([
        'name' => 'Admin Settings',
        'email' => 'admin.settings@example.com',
        'password' => Hash::make('password123'),
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($admin, 'admin')
        ->withSession(['active_guard' => 'admin'])
        ->get(route('profile.edit'));

    $response->assertOk();
});

test('profile information can be updated', function () {
    $admin = AdminUser::create([
        'name' => 'Admin Settings',
        'email' => 'admin.settings@example.com',
        'password' => Hash::make('password123'),
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($admin, 'admin')
        ->withSession(['active_guard' => 'admin'])
        ->patch(route('profile.update'), [
            'name' => 'Updated Admin',
            'email' => 'updated.admin@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $admin->refresh();

    expect($admin->name)->toBe('Updated Admin');
    expect($admin->email)->toBe('updated.admin@example.com');
});

test('user can delete their account', function () {
    $admin = AdminUser::create([
        'name' => 'Admin To Delete',
        'email' => 'admin.delete@example.com',
        'password' => Hash::make('password123'),
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($admin, 'admin')
        ->withSession(['active_guard' => 'admin'])
        ->delete(route('profile.destroy'), [
            'password' => 'password123',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertDatabaseMissing('admin_users', [
        'id' => $admin->id,
    ]);
});