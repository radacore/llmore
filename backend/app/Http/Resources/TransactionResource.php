<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $_request): array
    {
        $type = $this->plan_id ? 'subscription' : 'top_up';

        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'type' => $type,
            'token_amount' => $type === 'subscription' ? $this->plan?->token_quota : null,
            'credit_amount' => $type === 'subscription' ? $this->plan?->token_quota : null,
            'plan' => [
                'name' => $this->plan->name,
                'slug' => $this->plan->slug,
            ],
            'amount' => $this->amount,
            'formatted_amount' => 'Rp ' . number_format($this->amount, 0, ',', '.'),
            'status' => $this->status,
            'payment_type' => $this->payment_type,
            'paid_at' => $this->paid_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
