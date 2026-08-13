<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Violation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'description',
        'section',
    ];

    public static function ensureDefaultViolations()
    {
        if (self::count() === 0) {
            $defaults = [
                ['code' => 'VIO-WAR-001', 'name' => 'Dress Code Violation', 'description' => 'Not wearing proper school uniform or dress code policy.', 'section' => 'Warning'],
                ['code' => 'VIO-WAR-002', 'name' => 'Loitering', 'description' => 'Loitering in university corridors during class hours.', 'section' => 'Warning'],
                ['code' => 'VIO-WAR-003', 'name' => 'Minor Classroom Disruption', 'description' => 'Disrupting class activities or discussions.', 'section' => 'Warning'],
                ['code' => 'VIO-WAR-004', 'name' => 'Improper Waste Disposal', 'description' => 'Littering or improper disposal of trash inside campus premises.', 'section' => 'Warning'],
                
                ['code' => 'VIO-SUS-001', 'name' => 'Smoking inside Campus', 'description' => 'Smoking or vaping inside university premises.', 'section' => 'Suspension'],
                ['code' => 'VIO-SUS-002', 'name' => 'Vandalism', 'description' => 'Writing on university walls, destroying desks, or damaging property.', 'section' => 'Suspension'],
                ['code' => 'VIO-SUS-003', 'name' => 'Public Display of Affection', 'description' => 'Inappropriate public display of affection within campus.', 'section' => 'Suspension'],
                ['code' => 'VIO-SUS-004', 'name' => 'Verbal Abuse / Offensive Language', 'description' => 'Using offensive or verbally abusive language toward others.', 'section' => 'Suspension'],
                
                ['code' => 'VIO-EXC-001', 'name' => 'Cheating during Exam / Academic Dishonesty', 'description' => 'Possessing unauthorized materials or copying answers during examinations.', 'section' => 'Exclusion'],
                ['code' => 'VIO-EXC-002', 'name' => 'Bullying / Cyberbullying', 'description' => 'Harassing, threatening, or bullying students online or offline.', 'section' => 'Exclusion'],
                ['code' => 'VIO-EXC-003', 'name' => 'Physical Altercation / Fighting', 'description' => 'Engaging in physical fights or altercations on campus.', 'section' => 'Exclusion'],
                
                ['code' => 'VIO-EXP-001', 'name' => 'Unauthorized System Access / Data Breach', 'description' => 'Infiltrating university networks or databases without permission.', 'section' => 'Expulsion'],
                ['code' => 'VIO-EXP-002', 'name' => 'Theft / Stealing', 'description' => 'Stealing university or personal properties on campus.', 'section' => 'Expulsion'],
                ['code' => 'VIO-EXP-003', 'name' => 'Possession of Illegal Drugs / Weapons', 'description' => 'Bringing drugs, weapons, or other prohibited items to school.', 'section' => 'Expulsion'],
            ];
            foreach ($defaults as $item) {
                self::create($item);
            }
        }
    }

    public function incidents()
    {
        return $this->hasMany(Incident::class);
    }
}
