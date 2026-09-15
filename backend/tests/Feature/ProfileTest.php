<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_name_and_email(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->patchJson('/api/user', [
            'name' => 'Renamed',
            'email' => 'renamed@example.com',
        ])->assertOk()->assertJsonPath('email', 'renamed@example.com');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Renamed']);
    }

    public function test_email_must_be_unique(): void
    {
        $taken = User::factory()->create(['email' => 'taken@example.com']);
        $user = User::factory()->create();

        $this->actingAs($user)->patchJson('/api/user', ['email' => $taken->email])
            ->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_password_change_requires_correct_current_password(): void
    {
        $user = User::factory()->create(['password' => Hash::make('original-password')]);

        $this->actingAs($user)->patchJson('/api/user', [
            'current_password' => 'wrong-password',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ])->assertStatus(422)->assertJsonValidationErrors('current_password');
    }

    public function test_user_can_change_password_with_correct_current_password(): void
    {
        $user = User::factory()->create(['password' => Hash::make('original-password')]);

        $this->actingAs($user)->patchJson('/api/user', [
            'current_password' => 'original-password',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ])->assertOk();

        $this->assertTrue(Hash::check('new-password123', $user->fresh()->password));
    }
}
