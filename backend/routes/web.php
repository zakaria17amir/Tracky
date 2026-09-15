<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['app' => 'Tracky API', 'version' => app()->version()];
});
