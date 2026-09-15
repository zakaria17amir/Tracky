<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeUserAdmin extends Command
{
    protected $signature = 'tracky:make-admin {email : The email of the user to promote}';

    protected $description = 'Promote an existing user to the admin role';

    public function handle(): int
    {
        $email = $this->argument('email');
        $user = User::where('email', $email)->first();

        if (! $user) {
            $this->error("No user found with email: {$email}");

            return self::FAILURE;
        }

        $user->update(['role' => 'admin']);
        $this->info("{$user->name} ({$email}) is now an admin.");

        return self::SUCCESS;
    }
}
