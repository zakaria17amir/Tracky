<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'entries' => ['required', 'array', 'min:1', 'max:100'],
            'entries.*.metric_id' => ['required', 'integer', 'exists:metrics,id'],
            'entries.*.logged_date' => ['required', 'date'],
            'entries.*.value' => ['required'],
            'entries.*.notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
