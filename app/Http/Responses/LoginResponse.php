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
        $user = Auth::user();

        if ($user->role === 'admin') {
            $redirectUrl = '/admin-dashboard';
        } elseif ($user->role === 'program_head') {
            $redirectUrl = '/program-head-dashboard';
        } else {
            $redirectUrl = '/student-dashboard';
        }

        return redirect($redirectUrl);
    }
}
