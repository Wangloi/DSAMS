<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Campus center (reference for map UI only)
    |--------------------------------------------------------------------------
    |
    | Set CAMPUS_LATITUDE and CAMPUS_LONGITUDE in .env to your school's real
    | coordinates. Event geofence lat/lng in the database must also be real GPS
    | points captured at each venue (use "Use device GPS" on the admin map).
    |
    */

    'campus_latitude' => (float) env('CAMPUS_LATITUDE', 8.744321),
    'campus_longitude' => (float) env('CAMPUS_LONGITUDE', 124.776543),

];
