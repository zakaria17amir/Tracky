<?php

namespace App\Policies;

use App\Models\Dashboard;
use App\Models\User;

class DashboardPolicy
{
    public function view(User $user, Dashboard $dashboard): bool
    {
        return $user->id === $dashboard->user_id || $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Dashboard $dashboard): bool
    {
        return $user->id === $dashboard->user_id;
    }

    public function delete(User $user, Dashboard $dashboard): bool
    {
        return $user->id === $dashboard->user_id;
    }
}
