<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureStudentApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::guard('student')->check()) {
            $student = Auth::guard('student')->user();
            if ($student && $student->status !== 'approved') {
                Auth::guard('student')->logout();
                return redirect()->route('student.login')->with('error', 'Your account is pending approval. Please wait for admin verification.');
            }
        }

        return $next($request);
    }
}