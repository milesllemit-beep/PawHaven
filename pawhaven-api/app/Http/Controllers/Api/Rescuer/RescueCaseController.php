<?php

namespace App\Http\Controllers\Api\Rescuer;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRescueCasePhotoRequest;
use App\Http\Requests\StoreRescueCaseRequest;
use App\Http\Requests\UpdateRescueCaseRequest;
use App\Http\Requests\UpdateRescueCaseStatusRequest;
use App\Http\Resources\RescueCaseResource;
use App\Models\RescueCase;
use App\Models\RescueCasePhoto;
use App\Models\RescueMilestone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class RescueCaseController extends Controller
{
    /**
     * List the authenticated rescuer's own rescue cases.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:rescued,in_care,recovering,ready_for_adoption,adopted'],
            'species' => ['nullable', 'string', 'max:50'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $cases = RescueCase::query()
            ->where('rescuer_id', $request->user()->id)
            ->filter(collect($validated)->only(['search', 'status', 'species'])->all())
            ->with(['primaryPhoto', 'photos', 'animal'])
            ->latest()
            ->paginate($validated['per_page'] ?? 12)
            ->withQueryString();

        return RescueCaseResource::collection($cases);
    }

    /**
     * Document a newly rescued animal.
     */
    public function store(StoreRescueCaseRequest $request): JsonResponse
    {
        Gate::authorize('create', RescueCase::class);

        $case = DB::transaction(function () use ($request): RescueCase {
            $case = RescueCase::create([
                ...$request->safe()->except('photos'),
                // Ownership is always derived from the authenticated user and
                // is never accepted from the request body.
                'rescuer_id' => $request->user()->id,
            ]);

            $this->storePhotos($case, $request->file('photos') ?? [], RescueCasePhoto::KIND_INITIAL);

            $case->milestones()->create([
                'title' => 'Rescue documented',
                'type' => RescueMilestone::TYPE_RESCUE,
                'occurred_at' => $case->rescued_at ?? now(),
                'created_by' => $request->user()->id,
            ]);

            return $case;
        });

        return (new RescueCaseResource($this->loadCase($case)))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Show one of the rescuer's own cases.
     */
    public function show(RescueCase $case): RescueCaseResource
    {
        Gate::authorize('view', $case);

        return new RescueCaseResource($this->loadCase($case));
    }

    /**
     * Update the permitted details of the rescuer's own case.
     */
    public function update(UpdateRescueCaseRequest $request, RescueCase $case): RescueCaseResource
    {
        Gate::authorize('update', $case);

        $case->update($request->safe()->except('photos'));

        return new RescueCaseResource($this->loadCase($case));
    }

    /**
     * Move the case along the rescue workflow, enforcing valid transitions.
     */
    public function updateStatus(UpdateRescueCaseStatusRequest $request, RescueCase $case): RescueCaseResource
    {
        Gate::authorize('updateStatus', $case);

        $status = $request->validated('status');
        $asAdmin = $request->user()->isAdmin();

        if (! $case->canTransitionTo($status, $asAdmin)) {
            throw ValidationException::withMessages([
                'status' => "The case cannot be moved from \"{$case->status}\" to \"{$status}\".",
            ]);
        }

        $case->status = $status;
        $case->adopted_at = $status === RescueCase::STATUS_ADOPTED ? now() : null;
        $case->save();

        return new RescueCaseResource($this->loadCase($case));
    }

    /**
     * Soft delete one of the rescuer's own cases.
     */
    public function destroy(RescueCase $case): JsonResponse
    {
        Gate::authorize('delete', $case);

        $case->delete();

        return response()->json(['message' => 'Rescue case deleted.']);
    }

    /**
     * Upload additional photos to the rescuer's own case.
     */
    public function storePhoto(StoreRescueCasePhotoRequest $request, RescueCase $case): RescueCaseResource
    {
        Gate::authorize('managePhotos', $case);

        $this->storePhotos($case, $request->file('photos') ?? [], $request->validated('kind', RescueCasePhoto::KIND_PROGRESS), [
            'caption' => $request->validated('caption'),
            'taken_at' => $request->validated('taken_at'),
        ]);

        return new RescueCaseResource($this->loadCase($case));
    }

    /**
     * Delete a single photo from the rescuer's own case.
     */
    public function destroyPhoto(RescueCase $case, RescueCasePhoto $photo): JsonResponse
    {
        Gate::authorize('managePhotos', $case);
        abort_unless($photo->rescue_case_id === $case->id, Response::HTTP_NOT_FOUND);

        Storage::disk('public')->delete($photo->path);
        $photo->delete();

        return response()->json(['message' => 'Photo deleted.']);
    }

    /**
     * Eager load the relationships used by the case resource.
     */
    private function loadCase(RescueCase $case): RescueCase
    {
        return $case->load([
            'photos',
            'primaryPhoto',
            'animal',
            'milestones.photos',
            'milestones.author',
        ]);
    }

    /**
     * Persist uploaded photos for the given case.
     *
     * @param  array<int, UploadedFile>  $photos
     * @param  array<string, mixed>  $options
     */
    private function storePhotos(RescueCase $case, array $photos, string $kind = RescueCasePhoto::KIND_PROGRESS, array $options = []): void
    {
        if ($photos === []) {
            return;
        }

        $hasPrimary = $case->photos()->where('is_primary', true)->exists();
        $order = (int) $case->photos()->max('sort_order');

        foreach ($photos as $photo) {
            $path = $photo->store('rescue-cases', 'public');

            $case->photos()->create([
                'path' => $path,
                'caption' => $options['caption'] ?? null,
                'taken_at' => $options['taken_at'] ?? null,
                'kind' => $kind,
                'is_primary' => ! $hasPrimary,
                'sort_order' => ++$order,
            ]);

            $hasPrimary = true;
        }
    }
}
