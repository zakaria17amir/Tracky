<?php

namespace App\Http\Resources;

use App\Models\Dashboard;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Dashboard
 */
class DashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'description' => $this->description,
            'widgets_count' => $this->whenCounted('widgets'),
            'widgets' => WidgetResource::collection($this->whenLoaded('widgets')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
