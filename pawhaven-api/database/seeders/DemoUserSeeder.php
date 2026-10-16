<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds demo accounts for LOCAL DEVELOPMENT AND DEMONSTRATIONS ONLY.
 *
 * These credentials are intentionally weak and public. Never run this
 * seeder against a production database.
 *
 * The seeder is idempotent: it can be run any number of times without
 * creating duplicate accounts. Existing accounts keep their profile data
 * (name, phone, location); only the documented password and role are
 * guaranteed so that the demo logins always work.
 *
 * Run with: php artisan db:seed --class=DemoUserSeeder
 */
class DemoUserSeeder extends Seeder
{
    /**
     * Demo accounts. The "Rescuer" persona uses the dedicated `rescuer`
     * role; "Adopter" uses `user`; and the administrator uses `admin`.
     *
     * @var array<int, array{name: string, email: string, password: string, role: string, phone: string, location: string}>
     */
    protected array $accounts = [
        [
            'name' => 'Grace Adopter',
            'email' => 'generaluser@adopters.test',
            'password' => 'generaluser123',
            'role' => User::ROLE_USER,
            'phone' => '+1 555 0101',
            'location' => 'Springfield',
        ],
        [
            'name' => 'Riley Rescuer',
            'email' => 'rescuers@paw.test',
            'password' => 'rescuers123',
            'role' => User::ROLE_RESCUER,
            'phone' => '+1 555 0102',
            'location' => 'Riverside',
        ],
        [
            'name' => 'Avery Admin',
            'email' => 'admin@paw.test',
            'password' => 'admin123',
            'role' => User::ROLE_ADMIN,
            'phone' => '+1 555 0103',
            'location' => 'Lakeview',
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->error('DemoUserSeeder is for local development only and will not run in production.');

            return;
        }

        foreach ($this->accounts as $account) {
            $user = User::firstOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make($account['password']),
                    'role' => $account['role'],
                    'phone' => $account['phone'],
                    'location' => $account['location'],
                ],
            );

            // Always guarantee the documented credentials and role, even if the
            // account already existed (for example, one created through the
            // public registration form).
            if (! $user->wasRecentlyCreated) {
                $user->forceFill([
                    'password' => Hash::make($account['password']),
                    'role' => $account['role'],
                ])->save();
            }

            $this->command?->info(sprintf(
                'Demo %s account ready: %s',
                $user->role,
                $user->email,
            ));
        }
    }
}
