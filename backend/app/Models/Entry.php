<?php

namespace App\Models;

use Database\Factories\EntryFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Entry extends Model
{
    /** @use HasFactory<EntryFactory> */
    use HasFactory;

    protected $fillable = [
        'metric_id',
        'user_id',
        'logged_date',
        'value_numeric',
        'value_scale',
        'value_boolean',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'logged_date' => 'date',
            'value_numeric' => 'decimal:2',
            'value_scale' => 'integer',
            'value_boolean' => 'boolean',
        ];
    }

    // ----- Relationships -----

    public function metric(): BelongsTo
    {
        return $this->belongsTo(Metric::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ----- Scopes -----

    public function scopeOwnedBy(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }
}
