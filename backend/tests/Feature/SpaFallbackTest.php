<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Tests\TestCase;

class SpaFallbackTest extends TestCase
{
    private string $index;

    protected function setUp(): void
    {
        parent::setUp();
        $this->index = public_path('index.html');
    }

    protected function tearDown(): void
    {
        File::delete($this->index);
        parent::tearDown();
    }

    public function test_client_routes_serve_the_spa_when_it_is_built_into_public(): void
    {
        File::put($this->index, '<!doctype html><div id="root"></div>');

        foreach (['/', '/metrics', '/metrics/3/history', '/admin/users/2'] as $path) {
            $this->get($path)->assertOk()->assertSee('<div id="root">', false);
        }
    }

    public function test_unknown_api_routes_still_return_json_404(): void
    {
        File::put($this->index, '<!doctype html><div id="root"></div>');

        $this->getJson('/api/nope')->assertNotFound()->assertJsonStructure(['message']);
    }

    public function test_health_check_is_not_swallowed_by_the_spa_route(): void
    {
        File::put($this->index, '<!doctype html><div id="root"></div>');

        $this->get('/up')->assertOk()->assertDontSee('<div id="root">', false);
    }

    public function test_root_describes_the_api_when_no_spa_is_built(): void
    {
        $this->getJson('/')->assertOk()->assertJsonPath('app', 'Tracky API');
    }
}
