<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMetricRequest;
use App\Http\Requests\UpdateMetricRequest;
use App\Http\Resources\EntryResource;
use App\Http\Resources\MetricResource;
use App\Models\Metric;
use App\Services\MetricSummary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class MetricController extends Controller
{
    /**
     * List metrics owned by the authenticated user.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Metric::query()
            ->ownedBy($request->user()->id)
            ->withCount('entries')
            ->with('latestEntry')
            ->orderBy('name');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        return MetricResource::collection($query->get());
    }

    /**
     * Create a metric owned by the authenticated user.
     */
    public function store(StoreMetricRequest $request): MetricResource
    {
        $metric = Metric::create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return new MetricResource($metric);
    }

    /**
     * Show a single metric (owner or admin).
     */
    public function show(Metric $metric): MetricResource
    {
        $this->authorize('view', $metric);

        return new MetricResource($metric->loadCount('entries')->load('latestEntry'));
    }

    /**
     * Update a metric (owner only).
     */
    public function update(UpdateMetricRequest $request, Metric $metric): MetricResource
    {
        $this->authorize('update', $metric);

        $metric->update($request->validated());

        return new MetricResource($metric);
    }

    /**
     * Delete a metric and cascade its entries and widgets (owner only).
     */
    public function destroy(Metric $metric): Response
    {
        $this->authorize('delete', $metric);

        $metric->delete();

        return response()->noContent();
    }

    /**
     * Paginated entries for a metric — the chart data source (owner or admin).
     */
    public function entries(Request $request, Metric $metric): AnonymousResourceCollection
    {
        $this->authorize('view', $metric);

        $query = $metric->entries()->orderBy('logged_date', 'desc');

        if ($request->filled('from')) {
            $query->whereDate('logged_date', '>=', $request->date('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('logged_date', '<=', $request->date('to'));
        }

        return EntryResource::collection($query->paginate($request->integer('per_page', 100)));
    }

    /**
     * Stat + streak summary computed over the metric's full history (owner or admin).
     */
    public function summary(Request $request, Metric $metric, MetricSummary $summary): JsonResponse
    {
        $this->authorize('view', $metric);

        $threshold = (float) $request->input('threshold', 1);

        return response()->json($summary->for($metric, $threshold));
    }
}
