<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateRescueCaseStatusRequest;
use App\Http\Resources\RescueCaseResource;
use App\Models\RescueCase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class RescueCaseController extends Controller
{
    /**
     * List every rescue case (administrators may see all cases).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:rescued,in_care,recovering,ready_for_adoption,adopted'],
            'species' => ['nullable', 'string', 'max:50'],
            'rescuer_id' => ['nullable', 'integer', 'exists:users,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $cases = RescueCase::query()
            ->filter(collect($validated)->only(['search', 'status', 'species'])->all())
            ->when($validated['rescuer_id'] ?? null, fn ($query, $id) => $query->where('rescuer_id', $id))
            ->with(['primaryPhoto', 'animal', 'rescuer'])
            ->latest()
            ->paginate($validated['per_page'] ?? 15)
            ->withQueryString();

        return RescueCaseResource::collection($cases);
    }

    /**
     * Show any rescue case to an administrator.
     */
    public function show(RescueCase $case): RescueCaseResource
    {
        return new RescueCaseResource($case->load([
            'photos',
            'primaryPhoto',
            'animal',
            'rescuer',
            'milestones.photos',
            'milestones.author',
        ]));
    }

    /**
     * Update a case status as an administrator (transition checks bypassed).
     */
    public function updateStatus(UpdateRescueCaseStatusRequest $request, RescueCase $case): RescueCaseResource
    {
        $status = $request->validated('status');

        if (! $case->canTransitionTo($status, asAdmin: true)) {
            throw ValidationException::withMessages([
                'status' => "The case cannot be moved to \"{$status}\".",
            ]);
        }

        $case->status = $status;
        $case->adopted_at = $status === RescueCase::STATUS_ADOPTED ? now() : null;
        $case->save();

        return new RescueCaseResource($case->load(['primaryPhoto', 'animal']));
    }

    /**
     * Publish a case by linking it to an existing adoption listing.
     *
     * This is an administrator-only action so the existing publication and
     * moderation workflow is respected; a case is never auto-published.
     */
    public function publish(Request $request, RescueCase $case): JsonResponse
    {
        $validated = $request->validate([
            'animal_id' => ['required', 'integer', 'exists:animals,id'],
        ]);

        if ($case->status !== RescueCase::STATUS_READY_FOR_ADOPTION) {
            throw ValidationException::withMessages([
                'animal_id' => 'Only cases that are ready for adoption can be published.',
            ]);
        }

        $case->update(['animal_id' => $validated['animal_id']]);

        return (new RescueCaseResource($case->load(['primaryPhoto', 'animal'])))
            ->response();
    }
}
