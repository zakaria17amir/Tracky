<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Restricted to admins by route middleware.
    }

    public function rules(): array
    {
        return [
            'role' => ['required', 'in:user,admin'],
        ];
    }
}
