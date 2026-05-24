<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class ModelController extends Controller
{
    public function index(): JsonResponse
    {
        $models = Cache::remember('upstream_models', 3600, function () {
            try {
                $request = Http::timeout(10);

                $apiKey = config('services.upstream.api_key');
                if (!empty($apiKey)) {
                    $request = $request->withHeaders(['Authorization' => 'Bearer ' . $apiKey]);
                }

                $response = $request->get(config('services.upstream.api_url') . '/models');

                if ($response->successful()) {
                    $data = $response->json('data', []);

                    return collect($data)->map(function ($model) {
                        $pricing = $model['pricing'] ?? [];

                        return [
                            'id' => $model['id'] ?? null,
                            'owned_by' => $model['owned_by'] ?? ($model['top_provider']['name'] ?? 'unknown'),
                            'context_length' => $model['context_length']
                                ?? ($model['top_provider']['context_length'] ?? null),
                            'input_price' => $pricing['prompt'] ?? null,
                            'output_price' => $pricing['completion'] ?? null,
                            'is_free' => self::isFreePricing($pricing),
                        ];
                    })->values()->all();
                }

                return [];
            } catch (\Exception) {
                return [];
            }
        });

        return response()->json(['data' => $models]);
    }

    private static function isFreePricing(array $pricing): bool
    {
        $prompt = isset($pricing['prompt']) ? (float) $pricing['prompt'] : 1.0;
        $completion = isset($pricing['completion']) ? (float) $pricing['completion'] : 1.0;
        return $prompt === 0.0 && $completion === 0.0;
    }
}
