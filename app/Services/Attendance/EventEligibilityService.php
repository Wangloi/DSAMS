<?php

namespace App\Services\Attendance;

use App\Models\Event;
use App\Models\Student;

class EventEligibilityService
{
    /**
     * Check if a student is eligible to attend or check-in to an event
     * based on the event's targeted courses and year levels.
     */
    public static function isStudentEligible(?Student $student, ?Event $event): bool
    {
        if (! $student || ! $event) {
            return false;
        }

        $courses = is_array($event->courses) ? array_values(array_filter($event->courses)) : [];
        $yearLevels = is_array($event->year_levels) ? array_values(array_filter($event->year_levels)) : [];

        // 1. Filter out all "All", "All Courses", "All Programs", "*", etc.
        $effectiveCourses = array_values(array_filter($courses, function ($c) {
            return ! self::isAllWildcard((string) $c);
        }));

        $effectiveYearLevels = array_values(array_filter($yearLevels, function ($y) {
            return ! self::isAllWildcard((string) $y);
        }));

        // If no specific course restrictions, student passes course check
        $coursePass = empty($effectiveCourses) || self::matchesCourse($student, $effectiveCourses);

        // If no specific year restrictions, student passes year level check
        $yearPass = empty($effectiveYearLevels) || self::matchesYearLevel($student, $effectiveYearLevels);

        return $coursePass && $yearPass;
    }

    /**
     * Check if a string represents an "All" / wildcard target.
     */
    public static function isAllWildcard(?string $value): bool
    {
        if ($value === null) {
            return true;
        }

        $trimmed = trim(strtolower($value));
        if ($trimmed === '' || $trimmed === '*' || $trimmed === 'all' || $trimmed === 'any' || $trimmed === 'general' || $trimmed === 'n/a') {
            return true;
        }

        // Handles strings like "all courses", "all programs", "all year levels", "all years", "all departments", "all grade/year level"
        if (preg_match('/^all\s*(courses?|programs?|departments?|years?|year\s*levels?|grades?)?$/i', $trimmed)) {
            return true;
        }

        return false;
    }

