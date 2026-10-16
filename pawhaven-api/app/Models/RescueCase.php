<?php

namespace App\Models;

use Database\Factories\RescueCaseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'rescuer_id',
    'name',
    'species',
    'breed',
    'estimated_age_months',
    'sex',
    'rescued_at',
    'rescue_location',
    'condition_on_rescue',
    'description',
    'care_notes',
    'status',
    'animal_id',
    'adopted_at',
])]
class RescueCase extends Model
{
    /** @use HasFactory<RescueCaseFactory> */
    use HasFactory, SoftDeletes;

    public const STATUS_RESCUED = 'rescued';

    public const STATUS_IN_CARE = 'in_care';

    public const STATUS_RECOVERING = 'recovering';

    public const STATUS_READY_FOR_ADOPTION = 'ready_for_adoption';

    public const STATUS_ADOPTED = 'adopted';

    /**
     * Every status in the rescue journey, in lifecycle order.
     *
     * @var array<int, string>
     */
    public const STATUSES = [
        self::STATUS_RESCUED,
        self::STATUS_IN_CARE,
        self::STATUS_RECOVERING,
        self::STATUS_READY_FOR_ADOPTION,
        self::STATUS_ADOPTED,
    ];

    /**
     * The statuses a rescuer may move a case to from a given status.
     *
     * `adopted` is intentionally absent: it may only be set by an authorised
     * administrator or confirmed by the existing adoption workflow.
     *
     * @var array<string, array<int, string>>
     */
    public const TRANSITIONS = [
        self::STATUS_RESCUED => [
            self::STATUS_IN_CARE,
            self::STATUS_RECOVERING,
            self::STATUS_READY_FOR_ADOPTION,
        ],
        self::STATUS_IN_CARE => [
            self::STATUS_RECOVERING,
            self::STATUS_READY_FOR_ADOPTION,
        ],
        self::STATUS_RECOVERING => [
            self::STATUS_IN_CARE,
            self::STATUS_READY_FOR_ADOPTION,
        ],
        self::STATUS_READY_FOR_ADOPTION => [
            self::STATUS_RECOVERING,
            self::STATUS_ADOPTED,
        ],
        self::STATUS_ADOPTED => [],
    ];

    /**
     * Default attribute values for the model.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => self::STATUS_RESCUED,
        'sex' => 'unknown',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rescued_at' => 'date',
            'estimated_age_months' => 'integer',
            'adopted_at' => 'datetime',
        ];
    }

    /**
     * The rescuer who owns the case.
     *
     * @return BelongsTo<User, $this>
     */
    public function rescuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rescuer_id');
    }

    /**
     * The public adoption listing linked to this case, if published.
     *
     * @return BelongsTo<Animal, $this>
     */
    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class);
    }

    /**
     * Photos in the case gallery, ordered for display.
     *
     * @return HasMany<RescueCasePhoto, $this>
     */
    public function photos(): HasMany
    {
        return $this->hasMany(RescueCasePhoto::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * The initial ("before") rescue photos.
     *
     * @return HasMany<RescueCasePhoto, $this>
     */
    public function initialPhotos(): HasMany
    {
        return $this->photos()->where('kind', RescueCasePhoto::KIND_INITIAL);
    }

    /**
     * The primary photo of the case.
     *
     * @return HasOne<RescueCasePhoto, $this>
     */
    public function primaryPhoto(): HasOne
    {
        return $this->hasOne(RescueCasePhoto::class)->where('is_primary', true);
    }

    /**
     * The milestones that make up the rescue timeline.
     *
     * @return HasMany<RescueMilestone, $this>
     */
    public function milestones(): HasMany
    {
        return $this->hasMany(RescueMilestone::class)
            ->orderByDesc('occurred_at')
            ->orderByDesc('id');
    }

    /**
     * Determine whether a status change is allowed.
     *
     * Administrators may force any change. Rescuers are limited to the
     * declared transition graph and may never set the case to `adopted`.
     */
    public function canTransitionTo(string $status, bool $asAdmin = false): bool
    {
        if (! in_array($status, self::STATUSES, true)) {
            return false;
        }

        if ($asAdmin) {
            return true;
        }

        if ($status === self::STATUS_ADOPTED) {
            return false;
        }

        return in_array($status, self::TRANSITIONS[$this->status] ?? [], true);
    }

    /**
     * Scope the query using the supported owner filters.
     *
     * @param  Builder<RescueCase>  $query
     * @param  array<string, mixed>  $filters
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('breed', 'like', "%{$search}%")
                        ->orWhere('rescue_location', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status))
            ->when($filters['species'] ?? null, fn (Builder $query, string $species) => $query->where('species', $species));
    }
}
