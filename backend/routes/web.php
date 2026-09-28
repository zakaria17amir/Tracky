<?php

use Illuminate\Support\Facades\Route;

// In the Docker image the built SPA sits in public/; every non-API path returns its index.html
// so React Router can take over. In development Vite serves the SPA and / describes the API.
Route::get('/{path?}', function () {
    $spa = public_path('index.html');

    return is_file($spa)
        ? response(file_get_contents($spa))->header('Content-Type', 'text/html; charset=UTF-8')
        : ['app' => 'Tracky API', 'version' => app()->version()];
})->where('path', '^(?!api(/|$)).*');
