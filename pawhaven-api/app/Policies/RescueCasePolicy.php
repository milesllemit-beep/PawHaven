<?php

namespace App\Policies;

use App\Models\RescueCase;
use App\Models\User;

class RescueCasePolicy
{
    /**
     * Determine whether the user can list rescue cases.
     *
     * Scope (own cases vs. all cases) is applied by the controller.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the case.
     */
    public function view(User $user, RescueCase $rescueCase): bool
    {
        return $user->id === $rescueCase->rescuer_id || $user->isAdmin();
    }

    /**
     * Determine whether the user can create a rescue case.
     */
    public function create(User $user): bool
    {
        return $user->isRescuer();
    }

    /**
     * Determine whether the user can update the case details.
     */
    public function update(User $user, RescueCase $rescueCase): bool
    {
        return $user->id === $rescueCase->rescuer_id || $user->isAdmin();
    }

    /**
     * Determine whether the user can change the case status.
     */
    public function updateStatus(User $user, RescueCase $rescueCase): bool
    {
        return $user->id === $rescueCase->rescuer_id || $user->isAdmin();
    }

    /**
     * Determine whether the user can manage the case's photos.
     */
    public function managePhotos(User $user, RescueCase $rescueCase): bool
    {
        return $user->id === $rescueCase->rescuer_id || $user->isAdmin();
    }

    /**
     * Determine whether the user can manage the case's milestones.
     */
    public function manageMilestones(User $user, RescueCase $rescueCase): bool
    {
        return $user->id === $rescueCase->rescuer_id || $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the case.
     */
    public function delete(User $user, RescueCase $rescueCase): bool
    {
        return $user->id === $rescueCase->rescuer_id || $user->isAdmin();
    }

    /**
     * Determine whether the user can link the case to a public listing.
     *
     * Publishing to the adoption catalogue is an administrator-only action so
     * the existing moderation workflow is respected.
     */
    public function publish(User $user, RescueCase $rescueCase): bool
    {
        return $user->isAdmin();
    }
}
