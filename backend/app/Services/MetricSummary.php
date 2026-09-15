<?php

namespace App\Services;

use App\Models\Entry;
use App\Models\Metric;
use Illuminate\Support\Carbon;

class MetricSummary
{
    /**
     * Compute stat + streak figures over a metric's FULL entry history
     * (not capped by pagination), so long streaks and true averages are exact.
     *
     * @return array{
     *   current: float|bool|null,
     *   current_date: string|null,
     *   average: float|null,
     *   yesterday: float|null,
     *   last_week: float|null,
     *   streak: int
     * }
     */
    public function for(Metric $metric, float $threshold = 1.0): array
    {
        // One ordered pass over the metric's entries.
        $entries = $metric->entries()
            ->orderBy('logged_date', 'desc')
            ->get(['logged_date', 'value_numeric', 'value_scale', 'value_boolean']);

        if ($entries->isEmpty()) {
            return [
                'current' => null,
                'current_date' => null,
                'average' => null,
                'yesterday' => null,
                'last_week' => null,
                'streak' => 0,
            ];
        }

        $byDate = [];
        $sum = 0.0;
        foreach ($entries as $entry) {
            $byDate[$entry->logged_date->toDateString()] = $entry;
            $sum += $this->numericValue($entry);
        }

        $latest = $entries->first();
        $average = round($sum / $entries->count(), 2);

        $yesterdayEntry = $byDate[Carbon::today()->subDay()->toDateString()] ?? null;
        $lastWeekEntry = $byDate[Carbon::today()->subWeek()->toDateString()] ?? null;

        return [
            'current' => $metric->type === 'boolean'
                ? (bool) $latest->value_boolean
                : $this->numericValue($latest),
            'current_date' => $latest->logged_date->toDateString(),
            'average' => $average,
            'yesterday' => $yesterdayEntry ? $this->numericValue($yesterdayEntry) : null,
            'last_week' => $lastWeekEntry ? $this->numericValue($lastWeekEntry) : null,
            'streak' => $this->streak($metric, $byDate, $latest->logged_date, $threshold),
        ];
    }

    /**
     * Consecutive qualifying days ending at the most recent logged day.
     *
     * @param  array<string, Entry>  $byDate
     */
    private function streak(Metric $metric, array $byDate, Carbon $mostRecent, float $threshold): int
    {
        $meets = function (Entry $entry) use ($metric, $threshold): bool {
            if ($metric->type === 'boolean') {
                return $entry->value_boolean === true;
            }

            return $this->numericValue($entry) >= $threshold;
        };

        $streak = 0;
        $cursor = $mostRecent->copy();

        while (true) {
            $key = $cursor->toDateString();
            $entry = $byDate[$key] ?? null;
            if ($entry && $meets($entry)) {
                $streak++;
                $cursor->subDay();
            } else {
                break;
            }
        }

        return $streak;
    }

    private function numericValue(Entry $entry): float
    {
        if ($entry->value_boolean !== null) {
            return $entry->value_boolean ? 1.0 : 0.0;
        }
        if ($entry->value_scale !== null) {
            return (float) $entry->value_scale;
        }

        return (float) ($entry->value_numeric ?? 0);
    }
}
