<?php

namespace App\Policies;

use App\Models\RescueMilestone;
use App\Models\User;

class RescueMilestonePolicy
{
    /**
     * Determine whether the user can view the milestone.
     */
    public function view(User $user, RescueMilestone $milestone): bool
    {
        return $this->ownsCase($user, $milestone) || $user->isAdmin();
    }

    /**
     * Determine whether the user can create milestones on a case.
     */
    public function create(User $user, RescueMilestone $milestone): bool
    {
        return $this->ownsCase($user, $milestone) || $user->isAdmin();
    }

    /**
     * Determine whether the user can update the milestone.
     */
    public function update(User $user, RescueMilestone $milestone): bool
    {
        return $this->ownsCase($user, $milestone) || $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the milestone.
     */
    public function delete(User $user, RescueMilestone $milestone): bool
    {
        return $this->ownsCase($user, $milestone) || $user->isAdmin();
    }

    /**
     * Whether the user owns the rescue case the milestone belongs to.
     */
    private function ownsCase(User $user, RescueMilestone $milestone): bool
    {
        return $milestone->rescueCase?->rescuer_id === $user->id;
    }
}
