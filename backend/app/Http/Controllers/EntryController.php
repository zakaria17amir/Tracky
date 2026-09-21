<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkEntryRequest;
use App\Http\Requests\StoreEntryRequest;
use App\Http\Requests\UpdateEntryRequest;
use App\Http\Resources\EntryResource;
use App\Models\Entry;
use App\Models\Metric;
use App\Services\EntryWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class EntryController extends Controller
{
    public function __construct(private readonly EntryWriter $writer) {}

    /**
     * List the authenticated user's entries, filterable by metric and date range.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Entry::query()
            ->ownedBy($request->user()->id)
            ->with('metric')
            ->orderBy('logged_date', 'desc');

        if ($request->filled('metric_id')) {
            $query->where('metric_id', $request->integer('metric_id'));
        }
        if ($request->filled('from')) {
            $query->whereDate('logged_date', '>=', $request->date('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('logged_date', '<=', $request->date('to'));
        }

        return EntryResource::collection($query->paginate($request->integer('per_page', 25)));
    }

    /**
     * Create or update a single entry for one of the user's metrics
     * (idempotent per metric+day to respect the one-entry-per-day rule).
     */
    public function store(StoreEntryRequest $request): EntryResource
    {
        $metric = $this->ownedMetric($request, $request->integer('metric_id'));

        $columns = $this->writer->columnsFor($metric, $request->input('value'));

        $entry = Entry::updateOrCreate(
            ['metric_id' => $metric->id, 'logged_date' => $request->date('logged_date')],
            [
                'user_id' => $request->user()->id,
                'notes' => $request->input('notes'),
                ...$columns,
            ],
        );

        return new EntryResource($entry->load('metric'));
    }

    /**
     * Upsert multiple entries in one request (Quick Log "Save All").
     */
    public function bulk(BulkEntryRequest $request): JsonResponse
    {
        $userId = $request->user()->id;

        $ids = DB::transaction(function () use ($request, $userId) {
            $saved = [];

            foreach ($request->validated()['entries'] as $row) {
                $metric = $this->ownedMetric($request, (int) $row['metric_id']);
                $columns = $this->writer->columnsFor($metric, $row['value'], 'entries');

                $entry = Entry::updateOrCreate(
                    ['metric_id' => $metric->id, 'logged_date' => Carbon::parse($row['logged_date'])],
                    [
                        'user_id' => $userId,
                        'notes' => $row['notes'] ?? null,
                        ...$columns,
                    ],
                );

                $saved[] = $entry->id;
            }

            return $saved;
        });

        $entries = Entry::with('metric')->whereIn('id', $ids)->get();

        return EntryResource::collection($entries)
            ->response()
            ->setStatusCode(201);
    }

    public function show(Entry $entry): EntryResource
    {
        $this->authorize('view', $entry);

        return new EntryResource($entry->load('metric'));
    }

    public function update(UpdateEntryRequest $request, Entry $entry): EntryResource
    {
        $this->authorize('update', $entry);

        if ($request->has('value')) {
            $columns = $this->writer->columnsFor($entry->metric, $request->input('value'));
            $entry->fill($columns);
        }
        if ($request->has('logged_date')) {
            $entry->logged_date = $request->date('logged_date');
        }
        if ($request->has('notes')) {
            $entry->notes = $request->input('notes');
        }

        $entry->save();

        return new EntryResource($entry->load('metric'));
    }

    public function destroy(Entry $entry): Response
    {
        $this->authorize('delete', $entry);

        $entry->delete();

        return response()->noContent();
    }

    /**
     * Fetch a metric that must belong to the authenticated user, else 403.
     */
    private function ownedMetric(Request $request, int $metricId): Metric
    {
        $metric = Metric::findOrFail($metricId);

        if ($metric->user_id !== $request->user()->id) {
            abort(403, 'You do not own this metric.');
        }

        return $metric;
    }
}
