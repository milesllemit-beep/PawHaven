<?php

namespace App\Models;

use Database\Factories\AnimalFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'name',
    'species',
    'breed',
    'sex',
    'size',
    'age_months',
    'description',
    'status',
    'vaccinated',
    'sterilized',
    'created_by',
])]
class Animal extends Model
{
    /** @use HasFactory<AnimalFactory> */
    use HasFactory, SoftDeletes;

    public const STATUS_AVAILABLE = 'available';

    public const STATUS_PENDING = 'pending';

    public const STATUS_ADOPTED = 'adopted';

    /**
     * Default attribute values for the model.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => self::STATUS_AVAILABLE,
        'sex' => 'unknown',
        'vaccinated' => false,
        'sterilized' => false,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'vaccinated' => 'boolean',
            'sterilized' => 'boolean',
            'age_months' => 'integer',
        ];
    }

    /**
     * The photos belonging to the animal.
     *
     * @return HasMany<AnimalPhoto, $this>
     */
    public function photos(): HasMany
    {
        return $this->hasMany(AnimalPhoto::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * The primary photo of the animal.
     *
     * @return HasOne<AnimalPhoto, $this>
     */
    public function primaryPhoto(): HasOne
    {
        return $this->hasOne(AnimalPhoto::class)->where('is_primary', true);
    }

    /**
     * The user who created the listing.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope the query using the supported public filters.
     *
     * @param  Builder<Animal>  $query
     * @param  array<string, mixed>  $filters
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('breed', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($filters['species'] ?? null, fn (Builder $query, string $species) => $query->where('species', $species))
            ->when($filters['sex'] ?? null, fn (Builder $query, string $sex) => $query->where('sex', $sex))
            ->when($filters['size'] ?? null, fn (Builder $query, string $size) => $query->where('size', $size))
            ->when($filters['status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status))
            ->when($filters['min_age'] ?? null, fn (Builder $query, $min) => $query->where('age_months', '>=', (int) $min))
            ->when($filters['max_age'] ?? null, fn (Builder $query, $max) => $query->where('age_months', '<=', (int) $max));
    }
}
