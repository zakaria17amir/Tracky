<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'metrics_count' => $this->whenCounted('metrics'),
            'entries_count' => $this->whenCounted('entries'),
            'dashboards_count' => $this->whenCounted('dashboards'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
