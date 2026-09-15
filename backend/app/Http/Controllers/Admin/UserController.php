<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserRoleRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class UserController extends Controller
{
    /**
     * Paginated list of all users with summary counts (admin only).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $users = User::query()
            ->withCount(['metrics', 'entries', 'dashboards'])
            ->orderBy('name')
            ->paginate($request->integer('per_page', 25));

        return UserResource::collection($users);
    }

    /**
     * Full profile and counts for any user (admin read access).
     */
    public function show(User $user): UserResource
    {
        return new UserResource(
            $user->loadCount(['metrics', 'entries', 'dashboards'])
        );
    }

    /**
     * Change a user's role (admin only). Admins cannot change their own role
     * to avoid accidentally removing the last administrator's access.
     */
    public function update(UpdateUserRoleRequest $request, User $user): UserResource
    {
        if ($user->id === $request->user()->id) {
            abort(403, 'You cannot change your own role.');
        }

        // `role` is guarded, so set it explicitly rather than via mass assignment.
        $user->role = $request->validated()['role'];
        $user->save();

        return new UserResource($user);
    }

    /**
     * Hard-delete a user and cascade all their data (admin only).
     */
    public function destroy(Request $request, User $user): Response
    {
        if ($user->id === $request->user()->id) {
            abort(403, 'You cannot delete your own account from the admin panel.');
        }

        $user->delete();

        return response()->noContent();
    }
}
