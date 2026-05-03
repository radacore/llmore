<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * Cek apakah user yang terautentikasi memiliki role 'admin'.
     * Jika bukan admin, kembalikan response 403.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json([
                'error' => 'forbidden',
                'message' => 'Admin access required',
            ], 403);
        }

        return $next($request);
    }
}
