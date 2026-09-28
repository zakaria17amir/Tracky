<?php

namespace App\GraphQL;

use App\Models\Widget;
use App\Services\MetricSummary;

/**
 * Per-widget GraphQL fields. The widget's dashboard was authorized by the query,
 * and a widget can only reference a metric its owner owns.
 */
class WidgetFields
{
    public function __construct(private MetricSummary $summary) {}

    /**
     * @param  array{days: int}  $args
     * @return list<array{logged_date: string, value: float}>
     */
    public function entries(Widget $widget, array $args): array
    {
        return $widget->metric->entries()
            ->where('logged_date', '>=', now()->subDays(max(1, $args['days']) - 1)->toDateString())
            ->orderBy('logged_date')
            ->get(['logged_date', 'value_numeric', 'value_scale', 'value_boolean'])
            ->map(fn ($entry) => [
                'logged_date' => $entry->logged_date->toDateString(),
                'value' => $this->summary->numericValue($entry),
            ])
            ->all();
    }

    /**
     * @param  array{threshold: float}  $args
     */
    public function summary(Widget $widget, array $args): array
    {
        $summary = $this->summary->for($widget->metric, $args['threshold']);

        if (is_bool($summary['current'])) {
            $summary['current'] = (float) $summary['current'];
        }

        return $summary;
    }
}
