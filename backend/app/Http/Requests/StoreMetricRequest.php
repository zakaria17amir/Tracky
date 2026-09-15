<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreMetricRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Ownership is enforced by attaching auth user id in the controller.
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'type' => ['required', 'in:numeric,scale,boolean'],
            'unit' => ['nullable', 'string', 'max:30'],
            'scale_min' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'scale_max' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'is_active' => ['boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $type = $this->input('type');

            if ($type === 'scale') {
                $min = (int) $this->input('scale_min', 1);
                $max = (int) $this->input('scale_max', 10);
                if ($max <= $min) {
                    $v->errors()->add('scale_max', 'The scale maximum must be greater than the minimum.');
                }
            }
        });
    }

    protected function prepareForValidation(): void
    {
        // Normalize: only numeric metrics keep a unit; only scale metrics keep bounds.
        if ($this->input('type') !== 'numeric') {
            $this->merge(['unit' => null]);
        }
        if ($this->input('type') !== 'scale') {
            $this->merge(['scale_min' => 1, 'scale_max' => 10]);
        }
    }
}
