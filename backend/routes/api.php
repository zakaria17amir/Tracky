<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EntryController;
use App\Http\Controllers\MetricController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WidgetController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public auth routes (register / login / logout)
|--------------------------------------------------------------------------
*/
require __DIR__.'/auth.php';

/*
|--------------------------------------------------------------------------
| Authenticated routes (Sanctum Bearer token required)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Current user profile
    Route::get('/user', [ProfileController::class, 'show'])->name('user.show');
    Route::patch('/user', [ProfileController::class, 'update'])->name('user.update');

    // Metrics (owner-scoped, full CRUD) + chart data source
    Route::get('/metrics/{metric}/entries', [MetricController::class, 'entries'])->name('metrics.entries');
    Route::get('/metrics/{metric}/summary', [MetricController::class, 'summary'])->name('metrics.summary');
    Route::apiResource('metrics', MetricController::class);

    // Entries (owner-scoped, full CRUD) + bulk upsert (Quick Log)
    Route::post('/entries/bulk', [EntryController::class, 'bulk'])->name('entries.bulk');
    Route::apiResource('entries', EntryController::class);

    // Dashboards (owner-scoped, full CRUD)
    Route::apiResource('dashboards', DashboardController::class);

    // Widgets (owner-scoped) — nested under dashboards for listing/creating/reordering
    Route::get('/dashboards/{dashboard}/widgets', [WidgetController::class, 'index'])->name('dashboards.widgets.index');
    Route::post('/dashboards/{dashboard}/widgets', [WidgetController::class, 'store'])->name('dashboards.widgets.store');
    Route::patch('/dashboards/{dashboard}/widgets/reorder', [WidgetController::class, 'reorder'])->name('dashboards.widgets.reorder');
    Route::get('/widgets/{widget}', [WidgetController::class, 'show'])->name('widgets.show');
    Route::patch('/widgets/{widget}', [WidgetController::class, 'update'])->name('widgets.update');
    Route::delete('/widgets/{widget}', [WidgetController::class, 'destroy'])->name('widgets.destroy');

    /*
    |----------------------------------------------------------------------
    | Admin routes (role-restricted)
    |----------------------------------------------------------------------
    */
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
        Route::get('/users/{user}', [AdminUserController::class, 'show'])->name('users.show');
        Route::patch('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');
    });
});
