<?php

namespace App\Policies;

use App\Models\AdoptionApplication;
use App\Models\User;

class AdoptionApplicationPolicy
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
    public function view(User $user, AdoptionApplication $application): bool
    {
        return $user->id === $application->applicant_id || $user->isAdmin();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can withdraw the model.
     */
    public function withdraw(User $user, AdoptionApplication $application): bool
    {
        return $user->id === $application->applicant_id
            && $application->status === AdoptionApplication::STATUS_PENDING;
    }

    /**
     * Determine whether the user can review the model.
     */
    public function review(User $user): bool
    {
        return $user->isAdmin();
    }
}
