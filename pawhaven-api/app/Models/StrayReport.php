<?php

namespace App\Models;

use Database\Factories\StrayReportFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'type',
    'species',
    'breed',
    'color',
    'description',
    'location',
    'occurred_at',
    'contact_name',
    'contact_phone',
    'contact_email',
    'status',
    'reported_by',
])]
class StrayReport extends Model
{
    /** @use HasFactory<StrayReportFactory> */
    use HasFactory, SoftDeletes;

    public const TYPE_LOST = 'lost';

    public const TYPE_FOUND = 'found';

    public const TYPE_INJURED = 'injured';

    public const STATUS_OPEN = 'open';

    public const STATUS_RESOLVED = 'resolved';

    /**
     * Default attribute values for the model.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => self::STATUS_OPEN,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'occurred_at' => 'date',
        ];
    }

    /**
     * The photos attached to the report.
     *
     * @return HasMany<StrayReportPhoto, $this>
     */
    public function photos(): HasMany
    {
        return $this->hasMany(StrayReportPhoto::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * The user who filed the report.
     *
     * @return BelongsTo<User, $this>
     */
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    /**
     * Scope the query using the supported public filters.
     *
     * @param  Builder<StrayReport>  $query
     * @param  array<string, mixed>  $filters
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('description', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhere('breed', 'like', "%{$search}%");
                });
            })
            ->when($filters['type'] ?? null, fn (Builder $query, string $type) => $query->where('type', $type))
            ->when($filters['species'] ?? null, fn (Builder $query, string $species) => $query->where('species', $species))
            ->when($filters['status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status));
    }
}
