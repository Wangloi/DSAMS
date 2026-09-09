<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        AdminUser::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Rey John N. Bongcas',
                'password' => Hash::make('password'),
            ]
        );
    }
}
