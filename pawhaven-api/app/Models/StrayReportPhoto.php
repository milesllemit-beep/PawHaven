<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['stray_report_id', 'path', 'sort_order'])]
class StrayReportPhoto extends Model
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
     * The report the photo belongs to.
     *
     * @return BelongsTo<StrayReport, $this>
     */
    public function report(): BelongsTo
    {
        return $this->belongsTo(StrayReport::class, 'stray_report_id');
    }
}
