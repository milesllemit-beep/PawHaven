<?php

namespace App\Policies;

use App\Models\StrayReport;
use App\Models\User;

class StrayReportPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, StrayReport $strayReport): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, StrayReport $strayReport): bool
    {
        return $user->id === $strayReport->reported_by || $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, StrayReport $strayReport): bool
    {
        return $user->isAdmin();
    }
}
