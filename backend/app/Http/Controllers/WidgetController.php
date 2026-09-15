<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReorderWidgetsRequest;
use App\Http\Requests\StoreWidgetRequest;
use App\Http\Requests\UpdateWidgetRequest;
use App\Http\Resources\WidgetResource;
use App\Models\Dashboard;
use App\Models\Metric;
use App\Models\Widget;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WidgetController extends Controller
{
    /**
     * Boolean metrics only support these chart types.
     */
    private const BOOLEAN_CHART_TYPES = ['stat', 'streak'];

    /**
     * List a dashboard's widgets, ordered by position.
     */
    public function index(Dashboard $dashboard): AnonymousResourceCollection
    {
        $this->authorize('view', $dashboard);

        return WidgetResource::collection($dashboard->widgets()->with('metric')->get());
    }

    /**
     * Add a widget to a dashboard (owner only).
     */
    public function store(StoreWidgetRequest $request, Dashboard $dashboard): WidgetResource
    {
        $this->authorize('update', $dashboard);

        $metric = $this->ownedMetric($request, $request->integer('metric_id'));
        $this->assertChartTypeAllowed($request->input('chart_type'), $metric);

        $widget = $dashboard->widgets()->create([
            'metric_id' => $metric->id,
            'chart_type' => $request->input('chart_type'),
            'config' => $request->input('config', []),
            'position' => $request->integer('position', (int) $dashboard->widgets()->max('position') + 1),
        ]);

        return new WidgetResource($widget->load('metric'));
    }

    public function show(Widget $widget): WidgetResource
    {
        $this->authorize('view', $widget);

        return new WidgetResource($widget->load('metric'));
    }

    public function update(UpdateWidgetRequest $request, Widget $widget): WidgetResource
    {
        $this->authorize('update', $widget);

        if ($request->has('chart_type')) {
            $this->assertChartTypeAllowed($request->input('chart_type'), $widget->metric);
            $widget->chart_type = $request->input('chart_type');
        }
        if ($request->has('config')) {
            $widget->config = $request->input('config');
        }

        $widget->save();

        return new WidgetResource($widget->load('metric'));
    }

    public function destroy(Widget $widget): Response
    {
        $this->authorize('delete', $widget);

        $widget->delete();

        return response()->noContent();
    }

    /**
     * Persist a new widget order for a dashboard (owner only).
     */
    public function reorder(ReorderWidgetsRequest $request, Dashboard $dashboard): AnonymousResourceCollection
    {
        $this->authorize('update', $dashboard);

        $ids = $request->validated()['widget_ids'];

        // Every submitted widget must belong to this dashboard.
        $owned = $dashboard->widgets()->pluck('id')->all();
        if (array_diff($ids, $owned) || count($ids) !== count($owned)) {
            throw ValidationException::withMessages([
                'widget_ids' => 'The widget list must contain exactly this dashboard\'s widgets.',
            ]);
        }

        DB::transaction(function () use ($ids, $dashboard) {
            foreach ($ids as $position => $id) {
                $dashboard->widgets()->whereKey($id)->update(['position' => $position]);
            }
        });

        return WidgetResource::collection($dashboard->widgets()->with('metric')->get());
    }

    /**
     * A metric that must belong to the authenticated user, else 403.
     */
    private function ownedMetric(Request $request, int $metricId): Metric
    {
        $metric = Metric::findOrFail($metricId);

        if ($metric->user_id !== $request->user()->id) {
            abort(403, 'You do not own this metric.');
        }

        return $metric;
    }

    /**
     * @throws ValidationException
     */
    private function assertChartTypeAllowed(string $chartType, Metric $metric): void
    {
        if ($metric->type === 'boolean' && ! in_array($chartType, self::BOOLEAN_CHART_TYPES, true)) {
            throw ValidationException::withMessages([
                'chart_type' => 'Boolean metrics support only the Stat Card and Streak chart types.',
            ]);
        }
    }
}
