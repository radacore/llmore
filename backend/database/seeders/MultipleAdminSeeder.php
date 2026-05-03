<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MultipleAdminSeeder extends Seeder
{
    /**
     * Seed 3 additional admin users.
     */
    public function run(): void
    {
        $admins = [
            [
                'name' => 'Admin Satu',
                'email' => 'admin1@llmore.id',
            ],
            [
                'name' => 'Admin Dua',
                'email' => 'admin2@llmore.id',
            ],
            [
                'name' => 'Admin Tiga',
                'email' => 'admin3@llmore.id',
            ],
        ];

        foreach ($admins as $data) {
            User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => Hash::make('password'),
                    'role' => 'admin',
                    'status' => 'active',
                    'email_verified_at' => now(),
                ]
            );
        }

        $this->command->info('✓ 3 admin users seeded (admin1@, admin2@, admin3@llmore.id) — password: "password"');
    }
}
