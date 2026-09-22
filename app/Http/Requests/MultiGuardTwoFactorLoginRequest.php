<?php

namespace App\Http\Requests;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\FailedTwoFactorLoginResponse;
use Laravel\Fortify\Http\Requests\TwoFactorLoginRequest as FortifyTwoFactorLoginRequest;

/**
 * Custom two-factor login request that supports multi-guard authentication.
 *
 * Fortify's default TwoFactorLoginRequest resolves the challenged user via
 * the StatefulGuard's provider model (bound to the 'web' guard). Since DSAMS
 * uses custom guards (student, admin, program_head) with separate Eloquent
 * models, we override the user-resolution methods to look up the correct
 * model based on the 'login.guard' session value stored by TwoFactorLoginHelper.
 */
class MultiGuardTwoFactorLoginRequest extends FortifyTwoFactorLoginRequest
{
    /**
     * Determine if there is a challenged user in the current session.
     */
    public function hasChallengedUser(): bool
    {
        if ($this->challengedUser) {
            return true;
        }

        $model = $this->resolveModelClass();

        return $this->session()->has('login.id')
            && $model::find($this->session()->get('login.id'));
    }

    /**
     * Get the user that is attempting the two factor challenge.
     */
    public function challengedUser()
    {
        if ($this->challengedUser) {
            return $this->challengedUser;
        }

        $model = $this->resolveModelClass();

        if (
            ! $this->session()->has('login.id') ||
            ! $user = $model::find($this->session()->get('login.id'))
        ) {
            throw new HttpResponseException(
                app(FailedTwoFactorLoginResponse::class)->toResponse($this)
            );
        }

        return $this->challengedUser = $user;
    }

    /**
     * Resolve the Eloquent model class for the challenged user based on
     * the guard stored in the session by TwoFactorLoginHelper.
     */
    protected function resolveModelClass(): string
    {
        $guard = $this->session()->get('login.guard', 'web');

        $providerName = config("auth.guards.{$guard}.provider", 'users');

        return config("auth.providers.{$providerName}.model", \App\Models\User::class);
    }
}
