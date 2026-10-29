<?php
return [
    // Auditable route name patterns (wildcards are allowed)
    'routes' => [
        'admin.*',
        'program_head.*',
        'evaluation.*',
        'attendance.*',
        'events.*',
    ],

    // Routes excluded from auditing (high-frequency polling, logs, heartbeats, tokens)
    'excluded_routes' => [
        'admin.attendance.logs',
        'program-head.attendance.logs',
        'admin.attendance.dynamic-qr-token',
        'program-head.attendance.dynamic-qr-token',
        'student.events.logs',
        'student.attendance.logs',
        '*.logs',
        '*.dynamic-qr-token',
    ],

    // Redis key prefixes for each alert type
    'redis_prefixes' => [
        'login_failed'   => 'audit:login_failed',
        'qr_invalid'    => 'audit:qr_invalid',
        'access_denied' => 'audit:access_denied',
        'geofence_fail' => 'audit:geofence_fail',
    ],

    // Thresholds (limit per window in seconds)
    'thresholds' => [
        'login_failed'   => ['limit' => 5,  'window' => 60],
        'qr_invalid'    => ['limit' => 10, 'window' => 60],
        'access_denied' => ['limit' => 5,  'window' => 60],
        'geofence_fail' => ['limit' => 5,  'window' => 60],
    ],
];
