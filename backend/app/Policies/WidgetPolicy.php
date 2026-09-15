<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Widget;

class WidgetPolicy
{
    /**
     * Ownership is resolved through the parent dashboard.
     */
    public function view(User $user, Widget $widget): bool
    {
        return $user->id === $widget->ownerId() || $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Widget $widget): bool
    {
        return $user->id === $widget->ownerId();
    }

    public function delete(User $user, Widget $widget): bool
    {
        return $user->id === $widget->ownerId();
    }
}
