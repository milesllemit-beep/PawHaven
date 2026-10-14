<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewAdoptionApplicationRequest;
use App\Http\Requests\StoreAdoptionApplicationRequest;
use App\Http\Resources\AdoptionApplicationResource;
use App\Models\AdoptionApplication;
use App\Models\Animal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class AdoptionApplicationController extends Controller
{
    /**
     * List the authenticated user's applications.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'status' => ['nullable', 'in:pending,approved,rejected,withdrawn,all'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $filters = [];
        $status = $validated['status'] ?? null;
        if ($status && $status !== 'all') {
            $filters['status'] = $status;
        }

        $applications = AdoptionApplication::query()
            ->where('applicant_id', $request->user()->id)
            ->filter($filters)
            ->with(['animal.primaryPhoto', 'reviewer'])
            ->latest()
            ->paginate($validated['per_page'] ?? 12)
            ->withQueryString();

        return AdoptionApplicationResource::collection($applications);
    }

    /**
     * List every application for administrators.
     */
    public function adminIndex(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'status' => ['nullable', 'in:pending,approved,rejected,withdrawn,all'],
            'animal_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $filters = [];
        $status = $validated['status'] ?? null;
        if ($status && $status !== 'all') {
            $filters['status'] = $status;
        }
        if (! empty($validated['animal_id'])) {
            $filters['animal_id'] = $validated['animal_id'];
        }

        $applications = AdoptionApplication::query()
            ->filter($filters)
            ->with(['animal.primaryPhoto', 'applicant', 'reviewer'])
            ->latest()
            ->paginate($validated['per_page'] ?? 15)
            ->withQueryString();

        return AdoptionApplicationResource::collection($applications);
    }

    /**
     * Submit an adoption application for an available animal.
     */
    public function store(StoreAdoptionApplicationRequest $request): JsonResponse
    {
        $animal = Animal::findOrFail($request->validated('animal_id'));

        if ($animal->status !== Animal::STATUS_AVAILABLE) {
            throw ValidationException::withMessages([
                'animal_id' => 'This animal is not currently available for adoption.',
            ]);
        }

        $existing = AdoptionApplication::query()
            ->where('animal_id', $animal->id)
            ->where('applicant_id', $request->user()->id)
            ->open()
            ->exists();

        if ($existing) {
            throw ValidationException::withMessages([
                'animal_id' => 'You already have an active application for this animal.',
            ]);
        }

        $application = AdoptionApplication::create([
            'animal_id' => $animal->id,
            'applicant_id' => $request->user()->id,
            'message' => $request->validated('message'),
        ]);

        return (new AdoptionApplicationResource($application->load('animal.primaryPhoto')))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Show an application for its owner or an administrator.
     */
    public function show(AdoptionApplication $application): AdoptionApplicationResource
    {
        Gate::authorize('view', $application);

        $application->load(['animal.primaryPhoto', 'applicant', 'reviewer']);

        return new AdoptionApplicationResource($application);
    }

    /**
     * Withdraw the applicant's own pending application.
     */
    public function withdraw(AdoptionApplication $application): AdoptionApplicationResource
    {
        Gate::authorize('withdraw', $application);

        $application->update(['status' => AdoptionApplication::STATUS_WITHDRAWN]);

        return new AdoptionApplicationResource($application->load(['animal.primaryPhoto', 'reviewer']));
    }

    /**
     * Approve or reject a pending application (admins only).
     */
    public function review(ReviewAdoptionApplicationRequest $request, AdoptionApplication $application): AdoptionApplicationResource
    {
        Gate::authorize('review', $application);

        if ($application->status !== AdoptionApplication::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'status' => 'Only pending applications can be reviewed.',
            ]);
        }

        $status = $request->validated('status');

        DB::transaction(function () use ($request, $application, $status): void {
            $application->update([
                'status' => $status,
                'reviewer_id' => $request->user()->id,
                'review_notes' => $request->validated('review_notes'),
                'reviewed_at' => now(),
            ]);

            if ($status === AdoptionApplication::STATUS_APPROVED) {
                $application->animal()->update(['status' => Animal::STATUS_ADOPTED]);

                AdoptionApplication::query()
                    ->where('animal_id', $application->animal_id)
                    ->where('id', '!=', $application->id)
                    ->where('status', AdoptionApplication::STATUS_PENDING)
                    ->update([
                        'status' => AdoptionApplication::STATUS_REJECTED,
                        'reviewer_id' => $request->user()->id,
                        'review_notes' => 'Automatically rejected because another application was approved.',
                        'reviewed_at' => now(),
                    ]);
            }
        });

        return new AdoptionApplicationResource(
            $application->load(['animal.primaryPhoto', 'applicant', 'reviewer'])
        );
    }
}
