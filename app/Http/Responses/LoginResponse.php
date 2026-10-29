<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): Response
    {
        $guard = \App\Support\ActiveAuth::resolve($request);
        $user = $guard ? Auth::guard($guard)->user() : null;

        if ($guard === 'admin' || ($user && $user->role === 'admin')) {
            $redirectUrl = '/admin-dashboard';
        } elseif ($guard === 'program_head' || ($user && $user->role === 'program_head')) {
            $redirectUrl = '/program-head-dashboard';
        } else {
            $redirectUrl = '/student-dashboard';
        }

        return redirect($redirectUrl);
    }
}
