<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnimalRequest;
use App\Http\Requests\UpdateAnimalRequest;
use App\Http\Resources\AnimalResource;
use App\Models\Animal;
use App\Models\AnimalPhoto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class AnimalController extends Controller
{
    /**
     * List adoptable animals with search and filtering.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'species' => ['nullable', 'string', 'max:50'],
            'sex' => ['nullable', 'in:male,female,unknown'],
            'size' => ['nullable', 'in:small,medium,large'],
            'status' => ['nullable', 'in:available,pending,adopted,all'],
            'min_age' => ['nullable', 'integer', 'min:0'],
            'max_age' => ['nullable', 'integer', 'min:0'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $filters = collect($validated)->only([
            'search', 'species', 'sex', 'size', 'min_age', 'max_age',
        ])->all();

        $status = $validated['status'] ?? Animal::STATUS_AVAILABLE;
        if ($status !== 'all') {
            $filters['status'] = $status;
        }

        $animals = Animal::query()
            ->filter($filters)
            ->with(['photos', 'primaryPhoto', 'creator'])
            ->latest()
            ->paginate($validated['per_page'] ?? 12)
            ->withQueryString();

        return AnimalResource::collection($animals);
    }

    /**
     * Show a single animal listing.
     */
    public function show(Animal $animal): AnimalResource
    {
        $animal->load(['photos', 'primaryPhoto', 'creator']);

        return new AnimalResource($animal);
    }

    /**
     * Create a new animal listing.
     */
    public function store(StoreAnimalRequest $request): JsonResponse
    {
        $animal = Animal::create([
            ...$request->safe()->except('photos'),
            'created_by' => $request->user()->id,
        ]);

        $this->storePhotos($animal, $request->file('photos') ?? []);

        return (new AnimalResource($animal->load(['photos', 'primaryPhoto', 'creator'])))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Update an existing animal listing.
     */
    public function update(UpdateAnimalRequest $request, Animal $animal): AnimalResource
    {
        $animal->update($request->safe()->except('photos'));

        $this->storePhotos($animal, $request->file('photos') ?? []);

        return new AnimalResource($animal->load(['photos', 'primaryPhoto', 'creator']));
    }

    /**
     * Soft delete an animal listing.
     */
    public function destroy(Animal $animal): JsonResponse
    {
        $animal->delete();

        return response()->json(['message' => 'Animal deleted.']);
    }

    /**
     * Delete a single photo from an animal listing.
     */
    public function destroyPhoto(Animal $animal, AnimalPhoto $photo): JsonResponse
    {
        abort_unless($photo->animal_id === $animal->id, Response::HTTP_NOT_FOUND);

        Storage::disk('public')->delete($photo->path);
        $photo->delete();

        return response()->json(['message' => 'Photo deleted.']);
    }

    /**
     * Persist uploaded photos for the given animal.
     *
     * @param  array<int, UploadedFile>  $photos
     */
    private function storePhotos(Animal $animal, array $photos): void
    {
        if ($photos === []) {
            return;
        }

        $hasPrimary = $animal->photos()->where('is_primary', true)->exists();
        $order = (int) $animal->photos()->max('sort_order');

        foreach ($photos as $photo) {
            $path = $photo->store('animals', 'public');

            $animal->photos()->create([
                'path' => $path,
                'is_primary' => ! $hasPrimary,
                'sort_order' => ++$order,
            ]);

            $hasPrimary = true;
        }
    }
}
