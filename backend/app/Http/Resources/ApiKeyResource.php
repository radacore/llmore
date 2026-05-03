<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApiKeyResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // last_used_at may be a Carbon instance (from DB) or a string (enriched from Redis)
        $lastUsedAt = $this->last_used_at;
        if ($lastUsedAt instanceof \Carbon\Carbon) {
            $lastUsedAt = $lastUsedAt->toISOString();
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'key_prefix' => $this->key_prefix,
            'status' => $this->status,
            'last_used_at' => $lastUsedAt,
            'created_at' => $this->created_at->toISOString(),
            'revoked_at' => $this->revoked_at?->toISOString(),
        ];
    }
}
