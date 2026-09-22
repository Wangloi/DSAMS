<?php

namespace App\Support;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * Helper to integrate two-factor authentication with custom multi-guard login.
 *
 * Fortify's built-in 2FA pipeline only works with the default 'web' guard.
 * Since DSAMS uses custom guards (student, admin, program_head), the login
 * controllers need to manually check for 2FA after credential validation
 * and redirect to the challenge page when enabled.
 *
 * Session keys used:
 *   - login.id       : The primary key of the challenged user (Fortify convention)
 *   - login.guard     : The guard name used to authenticate (custom)
 *   - login.remember  : Whether the "remember me" checkbox was ticked (Fortify convention)
 */
class TwoFactorLoginHelper
{
    /**
     * Check whether a successfully authenticated user needs to complete
     * a two-factor challenge before being fully logged in.
     *
     * If 2FA is enabled on the user:
     *   1. Logs the user out of the given guard (credentials are valid but session must wait)
     *   2. Stores the user ID, guard, and remember preference in the session
     *   3. Returns a redirect response to /two-factor-challenge
     *
     * If 2FA is NOT enabled, returns null so the caller can proceed normally.
     *
     * @param  Request            $request
     * @param  Authenticatable    $user     The authenticated user model
     * @param  string             $guard    The guard name (e.g. 'admin', 'student', 'program_head')
     * @param  bool               $remember Whether "remember me" was checked
     * @return \Illuminate\Http\RedirectResponse|null
     */
    public static function redirectIfTwoFactorEnabled(
        Request $request,
        Authenticatable $user,
        string $guard,
        bool $remember = false,
    ) {
        // Only check if the user model uses the TwoFactorAuthenticatable trait
        if (! in_array(TwoFactorAuthenticatable::class, class_uses_recursive($user))) {
            return null;
        }

        if (! $user->hasEnabledTwoFactorAuthentication()) {
            return null;
        }

        // Log out from the guard — credentials are valid but 2FA is pending
        Auth::guard($guard)->logout();

        // Store challenge data in the session (Fortify reads login.id and login.remember)
        $request->session()->put([
            'login.id'       => $user->getAuthIdentifier(),
            'login.guard'    => $guard,
            'login.remember' => $remember,
        ]);

        return redirect()->route('two-factor.login');
    }
}
