<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'rescue_milestone_id',
    'path',
    'caption',
    'sort_order',
])]
class RescueMilestonePhoto extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    /**
     * The milestone the photo belongs to.
     *
     * @return BelongsTo<RescueMilestone, $this>
     */
    public function milestone(): BelongsTo
    {
        return $this->belongsTo(RescueMilestone::class, 'rescue_milestone_id');
    }
}
