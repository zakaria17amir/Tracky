<?php

namespace App\Models;

use Database\Factories\WidgetFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Widget extends Model
{
    /** @use HasFactory<WidgetFactory> */
    use HasFactory;

    protected $fillable = [
        'dashboard_id',
        'metric_id',
        'chart_type',
        'position',
        'config',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'config' => 'array',
        ];
    }

    // ----- Relationships -----

    public function dashboard(): BelongsTo
    {
        return $this->belongsTo(Dashboard::class);
    }

    public function metric(): BelongsTo
    {
        return $this->belongsTo(Metric::class);
    }

    /**
     * Resolve the owning user id through the parent dashboard.
     */
    public function ownerId(): ?int
    {
        return $this->dashboard?->user_id;
    }
}
