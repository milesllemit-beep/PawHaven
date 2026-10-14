<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAnimalRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'species' => ['sometimes', 'required', 'string', 'max:50'],
            'breed' => ['nullable', 'string', 'max:100'],
            'sex' => ['sometimes', 'required', Rule::in(['male', 'female', 'unknown'])],
            'size' => ['nullable', Rule::in(['small', 'medium', 'large'])],
            'age_months' => ['nullable', 'integer', 'min:0', 'max:600'],
            'description' => ['nullable', 'string', 'max:5000'],
            'status' => ['sometimes', Rule::in(['available', 'pending', 'adopted'])],
            'vaccinated' => ['sometimes', 'boolean'],
            'sterilized' => ['sometimes', 'boolean'],
            'photos' => ['sometimes', 'array', 'max:10'],
            'photos.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }
}
