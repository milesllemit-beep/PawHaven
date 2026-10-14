<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnimalResource extends JsonResource
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
            'name' => $this->name,
            'species' => $this->species,
            'breed' => $this->breed,
            'sex' => $this->sex,
            'size' => $this->size,
            'age_months' => $this->age_months,
            'description' => $this->description,
            'status' => $this->status,
            'vaccinated' => $this->vaccinated,
            'sterilized' => $this->sterilized,
            'photos' => AnimalPhotoResource::collection($this->whenLoaded('photos')),
            'primary_photo' => $this->whenLoaded('primaryPhoto', fn () => new AnimalPhotoResource($this->primaryPhoto)),
            'created_by' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
