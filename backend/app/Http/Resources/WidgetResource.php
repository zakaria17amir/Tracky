<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Widget
 */
class WidgetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'dashboard_id' => $this->dashboard_id,
            'metric_id' => $this->metric_id,
            'chart_type' => $this->chart_type,
            'position' => $this->position,
            'config' => $this->config,
            'metric' => new MetricResource($this->whenLoaded('metric')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
