<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'metric_id' => ['required', 'integer', 'exists:metrics,id'],
            'logged_date' => ['required', 'date'],
            'value' => ['required'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
