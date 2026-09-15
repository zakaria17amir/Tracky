<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDashboardRequest;
use App\Http\Requests\UpdateDashboardRequest;
use App\Http\Resources\DashboardResource;
use App\Models\Dashboard;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class DashboardController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $dashboards = Dashboard::query()
            ->ownedBy($request->user()->id)
            ->withCount('widgets')
            ->orderBy('name')
            ->get();

        return DashboardResource::collection($dashboards);
    }

    public function store(StoreDashboardRequest $request): DashboardResource
    {
        $dashboard = Dashboard::create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return new DashboardResource($dashboard);
    }

    /**
     * Show a dashboard with its ordered widgets and each widget's metric.
     */
    public function show(Dashboard $dashboard): DashboardResource
    {
        $this->authorize('view', $dashboard);

        $dashboard->load('widgets.metric');

        return new DashboardResource($dashboard);
    }

    public function update(UpdateDashboardRequest $request, Dashboard $dashboard): DashboardResource
    {
        $this->authorize('update', $dashboard);

        $dashboard->update($request->validated());

        return new DashboardResource($dashboard);
    }

    public function destroy(Dashboard $dashboard): Response
    {
        $this->authorize('delete', $dashboard);

        $dashboard->delete();

        return response()->noContent();
    }
}
