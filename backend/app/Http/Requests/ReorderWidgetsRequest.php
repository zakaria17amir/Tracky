<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReorderWidgetsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'widget_ids' => ['required', 'array', 'min:1'],
            'widget_ids.*' => ['integer', 'distinct'],
        ];
    }
}
