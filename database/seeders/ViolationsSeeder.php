<?php

namespace Database\Seeders;

use App\Models\DisciplinaryRule;
use App\Models\Violation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ViolationsSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate to ensure a clean slate and avoid duplicate keys if we changed IDs
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Violation::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $violations = [
            // Section 1: Warning Infractions
            ['code' => 'V001', 'section' => 'Warning', 'name' => 'Visiting places of ill-repute (nightclubs, gambling joints, cockfighting arenas, etc.)'],
            ['code' => 'V002', 'section' => 'Warning', 'name' => 'Using the school\'s name in printed materials without permission.'],
            ['code' => 'V003', 'section' => 'Warning', 'name' => 'Acts of dishonesty, misbehavior, misconduct, or misdemeanor not covered by higher sanctions.'],
            ['code' => 'V004', 'section' => 'Warning', 'name' => 'Tampering with bulletin board notices.'],
            ['code' => 'V005', 'section' => 'Warning', 'name' => 'Non-payment of debts to fellow students or other persons.'],
            ['code' => 'V006', 'section' => 'Warning', 'name' => 'Failure to wear the proper school attire.'],
            ['code' => 'V007', 'section' => 'Warning', 'name' => 'Unauthorized use of school facilities.'],
            ['code' => 'V008', 'section' => 'Warning', 'name' => 'Violating rules on the use of the library, AV room, gymnasium, and other facilities.'],
            ['code' => 'V009', 'section' => 'Warning', 'name' => 'Classroom misconduct (shouting, whistling, loud talking, disruptive laughter).'],
            ['code' => 'V010', 'section' => 'Warning', 'name' => 'Loitering or creating disturbances near classrooms during class hours.'],
            ['code' => 'V011', 'section' => 'Warning', 'name' => 'Acts of vandalism, including chewing gum vandalism.'],
            ['code' => 'V012', 'section' => 'Warning', 'name' => 'Using mobile phones, music players, gaming consoles, and similar devices outside designated areas.'],
            ['code' => 'V013', 'section' => 'Warning', 'name' => 'Bringing single-use plastics into campus or school activities.'],
            ['code' => 'V014', 'section' => 'Warning', 'name' => 'Failure to follow prescribed submission policies for curricular, co-curricular, and extracurricular activities.'],
            ['code' => 'V015', 'section' => 'Warning', 'name' => 'Fourth warning for the same offense (after three accumulated warnings).'],
            ['code' => 'V016', 'section' => 'Warning', 'name' => 'Fifth accumulated warning for different offenses (after four accumulated warnings).'],

            // Section 2: Suspension Infractions
            ['code' => 'V017', 'section' => 'Suspension', 'name' => 'Fourth warning for the same offense.'],
            ['code' => 'V018', 'section' => 'Suspension', 'name' => 'Fifth accumulated warning for different offenses.'],
            ['code' => 'V019', 'section' => 'Suspension', 'name' => 'Lending one\'s ID to another person.'],
            ['code' => 'V020', 'section' => 'Suspension', 'name' => 'Possession of two or more IDs.'],
            ['code' => 'V021', 'section' => 'Suspension', 'name' => 'Extortion or unauthorized collection of money.'],
            ['code' => 'V022', 'section' => 'Suspension', 'name' => 'Bribery involving school personnel or faculty.'],
            ['code' => 'V023', 'section' => 'Suspension', 'name' => 'Causing public or campus disturbances.'],
            ['code' => 'V024', 'section' => 'Suspension', 'name' => 'Publishing or circulating false information about the school.'],
            ['code' => 'V025', 'section' => 'Suspension', 'name' => 'Posting malicious remarks on social media about the school, officials, personnel, or students.'],
            ['code' => 'V026', 'section' => 'Suspension', 'name' => 'Participating in brawls inside or outside the campus.'],
            ['code' => 'V027', 'section' => 'Suspension', 'name' => 'Smoking or vaping (Within school premises, Within 100 meters, While in uniform, During school activities).'],
            ['code' => 'V028', 'section' => 'Suspension', 'name' => 'Behavior unbecoming of an SRCBian (arrogance, promiscuity, public scandal, immorality).'],
            ['code' => 'V029', 'section' => 'Suspension', 'name' => 'Threatening or preventing students, faculty, or personnel from entering school or attending classes.'],
            ['code' => 'V030', 'section' => 'Suspension', 'name' => 'Refusing or failing to appear before school authorities without valid reason.'],
            ['code' => 'V031', 'section' => 'Suspension', 'name' => 'Insubordination.'],
            ['code' => 'V032', 'section' => 'Suspension', 'name' => 'Formation or membership in fraternities or sororities.'],
            ['code' => 'V033', 'section' => 'Suspension', 'name' => 'Participation in fraternity/sorority initiation rites.'],
            ['code' => 'V034', 'section' => 'Suspension', 'name' => 'Participation in terrorist-associated groups or organizations.'],
            ['code' => 'V035', 'section' => 'Suspension', 'name' => 'Usurpation (wrongfully exercising authority or possession).'],
            ['code' => 'V036', 'section' => 'Suspension', 'name' => 'Bringing or playing gambling paraphernalia on campus or during school activities.'],
            ['code' => 'V037', 'section' => 'Suspension', 'name' => 'Unauthorized access to school computers or networks.'],
            ['code' => 'V038', 'section' => 'Suspension', 'name' => 'Altering information or passwords without authorization.'],
            ['code' => 'V039', 'section' => 'Suspension', 'name' => 'Damaging or destroying digital information.'],
            ['code' => 'V040', 'section' => 'Suspension', 'name' => 'Introducing false information into school systems.'],
            ['code' => 'V041', 'section' => 'Suspension', 'name' => 'Preventing authorized use of information.'],
            ['code' => 'V042', 'section' => 'Suspension', 'name' => 'Disrupting computer or network operations.'],
            ['code' => 'V043', 'section' => 'Suspension', 'name' => 'Hacking or cracking school systems.'],
            ['code' => 'V044', 'section' => 'Suspension', 'name' => 'Sharing school-issued accounts with unauthorized persons (piloting accounts).'],
            ['code' => 'V045', 'section' => 'Suspension', 'name' => 'Violating the school\'s Data Privacy Policy.'],
            ['code' => 'V046', 'section' => 'Suspension', 'name' => 'Academic dishonesty through plagiarism.'],

            // Section 3: Exclusion Infractions
            ['code' => 'V047', 'section' => 'Exclusion', 'name' => 'Pregnancy without marriage (female students).'],
            ['code' => 'V048', 'section' => 'Exclusion', 'name' => 'Impregnating an SRCBian or non-SRCBian (male students).'],
            ['code' => 'V049', 'section' => 'Exclusion', 'name' => 'Stealing vital school property or valuables belonging to students or personnel.'],
            ['code' => 'V050', 'section' => 'Exclusion', 'name' => 'Possessing, accessing, or downloading pornographic materials.'],
            ['code' => 'V051', 'section' => 'Exclusion', 'name' => 'Forgery or tampering of official school records.'],
            ['code' => 'V052', 'section' => 'Exclusion', 'name' => 'Using forged or fake school records.'],
            ['code' => 'V053', 'section' => 'Exclusion', 'name' => 'Tampering with official documents.'],
            ['code' => 'V054', 'section' => 'Exclusion', 'name' => 'Misrepresentation of facts.'],
            ['code' => 'V055', 'section' => 'Exclusion', 'name' => 'Physical assault against personnel or students.'],
            ['code' => 'V056', 'section' => 'Exclusion', 'name' => 'Making slanderous or defamatory statements causing injury to another\'s reputation.'],
            ['code' => 'V057', 'section' => 'Exclusion', 'name' => 'Strikes or demonstrations resulting in damage to school property.'],
            ['code' => 'V058', 'section' => 'Exclusion', 'name' => 'Instigating or participating in activities causing damage to school property.'],
            ['code' => 'V059', 'section' => 'Exclusion', 'name' => 'Acts contrary to morals (petting, necking, orgies, sexual acts, indecent acts, especially while in uniform).'],
            ['code' => 'V060', 'section' => 'Exclusion', 'name' => 'Use or possession of illegal drugs or prohibited substances.'],
            ['code' => 'V061', 'section' => 'Exclusion', 'name' => 'Misappropriation of student organization or program funds.'],
            ['code' => 'V062', 'section' => 'Exclusion', 'name' => 'Gambling for money (digital or physical).'],
            ['code' => 'V063', 'section' => 'Exclusion', 'name' => 'Drunkenness on campus.'],
            ['code' => 'V064', 'section' => 'Exclusion', 'name' => 'Possession of liquor on campus or during school activities.'],

            // Section 4: Expulsion Infractions
            ['code' => 'V065', 'section' => 'Expulsion', 'name' => 'Killing a person on campus (except in self-defense).'],
            ['code' => 'V066', 'section' => 'Expulsion', 'name' => 'Hazing or initiation rites causing serious injury or death.'],
            ['code' => 'V067', 'section' => 'Expulsion', 'name' => 'Trafficking mind-altering drugs within the campus.'],
            ['code' => 'V068', 'section' => 'Expulsion', 'name' => 'Attempting to take the life of personnel or students (stabbing, shooting, mauling).'],
            ['code' => 'V069', 'section' => 'Expulsion', 'name' => 'Participating in strikes or demonstrations resulting in injury or death.'],
            ['code' => 'V070', 'section' => 'Expulsion', 'name' => 'Hooliganism (disruptive and unlawful behavior).'],
            ['code' => 'V071', 'section' => 'Expulsion', 'name' => 'Immorality resulting in public scandal (e.g., prostitution, adultery).'],
            ['code' => 'V072', 'section' => 'Expulsion', 'name' => 'Rape or attempted rape.'],
            ['code' => 'V073', 'section' => 'Expulsion', 'name' => 'Sexual harassment.'],
            ['code' => 'V074', 'section' => 'Expulsion', 'name' => 'Voluntary abortion.'],
        ];

        foreach ($violations as $v) {
            $v['description'] = $v['name']; // Fallback for description if needed
            Violation::create($v);
        }

        // Recreate essential rules
        DisciplinaryRule::truncate();
        $rules = [
            [
                'name' => '3 Same Offense Warnings → Suspension',
                'description' => 'Three warnings for same offense lead to suspension',
                'trigger_section' => 'Warning',
                'conditions' => ['same_offense_count' => 3],
                'result_action' => 'Suspension',
                'priority' => 10,
            ],
            [
                'name' => '4 Total Warnings → Suspension',
                'description' => 'Four accumulated warnings lead to suspension',
                'trigger_section' => 'Warning',
                'conditions' => ['total_warnings' => 4],
                'result_action' => 'Suspension',
                'priority' => 5,
            ],
            [
                'name' => 'Second Suspension → Exclusion',
                'description' => 'Second suspension may lead to exclusion',
                'trigger_section' => 'Suspension',
                'conditions' => ['suspension_count' => 1],
                'result_action' => 'Exclusion',
                'priority' => 10,
            ],
        ];

        foreach ($rules as $rule) {
            DisciplinaryRule::create($rule);
        }
    }
}
