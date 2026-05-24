<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlanResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $features = $this->features;
        if (is_string($features)) {
            $features = json_decode($features, true) ?? [];
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => $this->price,
            'token_quota' => $this->token_quota,
            'credit_quota' => $this->token_quota,
            'rate_limit_per_minute' => $this->rate_limit_per_minute,
            'max_api_keys' => $this->max_api_keys,
            'features' => $features,
            'is_active' => $this->is_active,
            'is_official' => (bool) $this->is_official,
        ];
    }
}
