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

    'campus_name' => (string) env('CAMPUS_NAME', "St. Rita's College of Balingasag"),
    'campus_latitude' => (float) env('CAMPUS_LATITUDE', 8.743070),
    'campus_longitude' => (float) env('CAMPUS_LONGITUDE', 124.774500),
    'campus_radius_m' => (int) env('CAMPUS_RADIUS_M', 300),

];
