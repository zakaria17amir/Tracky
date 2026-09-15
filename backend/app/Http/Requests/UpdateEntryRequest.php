<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'logged_date' => ['sometimes', 'required', 'date'],
            'value' => ['sometimes', 'required'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
