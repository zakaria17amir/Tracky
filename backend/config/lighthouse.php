<?php

use Nuwave\Lighthouse\Http\Middleware\AcceptJson;
use Nuwave\Lighthouse\Http\Middleware\AttemptAuthentication;

// Only the settings Tracky changes; everything else falls back to Lighthouse's defaults.
return [
    'route' => [
        'uri' => '/api/graphql',
        'name' => 'graphql',
        'middleware' => [
            AcceptJson::class,
            // Same Bearer-token gate as the REST API: guests get a 401 before GraphQL runs.
            'auth:sanctum',
            AttemptAuthentication::class,
        ],
    ],

    'guards' => ['sanctum'],

    // The query cache stores parsed ASTs as serialized objects, which Laravel 13's cache refuses to
    // unserialize (cache.serializable_classes = false). Parsing the one dashboard query is cheap.
    'query_cache' => ['enable' => false],
];
