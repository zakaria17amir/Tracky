<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication Routes (Sanctum API tokens)
|--------------------------------------------------------------------------
| Public endpoints issue a Bearer token; protected endpoints require the
| `auth:sanctum` guard. These are loaded under the /api prefix.
*/

// 20/min per IP: curbs automated mass-registration without blocking users
// behind shared NAT (or the E2E suite, which creates several accounts quickly).
Route::post('/register', [RegisteredUserController::class, 'store'])
    ->middleware(['guest', 'throttle:20,1'])
    ->name('register');

Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware(['guest', 'throttle:10,1'])
    ->name('login');

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth:sanctum')
    ->name('logout');
