<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWidgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'metric_id' => ['required', 'integer', 'exists:metrics,id'],
            'chart_type' => ['required', 'in:line,bar,stat,streak'],
            'config' => ['nullable', 'array'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
