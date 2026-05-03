<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class AdminTransactionResource extends TransactionResource
{
    /**
     * Transform the resource into an array.
     *
     * Extends TransactionResource dengan data tambahan untuk admin:
     * - user info (id, name, email)
     * - full midtrans_response
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ],
            'payment_response' => $this->payment_response,
        ]);
    }
}
