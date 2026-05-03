<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class AdminUserResource extends UserResource
{
    /**
     * Transform the resource into an array.
     *
     * Extends UserResource dengan data tambahan untuk admin:
     * - active subscription dengan plan
     * - jumlah API keys
     * - total tokens yang sudah digunakan
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'subscription' => $this->whenLoaded('subscriptions', function () {
                $active = $this->subscriptions->where('status', 'active')->first();
                return $active ? new SubscriptionResource($active) : null;
            }),
            'api_keys_count' => $this->whenCounted('apiKeys'),
            'total_tokens_used' => $this->whenLoaded('usageLogs', fn () => $this->usageLogs->sum('total_tokens')),
        ]);
    }
}
