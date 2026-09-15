<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWidgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * A widget stays bound to its original metric; only the chart type and
     * its configuration can change.
     */
    public function rules(): array
    {
        return [
            'chart_type' => ['sometimes', 'required', 'in:line,bar,stat,streak'],
            'config' => ['sometimes', 'array'],
        ];
    }
}
