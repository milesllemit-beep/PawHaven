<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdoptionApplicationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'message' => $this->message,
            'review_notes' => $this->review_notes,
            'reviewed_at' => $this->reviewed_at,
            'animal' => $this->whenLoaded('animal', fn () => [
                'id' => $this->animal->id,
                'name' => $this->animal->name,
                'species' => $this->animal->species,
                'status' => $this->animal->status,
                'primary_photo' => $this->animal->relationLoaded('primaryPhoto') && $this->animal->primaryPhoto
                    ? new AnimalPhotoResource($this->animal->primaryPhoto)
                    : null,
            ]),
            'applicant' => $this->whenLoaded('applicant', fn () => [
                'id' => $this->applicant->id,
                'name' => $this->applicant->name,
                'email' => $this->applicant->email,
            ]),
            'reviewer' => $this->whenLoaded('reviewer', fn () => [
                'id' => $this->reviewer->id,
                'name' => $this->reviewer->name,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
