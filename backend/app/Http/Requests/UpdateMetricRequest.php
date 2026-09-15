<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateMetricRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by the policy in the controller.
    }

    /**
     * The metric `type` is immutable after creation (changing it would orphan
     * existing typed entry values), so it is not accepted here.
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'unit' => ['nullable', 'string', 'max:30'],
            'scale_min' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'scale_max' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $metric = $this->route('metric');
            if ($metric && $metric->type === 'scale') {
                $min = (int) $this->input('scale_min', $metric->scale_min);
                $max = (int) $this->input('scale_max', $metric->scale_max);
                if ($max <= $min) {
                    $v->errors()->add('scale_max', 'The scale maximum must be greater than the minimum.');
                }
            }
        });
    }
}
