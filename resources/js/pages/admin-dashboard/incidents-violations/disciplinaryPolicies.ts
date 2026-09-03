export interface DisciplinaryPolicyItem {
    section: 1 | 2 | 3 | 4;
    title: string;
    category: 'Warning' | 'Suspension' | 'Exclusion' | 'Expulsion';
    shortTitle: string;
    legalBasis: string;
    description: string;
    accumulationRule?: string;
    effects: string[];
    inclusions: string[];
    badgeColor: string;
    accentColor: string;
}

export const DISCIPLINARY_POLICIES: DisciplinaryPolicyItem[] = [
    {
        section: 1,
        title: 'Section 1. Warning',
        category: 'Warning',
        shortTitle: 'Disciplinary Warning',
        legalBasis: 'Manual of Regulations for Private Schools & SRCB Student Handbook',
        description:
            'A formal administrative admonition commensurate to minor infractions of school rules and regulations.',
        accumulationRule:
            'A student may be meted with suspension if s/he incurred three (3) accumulated warnings for the same offense – on the 4th meted with suspension; or four (4) accumulated warnings for various offenses – on the 5th warning meted with suspension. Accumulation of offense starts from 1st year.',
        effects: [
            'Official written warning logged in the student disciplinary record.',
            'Counseling and reprimand with parent/guardian notification.',
            'Accumulates toward suspension threshold starting from 1st year standing.',
        ],
        inclusions: [
            'Visiting places of ill-repute, i.e., nightclubs, gambling joints, cockfighting arenas, etc.',
            'Using the name of the school in printed programs, invitations, tickets and announcements without permission',
            'Engaging in acts of dishonesty, misbehavior, misconduct or misdemeanor other than those mentioned in the preceding sanctions',
            'Tampering notices on Bulletin Boards of the school and/or campus clubs/organizations',
            'Non-payment of debts to fellow students/other persons',
            'Failure to wear the proper school attire / dress code violations',
            'Unauthorized use of school facilities; violating rules governing the correct and proper use of the library, AV room, gymnasium, and other facilities without the proper permit',
            'Misconduct inside the classroom such as shouting, whistling, raucous and unrestrained laughter and loud talking',
            'Disrupting classes by loitering and by creating noise or any disturbance in the corridors, stairways, and immediate vicinities of classrooms during class periods',
            'Committing acts of vandalism or chewing gum vandalism',
            'Use of mobile phones, music players, gaming console and the like outside designated places',
            'Bringing single-use plastics inside the campus or in any off-campus activities',
            'Non-adherence to the prescribed submission policies for the conduct of curricular, co-curricular, and extra-curricular activities',
        ],
        badgeColor:
            'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
        accentColor: 'border-amber-400',
    },
    {
        section: 2,
        title: 'Section 2. Suspension',
        category: 'Suspension',
        shortTitle: 'Suspension from Classes & Campus Entry',
        legalBasis: 'Manual of Regulations for Private Schools & CHED Regulations',
        description:
            'A school may suspend, deny, or deprive an erring student entry in the school campus or attendance in classes for a period not exceeding twenty percent (20%) of prescribed school days for a school year or term. The decision of the school on every case involving the penalty of suspension which exceeds twenty percent (20%) shall be forwarded to the Commission on Higher Education (CHED)-Regional Office (RO) within ten (10) days from termination of investigation.',
        accumulationRule:
            'Triggered upon: (a) Three (3) accumulated warnings for the same offense – on the 4th meted with suspension; (b) Four (4) accumulated warnings for various offenses – on the 5th warning meted with suspension; or (c) Direct commission of designated Section 2 offenses. If a student is suspended for the second time, her/his violation may lead to exclusion.',
        effects: [
            'Denial of campus entry and deprivation of class attendance (up to 20% of term days).',
            'No transfer credentials shall be issued to a suspended student until such suspension shall have expired.',
            'Allowed to re-enroll only upon execution of a formal promissory note to live an "exemplary conduct".',
            'Second suspension offense leads to recommendation for Exclusion.',
            'Cases exceeding 20% of term days forwarded to CHED-RO within 10 days.',
        ],
        inclusions: [
            'Three (3) accumulated warnings for the same offense – on the 4th meted with suspension',
            'Four (4) accumulated warnings for various offenses – on the 5th warning meted with suspension',
            'Lending one’s ID to another and the willful possession of two or more ID’s',
            'Extortion, e.g., collecting money from students in and outside campus without permission; Using bribery in the form of money to gain favor from school personnel or faculty',
            'Causing public and campus disturbances, e.g., causing panic, confusion, harassment, throwing objects in a gathering, disrupting authorized practices, performances, symposia, lectures',
            'Publishing or circulating false information or posting malicious remarks in social networks about the School, its officials, personnel, and students',
            'Taking part in brawls inside and outside the campus',
            'Smoking/Vaping within school premises, within 100 meters from school, in uniform, or while attending school-related activities (paraphernalia confiscated)',
            'Behavior unbecoming of a SRCBian, i.e., arrogance, promiscuity, public scandal, and immorality',
            'Threatening and/or preventing any student, teacher, or personnel from entering school premises or attending classes',
            'Refusing or failure to appear without valid reason before a school official and/or duly constituted body when summoned',
            'Insubordination to institutional authorities',
            'Fraternity and/or Sorority participation: Formation, membership, initiation rites, or participation in terrorist-associated groups',
            'Usurpation (to take or exercise authority or possession wrongfully)',
            'Playing or bringing gambling paraphernalia inside the campus or off-campus school activities',
            'Computer security breach / unauthorized access: Altering, damaging or destroying information, changing passwords, modifying PC configurations, introducing viruses, hacking/cracking, piloting accounts, or violating the Data Privacy Policy',
            'Academic dishonesty in the form of plagiarism: Deliberate, conscious effort to steal another’s original work and pass it off as one’s own',
        ],
        badgeColor:
            'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/50',
        accentColor: 'border-orange-500',
    },
    {
        section: 3,
        title: 'Section 3. Exclusion',
        category: 'Exclusion',
        shortTitle: 'Exclusion / Dropping from Rolls',
        legalBasis: 'Manual of Regulations for Private Schools & Board of Trustees Policies',
        description:
            'A school may exclude, drop or dismiss from its rolls a student for a semester, two semesters or both, for a summer, or for the whole school year.',
        accumulationRule:
            'May be recommended following a second suspension or direct commission of severe moral, integrity, property, or life-threatening violations.',
        effects: [
            'Immediate dismissal/dropping from the institutional rolls for 1-2 semesters, summer, or entire school year.',
            'Re-enrollment permitted only after serving the complete term of exclusion.',
            'Mandatory execution of a formal promissory note to live an "exemplary conduct" upon re-admission.',
            'Formal notification to CHED and parent/guardian.',
        ],
        inclusions: [
            'Pregnancy without the benefit of marriage (for women) and/or impregnating a SRCBian or non-SRCBian (for men)',
            'Stealing school property vital to operations or valuables of students, teachers, and personnel',
            'Possessing, accessing, and downloading pornographic literature on the internet',
            'Forgery and/or tampering of official school records; securing or using forged/faked school records, terms, documents, or misrepresentation of facts',
            'Physically assaulting personnel or students in and outside the campus',
            'Giving slanderous/defamatory statements to personnel or students causing injury to person and dishonor (verbal, written, or published in any platform)',
            'Strikes or demonstrations resulting in damage to school properties',
            'Instigating or engaging in activities resulting in damage of property vital to school operations',
            'Actions contrary to morals inside and outside campus, especially in uniform (petting, necking, orgies, sexual acts offensive to public laws and Catholic morality)',
            'Indulging in drugs – using or possessing narcotics and prohibited drugs (marijuana, methamphetamine hydrochloride/shabu, prohibited cough syrup, hallucinogens)',
            'Misappropriation of funds of student organizations or programs without satisfactory explanation',
            'Gambling in any form (digital or physical) inside or outside the campus (playing games for money)',
            'Drunkenness and/or possession of liquor: Entering campus under the influence or bringing liquor inside campus or school-related activities',
        ],
        badgeColor:
            'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50',
        accentColor: 'border-rose-500',
    },
    {
        section: 4,
        title: 'Section 4. Expulsion',
        category: 'Expulsion',
        shortTitle: 'Expulsion (National Debarment)',
        legalBasis: 'Manual of Regulations for Private Schools & CHED Approval Requirement',
        description:
            'The penalty of expulsion is an extreme form of administrative sanction, which debars the student from public and private schools in the Philippines. To be valid and effective, the penalty of expulsion requires the approval of the Commission on Higher Education (CHED).',
        accumulationRule:
            'Reserved strictly for heinous, criminal, or gravely unlawful acts endangering life, public safety, or institutional existence.',
        effects: [
            'Total and permanent debarment from ALL public and private schools in the Republic of the Philippines.',
            'Requires formal investigation termination and mandatory approval from the Commission on Higher Education (CHED) to take legal effect.',
            'Permanent disciplinary forfeiture and forfeiture of admission privileges.',
        ],
        inclusions: [
            'Killing a person within the school campus (except for self-defense)',
            'Hazing / initiation rites resulting in serious physical injury or death (inside or outside campus)',
            'Trafficking "mind-altering" drugs within the school campus',
            'Direct injury to the life of any personnel or student (stabbing, shooting, mauling)',
            'Participating in strikes or demonstrations resulting in any injury to life',
            'Hooliganism (disruptive, violent, and unlawful behavior)',
            'Immorality or actions resulting in public scandal, e.g., prostitution, adultery, etc.',
            'Rape / attempted rape',
            'Sexual harassment',
            'Voluntary abortion',
        ],
        badgeColor:
            'bg-red-100 text-red-900 border-red-300 dark:bg-red-950/60 dark:text-red-200 dark:border-red-900',
        accentColor: 'border-red-600',
    },
];