    /**
     * Check if a student's course/program matches any of the target courses.
     */
    public static function matchesCourse(Student $student, array $targetCourses): bool
    {
        $studentValues = self::getStudentCourseVariants($student);

        foreach ($targetCourses as $target) {
            $targetStr = trim((string) $target);
            if ($targetStr === '' || self::isAllWildcard($targetStr)) {
                return true;
            }

            $targetAcronym = self::generateAcronym($targetStr);
            $targetNormalized = self::normalizeString($targetStr);

            foreach ($studentValues as $sVal) {
                if ($sVal === '') {
                    continue;
                }

                $sAcronym = self::generateAcronym($sVal);
                $sNormalized = self::normalizeString($sVal);

                // 1. Exact or case-insensitive match
                if (strcasecmp($sVal, $targetStr) === 0) {
                    return true;
                }

                // 2. Normalized string exact match
                if ($sNormalized !== '' && $sNormalized === $targetNormalized) {
                    return true;
                }

                // 3. Substring match
                if (stripos($sVal, $targetStr) !== false || stripos($targetStr, $sVal) !== false) {
                    return true;
                }
                if ($sNormalized !== '' && $targetNormalized !== '' && (str_contains($sNormalized, $targetNormalized) || str_contains($targetNormalized, $sNormalized))) {
                    return true;
                }

                // 4. Acronym match (e.g. BSIT vs Bachelor of Science in Information Technology)
                if ($sAcronym !== '' && $targetAcronym !== '' && strcasecmp($sAcronym, $targetAcronym) === 0) {
                    return true;
                }
                if ($sAcronym !== '' && strcasecmp($sAcronym, $targetStr) === 0) {
                    return true;
                }
                if ($targetAcronym !== '' && strcasecmp($sVal, $targetAcronym) === 0) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if a student's year level matches any of the target year levels.
     */
    public static function matchesYearLevel(Student $student, array $targetYearLevels): bool
    {
        $studentValues = [
            trim((string) ($student->year_level ?? '')),
            trim((string) ($student->entry_status ?? '')),
        ];

        // Also extract numerical digit representation for student
        $studentNums = [];
        foreach ($studentValues as $v) {
            $num = self::extractYearNumber($v);
            if ($num !== null) {
                $studentNums[] = $num;
            }
        }

        foreach ($targetYearLevels as $target) {
            $targetStr = trim((string) $target);
            if ($targetStr === '' || self::isAllWildcard($targetStr)) {
                return true;
            }

            $targetNum = self::extractYearNumber($targetStr);

            // 1. Numerical match (e.g., "1" matches "1st Year", "Freshman", "Grade 1")
            if ($targetNum !== null && in_array($targetNum, $studentNums, true)) {
                return true;
            }

            // 2. String comparison
            foreach ($studentValues as $sVal) {
                if ($sVal === '') {
                    continue;
                }

                if (strcasecmp($sVal, $targetStr) === 0) {
                    return true;
                }

                if (stripos($sVal, $targetStr) !== false || stripos($targetStr, $sVal) !== false) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get all possible course / program identifiers for a student.
     *
     * @return array<string>
     */
    private static function getStudentCourseVariants(Student $student): array
    {
        $variants = [];

        $course = trim((string) ($student->course ?? ''));
        if ($course !== '') {
            $variants[] = $course;
        }

        // Program attribute (string) or relation
        try {
            $progAttr = trim((string) ($student->getAttribute('program') ?? ''));
            if ($progAttr !== '') {
                $variants[] = $progAttr;
            }
            if ($student->relationLoaded('program') && $student->program) {
                $pName = trim((string) ($student->program->name ?? ''));
                $pCode = trim((string) ($student->program->code ?? ''));
                if ($pName !== '') $variants[] = $pName;
                if ($pCode !== '') $variants[] = $pCode;
            }
        } catch (\Throwable) {
            // Ignore relation resolution errors
        }

        return array_values(array_unique($variants));
    }

    /**
     * Extract a numeric year level from common phrasing:
     * "1st Year" -> 1, "Freshman" -> 1, "Sophomore" -> 2, "3rd" -> 3, "Grade 11" -> 11, etc.
     */
    public static function extractYearNumber(string $value): ?int
    {
        $lower = strtolower(trim($value));
        if ($lower === '') {
            return null;
        }

        if (preg_match('/\b(freshman|first|1st)\b/i', $lower)) {
            return 1;
        }
        if (preg_match('/\b(sophomore|second|2nd)\b/i', $lower)) {
            return 2;
        }
        if (preg_match('/\b(junior|third|3rd)\b/i', $lower)) {
            return 3;
        }
        if (preg_match('/\b(senior|fourth|4th)\b/i', $lower)) {
            return 4;
        }
        if (preg_match('/\b(fifth|5th)\b/i', $lower)) {
            return 5;
        }

        if (preg_match('/\d+/', $lower, $matches)) {
            return (int) $matches[0];
        }

        return null;
    }

    /**
     * Generate an acronym from a phrase (e.g. "Bachelor of Science in Information Technology" -> "BSIT").
     */
    public static function generateAcronym(string $phrase): string
    {
        $clean = preg_replace('/[^a-zA-Z0-9\s]/', ' ', $phrase);
        $words = preg_split('/\s+/', trim((string) $clean));
        if (! is_array($words) || empty($words)) {
            return '';
        }

        // If it's already an acronym (e.g. "BSIT", "BSBA"), return uppercase
        if (count($words) === 1 && strlen($words[0]) <= 8 && ctype_alnum($words[0])) {
            return strtoupper($words[0]);
        }

        $stopWords = ['in', 'of', 'and', 'the', 'for', 'with', 'to', 'at', 'by', 'on', 'program', 'department', 'major'];
        $acronym = '';

        foreach ($words as $w) {
            $wLower = strtolower($w);
            if (in_array($wLower, $stopWords, true)) {
                continue;
            }
            if ($w !== '') {
                $acronym .= strtoupper($w[0]);
            }
        }

        return $acronym;
    }

    /**
     * Clean and normalize a string for comparison.
     */
    private static function normalizeString(string $val): string
    {
        $val = strtolower(trim($val));
        // Remove "program", "department", punctuation
        $val = preg_replace('/\b(program|department|major|course)\b/i', '', $val);
        $val = preg_replace('/[^a-z0-9]/', '', (string) $val);
        return trim((string) $val);
    }
}
