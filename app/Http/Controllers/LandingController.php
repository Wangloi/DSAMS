<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class LandingController extends Controller
{
    public function index()
    {
        if (auth()->check()) {
            $role = auth()->user()->role;
            switch ($role) {
                case 'student':
                    return redirect('/student-dashboard');
                case 'program_head':
                    return redirect('/program-head-dashboard');
                case 'admin':
                    return redirect('/admin-dashboard');
            }
        }

        return Inertia::render('landing-page', [
            'isAuthed' => auth()->check(),
            'canRegister' => \Laravel\Fortify\Features::enabled(\Laravel\Fortify\Features::registration()),
        ]);
    }
}
