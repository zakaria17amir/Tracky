<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Metric
 */
class MetricResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'description' => $this->description,
            'type' => $this->type,
            'unit' => $this->unit,
            'scale_min' => $this->scale_min,
            'scale_max' => $this->scale_max,
            'is_active' => $this->is_active,
            'entries_count' => $this->whenCounted('entries'),
            'latest_entry' => new EntryResource($this->whenLoaded('latestEntry')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
