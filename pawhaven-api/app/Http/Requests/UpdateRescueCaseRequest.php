<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRescueCaseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * Note: `status`, `rescuer_id` and `animal_id` are intentionally excluded.
     * Status changes flow through the dedicated status endpoint so transitions
     * can be enforced, and ownership/publishing are never client-controlled.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'species' => ['sometimes', 'required', 'string', 'max:50'],
            'breed' => ['sometimes', 'nullable', 'string', 'max:100'],
            'estimated_age_months' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:600'],
            'sex' => ['sometimes', 'required', Rule::in(['male', 'female', 'unknown'])],
            'rescued_at' => ['sometimes', 'required', 'date'],
            'rescue_location' => ['sometimes', 'required', 'string', 'max:255'],
            'condition_on_rescue' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'care_notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
