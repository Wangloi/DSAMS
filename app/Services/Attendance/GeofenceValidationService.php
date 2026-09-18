<?php

namespace App\Services\Attendance;

class GeofenceValidationService
{
    /**
     * Calculate Haversine distance in meters between two coordinates.
     */
    public function haversineDistanceMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000;

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Validate whether coordinates are within allowed event geofence radius.
     */
    public function validate($event, ?float $lat, ?float $lng, ?float $accuracyM): ?array
    {
        if (! (bool) ($event->geofence_enabled ?? false)) {
            return null;
        }

        if ($lat === null || $lng === null) {
            return [
                'status'  => 422,
                'message' => 'Location coordinates are required to record attendance for this event.',
            ];
        }

        // Coordinate sanity checks (-90 to 90 lat, -180 to 180 lng)
        if ($lat < -90.0 || $lat > 90.0 || $lng < -180.0 || $lng > 180.0) {
            return [
                'status'  => 422,
                'message' => 'Invalid GPS coordinates detected.',
            ];
        }

        // Accuracy handling
        $accuracy = ($accuracyM !== null && $accuracyM > 0) ? (float) $accuracyM : 15.0;

        if ($accuracy > 1000) {
            return [
                'status'  => 422,
                'message' => 'Location accuracy is too low (' . round($accuracy) . 'm). Please move to an open area and try again.',
            ];
        }

        $eventLat = $event->geofence_latitude ?? config('geofence.campus_latitude', 8.743070);
        $eventLng = $event->geofence_longitude ?? config('geofence.campus_longitude', 124.774500);
        $radius = (int) ($event->geofence_radius_m ?? 50);
        if ($radius <= 0) {
            $radius = 50;
        }

        $distance = $this->haversineDistanceMeters((float) $lat, (float) $lng, (float) $eventLat, (float) $eventLng);
        $buffer = min($accuracy, 50.0);

        if (($distance - $buffer) > $radius) {
            return [
                'status'  => 403,
                'message' => 'Geofence violation: You must be physically at the event venue to check in/out. (Distance: ' . round($distance) . 'm, Allowed: ' . $radius . 'm)',
                'distance_m' => round($distance, 1),
                'allowed_radius_m' => $radius,
            ];
        }

        return null;
    }
}
