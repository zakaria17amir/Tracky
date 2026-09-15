<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Metric extends Model
{
    /** @use HasFactory<\Database\Factories\MetricFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'type',
        'unit',
        'scale_min',
        'scale_max',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'scale_min' => 'integer',
            'scale_max' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    // ----- Relationships -----

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The core 1:N relationship — one metric has many daily entries.
     */
    public function entries(): HasMany
    {
        return $this->hasMany(Entry::class);
    }

    public function widgets(): HasMany
    {
        return $this->hasMany(Widget::class);
    }

    /**
     * Most recent entry, used for the "last entry" summary in lists.
     */
    public function latestEntry(): HasOne
    {
        return $this->hasOne(Entry::class)->latestOfMany('logged_date');
    }

    // ----- Scopes -----

    /**
     * Restrict the query to metrics owned by the given user id.
     */
    public function scopeOwnedBy(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }
}
