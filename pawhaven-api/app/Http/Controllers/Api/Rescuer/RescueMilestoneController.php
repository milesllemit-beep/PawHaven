<?php

namespace App\Http\Controllers\Api\Rescuer;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRescueMilestoneRequest;
use App\Http\Requests\UpdateRescueMilestoneRequest;
use App\Http\Resources\RescueMilestoneResource;
use App\Models\RescueCase;
use App\Models\RescueMilestone;
use App\Models\RescueMilestonePhoto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class RescueMilestoneController extends Controller
{
    /**
     * Record a milestone on the rescuer's own case.
     */
    public function store(StoreRescueMilestoneRequest $request, RescueCase $case): JsonResponse
    {
        Gate::authorize('manageMilestones', $case);

        $milestone = $case->milestones()->create([
            ...$request->safe()->except('photos'),
            'created_by' => $request->user()->id,
        ]);

        $this->storePhotos($milestone, $request->file('photos') ?? []);

        return (new RescueMilestoneResource($milestone->load(['photos', 'author'])))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Update a milestone on the rescuer's own case.
     */
    public function update(
        UpdateRescueMilestoneRequest $request,
        RescueCase $case,
        RescueMilestone $milestone,
    ): RescueMilestoneResource {
        Gate::authorize('update', $milestone);

        $milestone->update($request->safe()->except('photos'));

        return new RescueMilestoneResource($milestone->load(['photos', 'author']));
    }

    /**
     * Delete a milestone from the rescuer's own case.
     */
    public function destroy(RescueCase $case, RescueMilestone $milestone): JsonResponse
    {
        Gate::authorize('delete', $milestone);

        foreach ($milestone->photos as $photo) {
            Storage::disk('public')->delete($photo->path);
        }

        $milestone->delete();

        return response()->json(['message' => 'Milestone deleted.']);
    }

    /**
     * Delete a single photo from a milestone on the rescuer's own case.
     */
    public function destroyPhoto(
        RescueCase $case,
        RescueMilestone $milestone,
        RescueMilestonePhoto $photo,
    ): JsonResponse {
        Gate::authorize('update', $milestone);
        abort_unless($photo->rescue_milestone_id === $milestone->id, Response::HTTP_NOT_FOUND);

        Storage::disk('public')->delete($photo->path);
        $photo->delete();

        return response()->json(['message' => 'Photo deleted.']);
    }

    /**
     * Persist uploaded photos for the given milestone.
     *
     * @param  array<int, UploadedFile>  $photos
     */
    private function storePhotos(RescueMilestone $milestone, array $photos): void
    {
        if ($photos === []) {
            return;
        }

        $order = (int) $milestone->photos()->max('sort_order');

        foreach ($photos as $photo) {
            $path = $photo->store('rescue-milestones', 'public');

            $milestone->photos()->create([
                'path' => $path,
                'sort_order' => ++$order,
            ]);
        }
    }
}
