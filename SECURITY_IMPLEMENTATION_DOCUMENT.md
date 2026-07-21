# Security Implementation Document (SID) for DSAMS
**Course Code & Title**: ITP 401 – Information Assurance and Security 2  
**Year Level**: Fourth Year  
**S.Y./Semester**: 2026–2027 / 1st Semester  
**Capstone Project**: Dean of Student Affairs Management System (DSAMS)  
**Date**: July 17, 2026  
**Group Members**:  
- Hannah Felexabeth G. Abao  
- Maricar T. Bahala  
- Ishi Trixie Loraine G. Regodon  
- Joshua Angelo Arquita  
- Von Cedric Miranda  

---

## System Security Architecture Diagram

```mermaid
graph TD
    A[User Browser (React/Inertia)] -->|HTTPS| B[Laravel Backend]
    B -->|Session Cookie| A
    B -->|SQL Queries| C[(Database)]
    B -->|File Storage| D[Public Storage]
    E[Admin] -->|auth:admin| B
    F[Student] -->|auth:student, approved| B
    G[Program Head] -->|auth:program_head| B
    H[CSRF Token] -->|Every Request| B
    I[Input Validation] -->|Frontend & Backend| B
    J[Rate Limiting] -->|Login, API, and Web Routes| B
```

---

## Phase 1: Frontend-to-Backend Security Architecture Map

### 1. System Security Architecture Overview
The DSAMS follows a client-server architecture. Users access the system using a web browser running React with Inertia.js. All requests are sent securely to the Laravel backend through HTTPS. Laravel authenticates users using Fortify and session-based cookies before allowing access to protected resources. The backend validates all incoming data before interacting with the MySQL database. Sessions are stored securely using database-backed session storage.

### 2. Data in Transit
Communication between the frontend and backend is protected using HTTPS with TLS encryption. During development, localhost may use HTTP, but production must use HTTPS with valid SSL certificates.

Production environment settings include:
- `APP_ENV=production`
- `SESSION_SECURE_COOKIE=true`

Session cookies are configured as:
- `HttpOnly`
- `SameSite=Lax`
- `Secure` (in production)

This prevents attackers from reading session cookies using JavaScript and ensures encrypted communication between the client and server.

### 3. CORS (Cross-Origin Resource Sharing) Policy
DSAMS is a monolithic Laravel application using React with Inertia.js. Since the frontend and backend are served from the same application, there are no separate frontend servers making cross-origin API requests. The project does not have a dedicated CORS package (such as `fruitcake/laravel-cors`) installed, and no `config/cors.php` configuration file exists. Because all traffic originates from the same origin, the browser's Same-Origin Policy inherently blocks unauthorized cross-origin requests without requiring explicit CORS headers. This architecture minimizes exposure to cross-origin attacks.

### 4. Input Validation and Sanitization
#### Frontend Validation
The frontend performs validation using:
- HTML5 form validation
- React state validation
- Required fields
- Input length validation
- File type validation

These checks improve user experience by detecting invalid input before submission.

#### Backend Validation
The backend performs server-side validation using Laravel's validation rules.

