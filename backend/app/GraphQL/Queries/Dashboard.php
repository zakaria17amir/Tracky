<?php

namespace App\GraphQL\Queries;

use App\Models\Dashboard as DashboardModel;
use Illuminate\Support\Facades\Gate;

class Dashboard
{
    /**
     * @param  array{id: string}  $args
     */
    public function __invoke(mixed $root, array $args): DashboardModel
    {
        $dashboard = DashboardModel::with('widgets.metric')->findOrFail($args['id']);

        Gate::authorize('view', $dashboard);

        return $dashboard;
    }
}
