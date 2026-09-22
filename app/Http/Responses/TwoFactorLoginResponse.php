<?php

namespace App\Http\Responses;

use App\Support\ActiveAuth;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

/**
 * Custom two-factor login response that redirects to the correct
 * dashboard based on the guard stored in the session.
 */
class TwoFactorLoginResponse implements TwoFactorLoginResponseContract
{
    public function toResponse($request): Response
    {
        $guard = $request->session()->pull('login.guard', 'web');

        $redirectUrl = ActiveAuth::backUrl($guard);

        if ($request->wantsJson()) {
            return new JsonResponse(['two_factor' => true], 200);
        }

        return redirect()->intended($redirectUrl);
    }
}
