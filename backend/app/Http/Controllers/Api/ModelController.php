<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class ModelController extends Controller
{
    /**
     * List available AI models from AskCodi.
     * Cache for 1 hour to avoid hitting AskCodi API too often.
     */
    public function index(): JsonResponse
    {
        $models = Cache::remember('askcodi_models', 3600, function () {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . config('services.askcodi.api_key'),
                ])->timeout(10)->get(config('services.askcodi.api_url') . '/models');

                if ($response->successful()) {
                    $data = $response->json('data', []);

                    return collect($data)->map(function ($model) {
                        $config = $model['config'] ?? [];
                        $cost = $config['cost'] ?? [];
                        $limits = $config['limits'] ?? [];

                        return [
                            'id' => $model['id'],
                            'owned_by' => $model['owned_by'] ?? 'unknown',
                            'context_length' => $limits['context_length']['max'] ?? $model['context_length'] ?? null,
                            'input_price' => $cost['per_million_input'] ?? null,
                            'output_price' => $cost['per_million_output'] ?? null,
                            'input_multiplier' => $cost['input_token_multiplier'] ?? 1.0,
                            'output_multiplier' => $cost['output_token_multiplier'] ?? 1.0,
                            'is_free' => str_contains($model['id'] ?? '', ':free'),
                        ];
                    })->values()->all();
                }

                return [];
            } catch (\Exception $e) {
                return [];
            }
        });

        return response()->json(['data' => $models]);
    }
}