**Example from [StudentIncidentController.php](file:///c:/laragon/www/DSAMS/app/Http/Controllers/StudentIncidentController.php#L25-L42)**:
```php
$validated = $request->validate([
    'violation_id' => ['nullable', 'exists:violations,id'],
    'incident_type' => ['required', 'string', 'max:255'],
    'incident_date' => ['required', 'date'],
    'incident_time' => ['required', 'date_format:H:i'],
    'location' => ['required', 'string', 'max:255'],
    'reported_by' => ['required', 'string', 'max:255'],
    'students_involved' => ['required', 'array', 'min:1'],
    'students_involved.*' => ['required', 'array:id,name'],
    'description' => ['required', 'string'],
    'evidences' => ['nullable', 'array', 'max:5'],
    'evidences.*' => ['file', 'max:5120', 'mimes:jpg,jpeg,png,pdf'],
]);
```

Backend validation protects the system from:
- SQL Injection
- Cross-Site Scripting (XSS)
- Invalid file uploads
- Malicious input

---

## Phase 2: Authentication and Authorization Deep Dive

### Authentication Method Used
The DSAMS uses **Laravel Fortify with session-based authentication**. Unlike JWT or OAuth, authenticated users receive a secure session cookie after successful login.

Three authentication guards are implemented:
1. Admin
2. Student
3. Program Head

Each guard authenticates users independently and grants access only to authorized pages.

### Laravel Fortify Features
Enabled Fortify features include:
- Login
- Registration
- Password Reset
- Email Verification
- Two-Factor Authentication

Sessions are maintained using:
- Database session driver
- HttpOnly cookies
- SameSite=Lax cookies
- Secure cookies in production

**Configuration from [config/session.php](file:///c:/laragon/www/DSAMS/config/session.php#L21-L202)**:
```php
'driver' => 'database',
'lifetime' => 10,
'http_only' => true,
'secure' => env('SESSION_SECURE_COOKIE'),
'same_site' => 'lax',
'encrypt' => true,
```

### Authentication Middleware

#### AuthenticateActiveGuard Middleware
Example from [AuthenticateActiveGuard.php](file:///c:/laragon/www/DSAMS/app/Http/Middleware/AuthenticateActiveGuard.php#L18-L38):
```php
public function handle($request, Closure $next, ...$guards): mixed
{
    $allowed = count($guards) > 0 ? $guards : ActiveAuth::GUARDS;

    $active = ActiveAuth::setDefaultGuard($request);

    if ($active !== null && in_array($active, $allowed, true)) {
        return $next($request);
    }

    foreach ($allowed as $guard) {
        if ($this->auth->guard($guard)->check()) {
            $request->session()->put('active_guard', $guard);
            $this->auth->shouldUse($guard);

            return $next($request);
        }
    }

    $this->unauthenticated($request, $allowed);
}
```
Only authenticated users can access protected pages.

#### EnsureStudentApproved Middleware
Example from [EnsureStudentApproved.php](file:///c:/laragon/www/DSAMS/app/Http/Middleware/EnsureStudentApproved.php):
```php
public function handle($request, Closure $next)
{
    $student = auth()->guard('student')->user();
    if (!$student || !$student->is_active) {
        abort(403, 'Your account is not yet approved.');
    }
    return $next($request);
}
```
Students must first be approved by the administrator before accessing the system.

### Other Authentication Methods
- **JWT**: Not implemented. The project uses Laravel Fortify with session-based authentication instead of JSON Web Tokens.
- **Laravel Sanctum**: Not implemented. The application currently does not use Sanctum because it is not exposing REST APIs or mobile authentication.
- **OAuth / Social Login**: Not implemented. The system currently uses only the built-in login system provided by Laravel Fortify.

---

## Phase 3: Strict API Rate Limiting Configuration

### Authentication Routes
Login attempts are limited to:
- 5 login attempts per minute
- Separate limiters for Admin
- Separate limiters for Student
- Separate limiters for Program Head
- Two-factor authentication limited to 5 attempts per minute

This reduces brute-force attacks.

### General API and Web Routes
**Current Status**: Implemented!
- API routes: 60 requests per minute
- Web routes: 120 requests per minute

### Rate Limiter Code

#### Fortify Rate Limiting from [app/Providers/FortifyServiceProvider.php](file:///c:/laragon/www/DSAMS/app/Providers/FortifyServiceProvider.php#L82-L150):
```php
private function configureRateLimiting(): void
{
    RateLimiter::for('two-factor', function (Request $request) {
        return Limit::perMinute(5)->by($request->session()->get('login.id'));
    });

    RateLimiter::for('login', function (Request $request) {
        $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())));
        return Limit::perMinute(5)->by($throttleKey);
    });

    RateLimiter::for('admin-login', function (Request $request) {
        $throttleKey = 'admin|' . Str::transliterate(Str::lower($request->input(Fortify::username())));
        return Limit::perMinute(5)->by($throttleKey);
    });

    RateLimiter::for('program-head-login', function (Request $request) {
        $throttleKey = 'program_head|' . Str::transliterate(Str::lower($request->input(Fortify::username())));
        return Limit::perMinute(5)->by($throttleKey);
    });
}
```

#### General Rate Limiting from [app/Providers/AppServiceProvider.php](file:///c:/laragon/www/DSAMS/app/Providers/AppServiceProvider.php#L38-L50):
```php
protected function configureRateLimiting(): void
{
    \Illuminate\Support\Facades\RateLimiter::for('api', function (\Illuminate\Http\Request $request) {
        return \Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by(
            $request->user()?->id ?: $request->ip()
        );
    });

    \Illuminate\Support\Facades\RateLimiter::for('web', function (\Illuminate\Http\Request $request) {
        return \Illuminate\Cache\RateLimiting\Limit::perMinute(120)->by(
            $request->user()?->id ?: $request->ip()
        );
    });
}
```

### Route Application from [routes/web.php](file:///c:/laragon/www/DSAMS/routes/web.php#L66-L71):
```php
Route::post('/login', [UnifiedLoginController::class, 'login'])->middleware('throttle:login');
Route::post('/admin-login', [AdminLoginController::class, 'login'])->middleware('throttle:admin-login');
Route::post('/program-head-login', [ProgramHeadLoginController::class, 'login'])->middleware('throttle:program-head-login');
```

### Known Gaps in Current Implementation
- **Legacy Student Login Route**: The `/student-login` POST route defined at `routes/web.php:70` does not have a throttle middleware applied, unlike the unified `/login`, `/admin-login`, and `/program-head-login` routes. This leaves the legacy student login endpoint vulnerable to unlimited brute-force attempts.
- **Rate Limiter Key Mismatch**: The `login` rate limiter in `FortifyServiceProvider.php` uses `Fortify::username()` as the throttle key. `config/fortify.php` sets `'username' => 'email'`, but the unified login form submits the field as `identifier` (not `email`). This causes the throttle key to resolve to an empty/null value, effectively sharing a single global throttle bucket across all users. After 5 total failed login attempts from any user, all login attempts for all users will be blocked until the rate limit window resets.

---

## Phase 4: Vulnerability and Gap Analysis

### Security Control Status Table
| Security Control           | Current Implementation                                                                 | Status                  | Planned Action                                                                 |
|----------------------------|---------------------------------------------------------------------------------------|-------------------------|--------------------------------------------------------------------------------|
| Token Storage              | Session-based authentication using secure HttpOnly cookies with SameSite protection   | Secure                  | Maintain the current implementation and regularly review cookie security settings. |
| API Throttling             | Login routes limited to 5 requests/minute, API routes 60 requests/minute, Web routes 120 requests/minute | Secure | Continue monitoring request limits and adjust based on application usage. |
| CORS Policy                | Default Laravel CORS configuration for a monolithic application                       | Secure                  | Restrict allowed origins if external APIs or third-party clients are introduced. |
| Session Encryption         | Session encryption enabled with secure session configuration                          | Secure                  | Maintain the current implementation. |
| Password Complexity        | Strong password policy enforced in all environments (minimum 8 characters with uppercase, lowercase, number, and symbol) | Secure | Periodically review password policy according to current security standards. |

### Identified Vulnerabilities
1. **Cross-Site Scripting (XSS)**
   - **Current Status**: Laravel Blade automatically escapes output, reducing XSS risks on server-rendered pages. However, React/Inertia components that display user-generated content may still require additional sanitization.
   - **Risk**: If malicious JavaScript is stored in announcements, incident reports, evaluation comments, or other user-generated content and rendered without proper sanitization, attackers may execute scripts in another user's browser. This could lead to:
     - Session hijacking
     - Data theft
     - Unauthorized actions
     - Website defacement
   - **Remediation**:
     - Sanitize all user-generated content before rendering.
     - Avoid using `dangerouslySetInnerHTML` unless absolutely necessary.
     - Validate and sanitize HTML input using a trusted sanitization library.
     - Continue using Laravel's built-in output escaping.

2. **Future API Security**
    - **Current Status**: The current application is a monolithic Laravel application and does not expose public REST APIs.
    - **Risk**: If REST APIs are introduced in future versions (such as a mobile application or third-party integrations), unauthorized API access could occur if authentication and authorization are not strengthened.
    - **Remediation**:
      - Implement Laravel Sanctum for API authentication.
      - Protect all API endpoints using authentication middleware.
      - Continue applying API rate limiting (60 requests per minute).
      - Monitor API activity through audit logs.

3. **Rate Limiting Misconfiguration on Unified Login**
   - **Current Status**: The `login` rate limiter in `app/Providers/FortifyServiceProvider.php` uses `Fortify::username()` as the throttle key. `config/fortify.php` sets `'username' => 'email'`, but the unified login form submits the field as `identifier` (not `email`). This causes the throttle key to resolve to an empty/null value, effectively sharing a single global throttle bucket across all users.
   - **Risk**: After 5 total failed login attempts from any user, all login attempts (for all users) will be blocked until the rate limit window resets. This creates a denial-of-service vector where an attacker can lock out all users with only 5 requests.
   - **Remediation**:
     - Change the throttle key to use `$request->input('identifier')` instead of `Fortify::username()`, OR
     - Rename the form field from `identifier` to `email`, OR
     - Publish the Fortify config and change the `'username'` value to `'identifier'` to match the form field.

4. **Missing Rate Limiting on Legacy Student Login**
   - **Current Status**: The `/student-login` POST route in `routes/web.php:70` does not have a throttle middleware applied.
   - **Risk**: Attackers can perform unlimited brute-force attacks against student accounts through this endpoint without being blocked.
   - **Remediation**:
     - Apply `->middleware('throttle:login')` to the `/student-login` route, OR
     - Create a dedicated `student-login` rate limiter with the same 5 attempts per minute limit.

---

## Conclusion
The DSAMS implements a strong security foundation using Laravel Fortify, session-based authentication, database-backed sessions, server-side validation, CSRF protection, and comprehensive rate limiting. Security enhancements (session encryption, password complexity in all environments, general API/web rate limiting) have been implemented, aligning the system more closely with OWASP Top 10 recommendations while maintaining secure authentication and authorization practices.

---

## Presentation & Defense Guide

### Rubric Alignment
| Rubric Criterion | Document Section | Key Evidence |
|---|---|---|
| System Architecture & Data Flow (15 pts) | Phase 1: Frontend-to-Backend Security Architecture Map | Mermaid diagram, HTTPS/TLS, SameSite/Lax cookies, input validation points |
| Technical Implementation & Configurations (15 pts) | Phase 2 & Phase 3 | FortifyServiceProvider rate limiters, session.php encryption, AuthenticateActiveGuard middleware, route middleware bindings, code snippets |
| Vulnerability Analysis & Remediation Plan (10 pts) | Phase 4: Vulnerability and Gap Analysis | Security Control Status Table, Identified Vulnerabilities with concrete, technical remediation steps |
| Q&A Defense & Team Mastery (10 pts) | Preparation section below | Code references, architectural trade-offs, and gap ownership |

### 15-Minute Presentation Outline
1. **Architecture & Data Flow** (4 min) – Walk through the Mermaid diagram; explain HTTPS, trust boundaries, input validation points, and session cookie flags.
2. **Auth & Configurations** (5 min) – Show FortifyServiceProvider rate limiters, `config/session.php` encryption settings, `AuthenticateActiveGuard` middleware, and route middleware bindings in `routes/web.php`.
3. **Gap Analysis** (3 min) – Present the Security Control Status Table and the most critical identified gaps (e.g., legacy `/student-login` throttle gap, Fortify username-key mismatch) with concrete remediation steps.
4. **Live Demo / Code Review** (2 min) – Briefly show the actual route definitions and middleware in `routes/web.php` and `FortifyServiceProvider.php`.
5. **Transition to Q&A** (1 min) – Invite questions.

### Q&A Preparation & Expected Questions

**Q1: Brute-Force Protection**
*"If I try to brute-force your login route right now, what specific middleware intercepts my requests, and how many attempts do I get before being blocked?"*

**Answer:**
- `/login` (UnifiedLoginController) uses the `throttle:login` middleware, which invokes the `login` rate limiter defined in `app/Providers/FortifyServiceProvider.php:89-106`. It allows **5 attempts per minute**.
- `/admin-login` uses `throttle:admin-login` middleware, invoking the `admin-login` rate limiter (`FortifyServiceProvider.php:109-128`). It allows **5 attempts per minute** per admin username.
- `/program-head-login` uses `throttle:program-head-login` middleware, invoking the `program-head-login` rate limiter (`FortifyServiceProvider.php:131-150`). It allows **5 attempts per minute** per program head username.
- **Known Gap**: The legacy `/student-login` route (`routes/web.php:70`) does **not** have a throttle middleware applied, leaving it vulnerable to unlimited brute-force attempts. Remediation is documented in Phase 4.
- **Known Misconfiguration**: The `login` rate limiter uses `Fortify::username()` as the throttle key, which defaults to `'email'` (`config/fortify.php:48`). However, the unified login form submits the identifier field as `identifier`, not `email`. This causes the throttle key to resolve to an empty/null value, effectively sharing a single global throttle bucket across all users.

**Q2: Token Storage & XSS**
*"Where exactly are your API tokens or session identifiers stored on the frontend, and how are you protecting them from Cross-Site Scripting (XSS) attacks?"*

**Answer:**
- DSAMS does **not** use API tokens or JWT. It uses **Laravel Fortify with session-based authentication**.
- Upon successful login, the server sets a `laravel_session` cookie configured in `config/session.php` with:
  - `HttpOnly: true` – JavaScript cannot read the cookie
  - `SameSite: Lax` – mitigates CSRF
  - `Secure: true` in production – sent only over HTTPS
  - `Encrypt: true` – payload is encrypted
- The cookie is stored automatically by the browser. The React/Inertia frontend does **not** store or manipulate session tokens in `localStorage`, `sessionStorage`, or JavaScript.
- XSS protections:
  - Laravel Blade auto-escapes output
  - React JSX escapes content by default (no `dangerouslySetInnerHTML` usage detected)
  - All user-generated content is validated server-side (e.g., `StudentIncidentController.php`)
  - CSRF tokens are injected into every Inertia request automatically

**Q3: CORS Configuration**
*"Walk me through your CORS configuration. Are you wildcarding (*) origins anywhere in development or production, and why is that a risk for this specific app?"*

**Answer:**
- DSAMS does **not** use a dedicated CORS package (no `fruitcake/laravel-cors` in `composer.json`). There is no `config/cors.php` file.
- Because the React frontend and Laravel backend are served from the **same origin** (monolithic architecture), there are no cross-origin API requests. The browser's **Same-Origin Policy** blocks any cross-origin requests by default.
- We do **not** wildcard (`*`) any origins because:
  1. There are no cross-origin requests to authorize.
  2. Wildcarding CORS would allow any external website to make authenticated requests on behalf of logged-in users, enabling CSRF and data exfiltration.
- If external APIs or mobile clients are introduced in the future, we will implement explicit origin whitelisting via a dedicated CORS package.

### Time Management Tips
- Assign one speaker per rubric section to ensure all members participate.
- Practice with a timer to stay within 14 minutes, leaving a 1-minute buffer before the strict 15-minute cutoff.
- Have code snippets ready on slides for the Technical Implementation section.
