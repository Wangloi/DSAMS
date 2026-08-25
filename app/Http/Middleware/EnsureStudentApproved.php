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
             if ($student) {
                 if ($student->status !== 'approved') {
                     Auth::guard('student')->logout();
                     return redirect()->route('student.login')->with('error', 'Your account is pending approval. Please wait for admin verification.');
                 }

                 // Check for pending evaluations
                 $isExcludedRoute = $request->routeIs('student.dashboard') || 
                                    $request->routeIs('student.evaluation.show') || 
                                    $request->routeIs('student.evaluation.submit') ||
                                    $request->routeIs('logout') ||
                                    $request->routeIs('student.complete-profile.store');

                 if (!$isExcludedRoute && $student instanceof \App\Models\Student) {
                     $pendingCount = \App\Http\Controllers\StudentDashboardController::pendingEvaluationsForStudent($student)->count();
                     if ($pendingCount > 0) {
                         return redirect()->route('student.dashboard')->with('error', 'You must complete your pending evaluations first.');
                     }
                 }
             }
        }

        return $next($request);
    }
}