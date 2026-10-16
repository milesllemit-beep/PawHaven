<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'rescue_case_id',
    'path',
    'caption',
    'taken_at',
    'kind',
    'is_primary',
    'sort_order',
])]
class RescueCasePhoto extends Model
{
    public const KIND_INITIAL = 'initial';

    public const KIND_PROGRESS = 'progress';

    /**
     * Every supported photo kind.
     *
     * @var array<int, string>
     */
    public const KINDS = [self::KIND_INITIAL, self::KIND_PROGRESS];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'taken_at' => 'date',
            'is_primary' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * The rescue case the photo belongs to.
     *
     * @return BelongsTo<RescueCase, $this>
     */
    public function rescueCase(): BelongsTo
    {
        return $this->belongsTo(RescueCase::class);
    }
}
