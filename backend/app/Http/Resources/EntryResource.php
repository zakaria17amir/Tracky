<?php

namespace App\Http\Resources;

use App\Models\Entry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Entry
 */
class EntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'metric_id' => $this->metric_id,
            'user_id' => $this->user_id,
            'logged_date' => $this->logged_date?->toDateString(),
            'value_numeric' => $this->value_numeric,
            'value_scale' => $this->value_scale,
            'value_boolean' => $this->value_boolean,
            // Normalized single value, resolved from whichever typed column is set.
            'value' => $this->resolvedValue(),
            'notes' => $this->notes,
            'metric' => new MetricResource($this->whenLoaded('metric')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function resolvedValue(): int|float|bool|null
    {
        if (! is_null($this->value_boolean)) {
            return $this->value_boolean;
        }
        if (! is_null($this->value_scale)) {
            return $this->value_scale;
        }
        if (! is_null($this->value_numeric)) {
            return (float) $this->value_numeric;
        }

        return null;
    }
}
