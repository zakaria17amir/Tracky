<?php

namespace App\Policies;

use App\Models\Metric;
use App\Models\User;

class MetricPolicy
{
    /**
     * Owner or admin may read a metric.
     */
    public function view(User $user, Metric $metric): bool
    {
        return $user->id === $metric->user_id || $user->isAdmin();
    }

    /**
     * Any authenticated user may create their own metrics.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Only the owner may modify a metric (admins are read-only on user data).
     */
    public function update(User $user, Metric $metric): bool
    {
        return $user->id === $metric->user_id;
    }

    public function delete(User $user, Metric $metric): bool
    {
        return $user->id === $metric->user_id;
    }
}
