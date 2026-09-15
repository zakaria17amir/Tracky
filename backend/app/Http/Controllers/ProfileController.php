<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Return the authenticated user's profile.
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    /**
     * Update the authenticated user's name, email and/or password.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes', 'required', 'string', 'lowercase', 'email', 'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'current_password' => ['required_with:password', 'current_password'],
            'password' => ['sometimes', 'required', 'confirmed', Password::defaults()],
        ]);

        if (isset($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->fill(collect($validated)->only(['name', 'email'])->toArray());

        // Re-verification on email change is out of scope (no mail configured).
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return response()->json($user);
    }
}
