<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'plan' => new PlanResource($this->whenLoaded('plan')),
            'status' => $this->status,
            'token_quota' => $this->token_quota,
            'credit_quota' => $this->token_quota,
            'token_used' => $this->token_used,
            'credit_used' => $this->token_used,
            'remaining_tokens' => $this->remainingTokens(),
            'remaining_credits' => $this->remainingTokens(),
            'usage_percentage' => $this->usagePercentage(),
            'starts_at' => $this->starts_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
        ];
    }
}