/**
 * Helper to match an incident or violation to its official Section in the Manual of Regulations for Private Schools
 */
export function getApplicablePolicy(
    incidentType: string = '',
    classification: string = '',
    recommendedAction?: string,
): DisciplinaryPolicyItem {
    const text = incidentType.toLowerCase();

    // Direct match if recommended action is specified
    if (recommendedAction) {
        const direct = DISCIPLINARY_POLICIES.find(
            (p) => p.category.toLowerCase() === recommendedAction.toLowerCase(),
        );
        if (direct) return direct;
    }

    // Check Expulsion keywords (Section 4)
    if (
        text.includes('kill') ||
        text.includes('hazing') ||
        text.includes('traffic') ||
        text.includes('stabbing') ||
        text.includes('shooting') ||
        text.includes('mauling') ||
        text.includes('rape') ||
        text.includes('abortion') ||
        text.includes('sexual harassment') ||
        text.includes('expul')
    ) {
        return DISCIPLINARY_POLICIES[3]; // Section 4
    }

    // Check Exclusion keywords (Section 3)
    if (
        text.includes('drug') ||
        text.includes('shabu') ||
        text.includes('marijuana') ||
        text.includes('liquor') ||
        text.includes('drunk') ||
        text.includes('pregnant') ||
        text.includes('steal') ||
        text.includes('theft') ||
        text.includes('pornograph') ||
        text.includes('forgery') ||
        text.includes('assault') ||
        text.includes('slander') ||
        text.includes('defamat') ||
        text.includes('misappropriat') ||
        text.includes('exclu')
    ) {
        return DISCIPLINARY_POLICIES[2]; // Section 3
    }

    // Check Suspension keywords (Section 2)
    if (
        text.includes('smoke') ||
        text.includes('vape') ||
        text.includes('brawl') ||
        text.includes('fight') ||
        text.includes('extortion') ||
        text.includes('bribery') ||
        text.includes('disturbance') ||
        text.includes('panic') ||
        text.includes('social network') ||
        text.includes('threat') ||
        text.includes('insubordination') ||
        text.includes('fraternity') ||
        text.includes('sorority') ||
        text.includes('gambling') ||
        text.includes('hack') ||
        text.includes('breach') ||
        text.includes('security') ||
        text.includes('plagiarism') ||
        text.includes('cheat') ||
        classification.toLowerCase() === 'major'
    ) {
        return DISCIPLINARY_POLICIES[1]; // Section 2
    }

    // Default to Section 1: Warning
    return DISCIPLINARY_POLICIES[0]; // Section 1
}
