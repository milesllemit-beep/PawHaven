<?php

namespace App\Http\Resources;

use App\Models\RescueCase;
use App\Models\RescueCasePhoto;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RescueCaseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isAdmin = (bool) $request->user()?->isAdmin();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'species' => $this->species,
            'breed' => $this->breed,
            'estimated_age_months' => $this->estimated_age_months,
            'sex' => $this->sex,
            'rescued_at' => $this->rescued_at,
            'rescue_location' => $this->rescue_location,
            'condition_on_rescue' => $this->condition_on_rescue,
            'description' => $this->description,
            'care_notes' => $this->care_notes,
            'status' => $this->status,
            'adopted_at' => $this->adopted_at,
            'allowed_transitions' => $this->allowedTransitions($isAdmin),
            'photos' => RescueCasePhotoResource::collection($this->whenLoaded('photos')),
            'primary_photo' => $this->whenLoaded('primaryPhoto', fn () => $this->primaryPhoto ? (new RescueCasePhotoResource($this->primaryPhoto))->resolve() : null),
            'before_photo' => $this->whenLoaded('photos', fn () => $this->beforePhoto()),
            'after_photo' => $this->whenLoaded('photos', fn () => $this->afterPhoto()),
            'milestones' => RescueMilestoneResource::collection($this->whenLoaded('milestones')),
            'animal' => $this->whenLoaded('animal', fn () => $this->animal ? [
                'id' => $this->animal->id,
                'name' => $this->animal->name,
                'status' => $this->animal->status,
            ] : null),
            'rescuer' => $this->whenLoaded('rescuer', fn () => $this->rescuer ? [
                'id' => $this->rescuer->id,
                'name' => $this->rescuer->name,
            ] : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * The statuses the requesting user may move this case to.
     *
     * @return array<int, string>
     */
    private function allowedTransitions(bool $isAdmin): array
    {
        return array_values(array_filter(
            RescueCase::STATUSES,
            fn (string $status) => $this->canTransitionTo($status, $isAdmin),
        ));
    }

    /**
     * The earliest "before" photo, preferring explicitly initial photos.
     *
     * @return array<string, mixed>|null
     */
    private function beforePhoto(): ?array
    {
        $photos = $this->photos;
        $initial = $photos->firstWhere('kind', RescueCasePhoto::KIND_INITIAL);
        $photo = $initial ?? $photos->sortBy('id')->first();

        return $photo ? (new RescueCasePhotoResource($photo))->resolve() : null;
    }

    /**
     * The most recent "after" photo, distinct from the before photo.
     *
     * @return array<string, mixed>|null
     */
    private function afterPhoto(): ?array
    {
        $photos = $this->photos;
        $latest = $photos->sortByDesc('id')->first();
        $before = $this->beforePhoto();

        if (! $latest || ($before && ($before['id'] ?? null) === $latest->id)) {
            return null;
        }

        return (new RescueCasePhotoResource($latest))->resolve();
    }
}
