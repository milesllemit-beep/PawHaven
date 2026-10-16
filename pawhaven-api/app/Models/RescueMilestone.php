<?php

namespace App\Models;

use Database\Factories\RescueMilestoneFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'rescue_case_id',
    'title',
    'description',
    'type',
    'occurred_at',
    'created_by',
])]
class RescueMilestone extends Model
{
    /** @use HasFactory<RescueMilestoneFactory> */
    use HasFactory;

    public const TYPE_RESCUE = 'rescue';

    public const TYPE_FIRST_DAY = 'first_day';

    public const TYPE_HEALTH = 'health';

    public const TYPE_RECOVERY = 'recovery';

    public const TYPE_READY_FOR_ADOPTION = 'ready_for_adoption';

    public const TYPE_ADOPTION = 'adoption';

    public const TYPE_GENERAL = 'general';

    /**
     * Every supported milestone type.
     *
     * @var array<int, string>
     */
    public const TYPES = [
        self::TYPE_RESCUE,
        self::TYPE_FIRST_DAY,
        self::TYPE_HEALTH,
        self::TYPE_RECOVERY,
        self::TYPE_READY_FOR_ADOPTION,
        self::TYPE_ADOPTION,
        self::TYPE_GENERAL,
    ];

    /**
     * Default attribute values for the model.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'type' => self::TYPE_GENERAL,
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
     * The rescue case the milestone belongs to.
     *
     * @return BelongsTo<RescueCase, $this>
     */
    public function rescueCase(): BelongsTo
    {
        return $this->belongsTo(RescueCase::class);
    }

    /**
     * The photos attached to the milestone.
     *
     * @return HasMany<RescueMilestonePhoto, $this>
     */
    public function photos(): HasMany
    {
        return $this->hasMany(RescueMilestonePhoto::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * The user who recorded the milestone.
     *
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
