<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Handle an incoming request.
     *
     * Cek apakah user yang terautentikasi memiliki status 'active'.
     * Jika suspended, kembalikan response 403.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->status !== 'active') {
            return response()->json([
                'error' => 'account_suspended',
                'message' => 'Your account has been suspended',
            ], 403);
        }

        return $next($request);
    }
}
