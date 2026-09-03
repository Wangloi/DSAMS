import { usePage } from '@inertiajs/react';
import {
    Check,
    Compass,
    Copy,
    Crosshair,
    LocateFixed,
    MapPin,
    Maximize2,
    Minimize2,
    RefreshCcw,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import LeafletMapSelector from '@/components/LeafletMapSelector';

interface Location {
    latitude: number;
    longitude: number;
    name?: string;
    id?: string;
}

interface SchoolMapSelectorProps {
    onLocationSelect: (lat: number, lng: number, name?: string) => void;
    initialLocation?: Location;
    className?: string;
}

/** Rough estimate for pick-coords preview only — not used for geofence validation */
function estimateLatLngFromMapPoint(
    x: number,
    y: number,
    campus: { lat: number; lng: number },
): { lat: number; lng: number } {
    return {
        lat: campus.lat + (50 - y) * 0.0001,
        lng: campus.lng + (x - 50) * 0.0001,
    };
}

export function SchoolMapSelector({
    onLocationSelect,
    initialLocation,
    className = '',
}: SchoolMapSelectorProps) {
    const page = usePage();
    const campusFromConfig = (
        page.props as {
            geofence?: { campus?: { latitude?: number; longitude?: number } };
        }
    ).geofence?.campus;
    const campusCenter = {
        lat:
            typeof campusFromConfig?.latitude === 'number'
                ? campusFromConfig.latitude
                : 8.74307,
        lng:
            typeof campusFromConfig?.longitude === 'number'
                ? campusFromConfig.longitude
                : 124.7745,
    };
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(
        initialLocation || null,
    );
    const [selectedMapPoint, setSelectedMapPoint] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [isPlacingMarker, setIsPlacingMarker] = useState(false);
    const [isPickingCoords, setIsPickingCoords] = useState(false);
    const [lastPickedCoords, setLastPickedCoords] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [copyHint, setCopyHint] = useState<string | null>(null);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const [mapPinOnly, setMapPinOnly] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [mapMode, setMapMode] = useState<'leaflet' | 'blueprint'>('leaflet');
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
    const panMovedRef = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const mapGroupRef = useRef<SVGGElement>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    // Predefined pins: x and y are in the same 0–100 space as viewBox="0 0 100 100" (horizontal x, vertical y; origin top-left).
    // Edit x/y until each marker sits on the map image; set lat/lng to the real GPS at that spot for geofence checks.
    const schoolLocations = [
        {
            id: 'full_campus',
            name: "St. Rita's College of Balingasag (Full Campus)",
            x: 50,
            y: 50,
            lat: 8.74307,
            lng: 124.7745,
        },
        {
            id: 'main_gate',
            name: 'Main Gate',
            x: 55,
            y: 85,
            lat: 8.74275,
            lng: 124.77445,
        },
        {
            id: 'cafeteria',
            name: 'Cafeteria',
            x: 15,
            y: 25,
            lat: 8.74316,
            lng: 124.77436,
        },
        {
            id: 'gymnasium',
            name: 'Gymnasium',
            x: 25,
            y: 69,
            lat: 8.7428,
            lng: 124.7742,
        },
        {
            id: 'rvm_ttp_program_office',
            name: 'RVM TTP Program Office',
            x: 15,
            y: 46,
            lat: 8.74389,
            lng: 124.77425,
        },
        {
            id: 'power_house',
            name: 'Power House',
            x: 111,
            y: 67,
            lat: 8.74305,
            lng: 124.7745,
        },
        {
            id: 'parking_area',
            name: 'Parking Area',
            x: 111,
            y: 85,
            lat: 8.7427,
            lng: 124.7744,
        },
        {
            id: 'outer_ground',
            name: 'Outer Ground',
            x: 65,
            y: 60,
            lat: 8.74299,
            lng: 124.77439,
        },
        {
            id: 'inner_ground',
            name: 'Inner Ground',
            x: 58,
            y: 28,
            lat: 8.74317,
            lng: 124.77437,
        },
        {
            id: 'parents_lounge',
            name: 'Parents Lounge',
            x: 38,
            y: 88,
            lat: 8.74313,
            lng: 124.77718,
        },
        // MOTHER IGNACIA BUILDING
        {
            id: 'christian_formation_office_1st_floor',
            name: 'Christian Formation Office (1st floor)',
            building: 'MOTHER IGNACIA BUILDING',
            x: 109,
            y: 46,
            lat: 8.7432,
            lng: 124.77428,
        },
        {
            id: 'chapel_1st_floor',
            name: 'Chapel (1st floor)',
            building: 'MOTHER IGNACIA BUILDING',
            x: 110,
            y: 43,
            lat: 8.74322,
            lng: 124.77429,
        },
        {
            id: 'room_101_1st_floor',
            name: 'Room 101 (1st floor)',
            building: 'MOTHER IGNACIA BUILDING',
            x: 110,
            y: 40,
            lat: 8.74324,
            lng: 124.7743,
        },
        {
            id: 'hm_laboratory_1st_floor',
            name: 'HM Laboratory (1st floor)',
            building: 'MOTHER IGNACIA BUILDING',
            x: 109,
            y: 20,
            lat: 8.74315,
            lng: 124.77419,
        },

        {
            id: 'college_library_2nd_floor',
            name: 'College Library (2nd Floor)',
            building: 'MOTHER IGNACIA BUILDING',
            x: 111,
            y: 36,
            lat: 8.74326,
            lng: 124.7743,
        },
        {
            id: 'dean_of_college_2nd_floor',
            name: 'Dean of College (2nd Floor)',
            building: 'MOTHER IGNACIA BUILDING',
            x: 111,
            y: 16,
            lat: 8.74328,
            lng: 124.77431,
        },
        {
            id: 'college_faculty_room_2nd_floor',
            name: 'College Faculty Room (2nd Floor)',
            building: 'MOTHER IGNACIA BUILDING',
            x: 111,
            y: 13,
            lat: 8.7433,
            lng: 124.77431,
        },
        {
            id: 'program_head_s_office_2nd_floor',
            name: "Program Head's Office (2nd Floor)",
            building: 'MOTHER IGNACIA BUILDING',
            x: 111,
            y: 8,
            lat: 8.74332,
            lng: 124.77432,
        },

        {
            id: 'it_laboratory_3rd_floor',
            name: 'IT LABORATORY (3rd floor)',
            building: 'MOTHER IGNACIA BUILDING',
            x: 113,
            y: 39,
            lat: 8.74334,
            lng: 124.77432,
        },
        {
            id: 'room_301_3rd_floor',
            name: 'Room 301 (3rd floor)',
            building: 'MOTHER IGNACIA BUILDING',
            x: 113,
            y: 8,
            lat: 8.74336,
            lng: 124.77433,
        },
        {
            id: 'room_302_3rd_floor',
            name: 'Room 302 (3rd floor)',
            building: 'MOTHER IGNACIA BUILDING',
            x: 113,
            y: 13,
            lat: 8.74338,
            lng: 124.77433,
        },
        {
            id: 'room_303_3rd_floor',
            name: 'Room 303 (3rd floor)',
            building: 'MOTHER IGNACIA BUILDING',
            x: 113,
            y: 16,
            lat: 8.7434,
            lng: 124.77434,
        },

        {
            id: 'crimlab_4th_floor',
            name: 'CRIM LAB (4th floor)',
            building: 'MOTHER IGNACIA BUILDING',
            x: 115,
            y: 39,
            lat: 8.74342,
            lng: 124.77434,
        },
        {
            id: '401_room_4th_floor',
            name: '401 Room (4th floor)',
            building: 'MOTHER IGNACIA BUILDING',
            x: 115,
            y: 8,
            lat: 8.74344,
            lng: 124.77435,
        },
        {
            id: '402_room_4th_floor',
            name: '402 Room (4th floor)',
            building: 'MOTHER IGNACIA BUILDING',
            x: 115,
            y: 13,
            lat: 8.74346,
            lng: 124.77435,
        },
        {
            id: '403_room_4th_floor',
            name: '403 Room (4th floor)',
            building: 'MOTHER IGNACIA BUILDING',
            x: 115,
            y: 16,
            lat: 8.74348,
            lng: 124.77436,
        },

        // ST. RITA BUILDING

        {
            id: 'grade_9_our_lady_of_holy_rosary_4th_floor',
            name: 'Grade 9 - Our Lady of Holy Rosary (4th Floor)',
            building: 'ST. RITA BUILDING',
            x: 95,
            y: 34,
            lat: 8.74294,
            lng: 124.77471,
        },
        {
            id: 'grade_9_our_lady_of_mt_carmel_4th_floor',
            name: 'Grade 9 - Our Lady of Mt. Carmel (4th Floor)',
            building: 'ST. RITA BUILDING',
            x: 88,
            y: 34,
            lat: 8.74298,
            lng: 124.77469,
        },
        {
            id: 'grade_10_mary_mediatrix_of_all_graces_4th_floor',
            name: 'Grade 10 - Mary Mediatrix of all graces (4th Floor)',
            building: 'ST. RITA BUILDING',
            x: 78,
            y: 34,
            lat: 8.74294,
            lng: 124.77467,
        },
        {
            id: 'paascu_exhibit_4th_floor',
            name: 'PAASCU EXHIBIT (4th Floor)',
            building: 'ST. RITA BUILDING',
            x: 50,
            y: 34,
            lat: 8.74284,
            lng: 124.77451,
        },
        {
            id: 'grade_10_queenship_of_Mary _4th_floor',
            name: 'Grade 10 - Queenship of Mary (4th Floor)',
            building: 'ST. RITA BUILDING',
            x: 45,
            y: 34,
            lat: 8.74283,
            lng: 124.77437,
        },
        {
            id: 'grade_10_our_lady_of_presentation_4th_floor',
            name: 'Our Lady of Presentation (4th Floor)',
            building: 'ST. RITA BUILDING',
            x: 40,
            y: 34,
            lat: 8.74283,
            lng: 124.77431,
        },
        {
            id: 'room_no_403_gen_science_laboratory _4th_floor',
            name: 'Room No. 403 - Gen. Science Laboratory (4th Floor)',
            building: 'ST. RITA BUILDING',
            x: 35,
            y: 34,
            lat: 8.74275,
            lng: 124.77428,
        },
        {
            id: 'room_no_402_physics_&_chemistry_laboratory',
            name: 'Room No. 402 - Physics & Chemistry Laboratory (4th Floor)',
            building: 'ST. RITA BUILDING',
            x: 30,
            y: 34,
            lat: 8.74254,
            lng: 124.77453,
        },
        {
            id: 'grade_10_nativity of_our_lady_4th_floor',
            name: 'Nativity of Our Lady (4th Floor)',
            building: 'ST. RITA BUILDING',
            x: 19,
            y: 34,
            lat: 8.7425,
            lng: 124.77441,
        },

        {
            id: 'gened_computer_laboratory_3rd_floor',
            name: 'GenEd Computer Laboratory (3rd Floor)',
            building: 'ST. RITA BUILDING',
            x: 99,
            y: 37,
            lat: 8.74282,
            lng: 124.7754,
        },
        {
            id: 'grade_9_our_lady_of_beaterio_3rd_floor',
            name: 'Grade 9 - Our Lady of Beaterio (3rd Floor)',
            building: 'ST. RITA BUILDING',
            x: 90,
            y: 37,
            lat: 8.74338,
            lng: 124.77546,
        },
        {
            id: 'grade_9_our_lady_of_visitation_3rd_floor',
            name: 'Grade 9 - Our Lady of Visitation (3rd Floor)',
            building: 'ST. RITA BUILDING',
            x: 85,
            y: 37,
            lat: 8.7429,
            lng: 124.77526,
        },
        {
            id: 'grade_8_our_lady_of_loretto_3rd_floor',
            name: 'Grade 8 - Our Lady of Loretto (3rd Floor)',
            building: 'ST. RITA BUILDING',
            x: 79,
            y: 37,
            lat: 8.74268,
            lng: 124.77494,
        },
        {
            id: 'grade_8_our_lady_of_perpetual_help_3rd_floor',
            name: 'Grade 8 - Our Lady of Perpetual Help (3rd Floor)',
            building: 'ST. RITA BUILDING',
            x: 48,
            y: 37,
            lat: 8.74262,
            lng: 124.77492,
        },
        {
            id: 'grade_8_our_lady_of_lourdes_3rd_floor',
            name: 'Grade 8 - Our Lady of Lourdes (3rd Floor)',
            building: 'ST. RITA BUILDING',
            x: 42,
            y: 37,
            lat: 8.74272,
            lng: 124.77469,
        },
        {
            id: 'grade_8_our_lady_of_pillar_3rd_floor',
            name: 'Grade 8 - Our Lady of Pillar (3rd Floor)',
            building: 'ST. RITA BUILDING',
            x: 38,
            y: 37,
            lat: 8.74274,
            lng: 124.77448,
        },
        {
            id: 'grade_7_our_lady_of_annunciation_3rd_floor',
            name: 'Grade 8 - Our Lady of  Annunciation (3rd Floor)',
            building: 'ST. RITA BUILDING',
            x: 33,
            y: 37,
            lat: 8.74273,
            lng: 124.77441,
        },
        {
            id: 'grade_7_our_lady_of_assumption_3rd_floor',
            name: 'Grade 8 - Our Lady of  Assumption (3rd Floor)',
            building: 'ST. RITA BUILDING',
            x: 19,
            y: 37,
            lat: 8.74264,
            lng: 124.77436,
        },

        {
            id: 'room_no_206_library_2nd_floor',
            name: 'Room No. 206 - Library (2nd Floor)',
            building: 'ST. RITA BUILDING',
            x: 85,
            y: 40,
            lat: 8.74248,
            lng: 124.77467,
        },
        {
            id: 'room_no_205_speech_laboratory_2nd_floor',
            name: 'Room No. 205 - Speech Laboratory (2nd Floor)',
            building: 'ST. RITA BUILDING',
            x: 50,
            y: 40,
            lat: 8.74246,
            lng: 124.77463,
        },
        {
            id: 'room_no_204_audio_visual_room_2nd_floor',
            name: 'Room No. 204 - Audio - Visual Room (2nd Floor)',
            building: 'ST. RITA BUILDING',
            x: 45,
            y: 40,
            lat: 8.74258,
            lng: 124.77448,
        },
        {
            id: 'grade_7_our_lady_of_guadalupe_2nd_floor',
            name: 'Grade 7 - Our Lady of Guadalupe (2nd Floor)',
            building: 'ST. RITA BUILDING',
            x: 30,
            y: 40,
            lat: 8.74252,
            lng: 124.7746,
        },
        {
            id: 'grade_7_our_lady_of_hope_2nd_floor',
            name: 'Grade 7 - Our Lady of Hope (2nd Floor)',
            building: 'ST. RITA BUILDING',
            x: 25,
            y: 40,
            lat: 8.74254,
            lng: 124.77436,
        },
        {
            id: 'room_no_201_gradeschool_Computer Laboratory_2nd_floor',
            name: 'Room No. 201 Gradeschool - Computer Laboratory(2nd Floor)',
            building: 'ST. RITA BUILDING',
            x: 19,
            y: 40,
            lat: 8.74242,
            lng: 124.77453,
        },

        {
            id: 'dean_of_students_affairs_1st_floor',
            name: 'Dean of Students Affairs (1st Floor)',
            building: 'ST. RITA BUILDING',
            x: 106,
            y: 43,
            lat: 8.74248,
            lng: 124.77467,
        },
        {
            id: 'president_s_office_1st_floor',
            name: "President's Office (1st Floor)",
            building: 'ST. RITA BUILDING',
            x: 99,
            y: 45,
            lat: 8.74248,
            lng: 124.77467,
        },
        {
            id: 'registrar_1st_floor',
            name: 'Registrar (1st Floor)',
            building: 'ST. RITA BUILDING',
            x: 85,
            y: 45,
            lat: 8.74309,
            lng: 124.7742,
        },
        {
            id: 'finance_cashier_1st_floor',
            name: 'Finance - Cashier (1st Floor)',
            building: 'ST. RITA BUILDING',
            x: 75,
            y: 45,
            lat: 8.74316,
            lng: 124.77476,
        },
        {
            id: 'room_no_103_school_clinic_1st_floor',
            name: 'Room No. 103 - School Clinic (1st Floor)',
            building: 'ST. RITA BUILDING',
            x: 35,
            y: 45,
            lat: 8.74324,
            lng: 124.77436,
        },
        {
            id: 'room_no_102_guidance_Office ',
            name: 'Room No. 102 - Guidance Office (1st Floor)',
            building: 'ST. RITA BUILDING',
            x: 25,
            y: 45,
            lat: 8.74386,
            lng: 124.77415,
        },

        // STO. BUILDING
        {
            id: 'business_manager_s_office_vpaa_office_quality_assurance_office_1st_floor',
            name: "(BUSINESS MANAGER'S OFFICE) & VPAA OFFICE (Quality Assurance Office) (1st Floor)",
            building: 'STO. BUILDING',
            x: 36,
            y: 21,
            lat: 8.74334,
            lng: 124.77395,
        },
        {
            id: 'room_101_grade_3_st_gabriel_1st_floor',
            name: 'Room 101 Grade 3 (ST. GABRIEL) (1st Floor)',
            building: 'STO. BUILDING',
            x: 42,
            y: 21,
            lat: 8.74378,
            lng: 124.77393,
        },
        {
            id: 'room_102_grade_2_st_michael_1st_floor',
            name: 'Room 102 Grade 2 (ST.MICHAEL) (1st Floor)',
            building: 'STO. BUILDING',
            x: 50,
            y: 21,
            lat: 8.74361,
            lng: 124.7741,
        },
        {
            id: 'ict_office_1st_floor',
            name: 'ICT OFFICE (1st Floor)',
            building: 'STO. BUILDING',
            x: 60,
            y: 21,
            lat: 8.74361,
            lng: 124.7741,
        },
        {
            id: 'room_103_st_raphael_1st_floor',
            name: 'Room 103 (ST. RAPHAEL) (1st Floor)',
            building: 'STO. BUILDING',
            x: 68,
            y: 21,
            lat: 8.74249,
            lng: 124.77429,
        },
        {
            id: 'room_104_kinder_1&2__holy_angels_st_therese',
            name: 'Room 104 Kinder 1&2 (HOLY ANGELS/ST. THERESE)(1st Floor)',
            building: 'STO. BUILDING',
            x: 75,
            y: 21,
            lat: 8.74275,
            lng: 124.77456,
        },
        {
            id: 'room_105_grade_school_library_1st_floor',
            name: 'Room 105 (GRADE SCHOOL LIBRARY)(1st Floor)',
            building: 'STO. BUILDING',
            x: 85,
            y: 21,
            lat: 8.74278,
            lng: 124.77457,
        },
        {
            id: 'room_106_research_planning_and_development_office_1st_floor',
            name: 'Room 106 (RESEARCH PLANNING AND DEVELOPMENT OFFICE)(1st Floor)',
            building: 'STO. BUILDING',
            x: 93,
            y: 21,
            lat: 8.74287,
            lng: 124.77429,
        },

        {
            id: 'room_1_grade_7_our_lady_of_immaculate_conception_2nd_floor',
            name: 'Room 1- Grade 7 (OUR LADY of IMMACULATE CONCEPTION) (2nd Floor)',
            building: 'STO. BUILDING',
            x: 34,
            y: 18,
            lat: 8.74321,
            lng: 124.77421,
        },
        {
            id: 'room_202_grade_6_st_ignatius_of_loyal_2nd_floor',
            name: 'Room 202- Grade 6 (St. Ignatius of loyal) (2nd Floor)',
            building: 'STO. BUILDING',
            x: 39,
            y: 18,
            lat: 8.74318,
            lng: 124.7742,
        },
        {
            id: 'room_203_grade_5_st_francis_xavier_2nd_floor',
            name: 'Room 203- Grade 5 (St. Francis xavier) (2nd Floor)',
            building: 'STO. BUILDING',
            x: 45,
            y: 18,
            lat: 8.74314,
            lng: 124.77416,
        },
        {
            id: 'room_204_grade_4_st_joseph_2nd_floor',
            name: '-Room 204-  Grade 4 (St. Joseph)(2nd Floor)',
            building: 'STO. BUILDING',
            x: 65,
            y: 18,
            lat: 8.74318,
            lng: 124.77414,
        },
        {
            id: 'room_205_junior_high_school_computer_laboratory_2nd_floor',
            name: 'Room 205- Junior High School (COMPUTER LABORATORY)(2nd Floor)',
            building: 'STO. BUILDING',
            x: 78,
            y: 18,
            lat: 8.74296,
            lng: 124.77441,
        },
        {
            id: 'room_206_senior_high_computer_laboratory_2nd_floor',
            name: 'Room 206- Senior High (COMPUTER LABORATORY)(2nd Floor)',
            building: 'STO. BUILDING',
            x: 88,
            y: 18,
            lat: 8.74292,
            lng: 124.77435,
        },

        {
            id: 'room_303_grade_11_st_cecilia_3rd_floor',
            name: 'Room 303 Grade 11 (ST. CECILIA) (3rd Floor)',
            building: 'STO. BUILDING',
            x: 35,
            y: 15,
            lat: 8.74335,
            lng: 124.77408,
        },
        {
            id: 'room_305_grade_11_st_richard_pampuri_3rd_floor',
            name: 'Room 305 Grade 11 (ST. RICHARD PAMPURI) (3rd Floor)',
            building: 'STO. BUILDING',
            x: 40,
            y: 15,
            lat: 8.74336,
            lng: 124.77413,
        },
        {
            id: 'room_306_grade_11_st_apolinia_3rd_floor',
            name: 'Room 306 Grade 11 (ST. APOLINIA) (3rd Floor)',
            building: 'STO. BUILDING',
            x: 45,
            y: 15,
            lat: 8.74345,
            lng: 124.77416,
        },
        {
            id: 'room_304_grade_11_st_monica_3rd_floor',
            name: 'Room 304 Grade 11 (ST. MONICA) (3rd Floor)',
            building: 'STO. BUILDING',
            x: 50,
            y: 15,
            lat: 8.74344,
            lng: 124.77414,
        },
        {
            id: 'room_201_grade_11_st_clair_of_assisi_3rd_floor',
            name: 'Room 201 Grade 11 (ST. CLAIRE OF ASSISI)(3rd Floor)',
            building: 'STO. BUILDING',
            x: 70,
            y: 15,
            lat: 8.74332,
            lng: 124.77427,
        },
        {
            id: 'room_402_grade_12_st_thomas_aquinas_3rd_floor',
            name: 'Room 402 Grade 12 (ST. THOMAS AQUINAS)(3rd Floor)',
            building: 'STO. BUILDING',
            x: 80,
            y: 15,
            lat: 8.74331,
            lng: 124.77425,
        },
        {
            id: 'room_307_robotics_laboratory_3rd_floor',
            name: 'Room 307 (ROBOTICS LABORATORY)(3rd Floor)',
            building: 'STO. BUILDING',
            x: 88,
            y: 15,
            lat: 8.74332,
            lng: 124.77437,
        },

        {
            id: 'room_401_grade_11_san_pedro_calungsod_4th_floor',
            name: 'Room 401- Grade 11 (San Pedro Calungsod) (4th floor)',
            building: 'STO. BUILDING',
            x: 35,
            y: 12,
            lat: 8.74315,
            lng: 124.77419,
        },
        {
            id: 'room_302_grade_11_st_john_paul_ii_4th_floor',
            name: 'Room 302-  Grade 11 (St. John Paul II)(4th floor)',
            building: 'STO. BUILDING',
            x: 40,
            y: 12,
            lat: 8.74312,
            lng: 124.7741,
        },
        {
            id: 'room_403_grade_12_st_lucy_of_syracuse_4th_floor',
            name: 'Room 403- Grade 12 (St. Lucy of Syracuse) (4th floor)',
            building: 'STO. BUILDING',
            x: 47,
            y: 12,
            lat: 8.74329,
            lng: 124.77435,
        },
        {
            id: 'room_404_grade_12_st_peter_canisius_4th_floor',
            name: 'Room 404- Grade 12 (St. Peter Canisius) (4th floor)',
            building: 'STO. BUILDING',
            x: 54,
            y: 12,
            lat: 8.74328,
            lng: 124.77429,
        },
        {
            id: 'room_405_grade_11_st_hubert_4th_floor',
            name: 'Room 405- Grade 12 (St. Hubert)(4th floor)',
            building: 'STO. BUILDING',
            x: 65,
            y: 12,
            lat: 8.74329,
            lng: 124.77429,
        },
        {
            id: 'room_406_grade_12_st_dominic_of_osma_4th_floor',
            name: 'Room 406- Grade 12 (St. Dominic of Osma)(4th floor)',
            building: 'STO. BUILDING',
            x: 75,
            y: 12,
            lat: 8.74334,
            lng: 124.77439,
        },
        {
            id: 'room_407_grade_12_st_luke_4th_floor',
            name: 'Room 407-  Grade 12 (St. Luke)(4th floor)',
            building: 'STO. BUILDING',
            x: 85,
            y: 12,
            lat: 8.74335,
            lng: 124.77448,
        },
        {
            id: 'room_407_grade_12_st_john_xxii_4th_floor',
            name: 'Room 408- grade 12 (St. John XXIII)(4th floor)',
            building: 'STO. BUILDING',
            x: 92,
            y: 12,
            lat: 8.74336,
            lng: 124.77435,
        },
    ];

    useEffect(() => {
        if (initialLocation) {
            const matched = schoolLocations.find(
                (l) =>
                    l.lat === initialLocation.latitude &&
                    l.lng === initialLocation.longitude &&
                    (initialLocation.name
                        ? l.name === initialLocation.name
                        : true),
            );
            setSelectedLocation({
                ...initialLocation,
                id: matched?.id || initialLocation.id,
            });
            if (matched) {
                setSelectedMapPoint({ x: matched.x, y: matched.y });
            }
        } else {
            setSelectedLocation(null);
            setSelectedMapPoint(null);
        }
    }, [initialLocation]);

    /** Click position in map space (0–100), correct even when zoomed/panned */
    const clientToMapCoords = useCallback(
        (event: React.MouseEvent): { x: number; y: number } | null => {
            if (!svgRef.current || !mapGroupRef.current) {
                return null;
            }
            const pt = svgRef.current.createSVGPoint();
            pt.x = event.clientX;
            pt.y = event.clientY;
            const ctm = mapGroupRef.current.getScreenCTM();
            if (!ctm) {
                return null;
            }
            const local = pt.matrixTransform(ctm.inverse());
            const x = Math.round(Math.min(100, Math.max(0, local.x)) * 10) / 10;
            const y = Math.round(Math.min(100, Math.max(0, local.y)) * 10) / 10;
            return { x, y };
        },
        [],
    );

    const copyText = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyHint(label);
            window.setTimeout(() => setCopyHint(null), 2000);
        } catch {
            setCopyHint('Copy failed — select the text and copy manually');
        }
    };

    const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
        if (panMovedRef.current) {
            return;
        }

        const coords = clientToMapCoords(event);
        if (!coords) {
            return;
        }

        if (isPickingCoords) {
            setLastPickedCoords(coords);
            return;
        }

        if (!isPlacingMarker) {
            return;
        }

        setSelectedMapPoint(coords);
        setMapPinOnly(true);
        setIsPlacingMarker(false);
    };

    const useDeviceGps = async () => {
        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
            setGpsError('Geolocation is not supported in this browser.');
            return;
        }

        setGpsLoading(true);
        setGpsError(null);

        try {
            const position = await new Promise<GeolocationPosition>(
                (resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 12000,
                        maximumAge: 0,
                    });
                },
            );

            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            setSelectedLocation({ latitude: lat, longitude: lng });
            setMapPinOnly(false);
            onLocationSelect(
                lat,
                lng,
                accuracy <= 50
                    ? 'Device GPS'
                    : `Device GPS (~${Math.round(accuracy)}m accuracy)`,
            );
        } catch {
            setGpsError(
                'Could not read GPS. Allow location permission, stand outdoors if needed, and try again.',
            );
        } finally {
            setGpsLoading(false);
        }
    };

    const handleLocationClick = (location: (typeof schoolLocations)[0]) => {
        const newLocation = {
            latitude: location.lat,
            longitude: location.lng,
            name: location.name,
            id: location.id,
        };
        setSelectedLocation(newLocation);
        setSelectedMapPoint({ x: location.x, y: location.y });
        setMapPinOnly(false);
        onLocationSelect(location.lat, location.lng, location.name);
    };

    const clearSelection = () => {
        setSelectedLocation(null);
        setSelectedMapPoint(null);
        setMapPinOnly(false);
        setGpsError(null);
        setIsPlacingMarker(false);
    };

    const enablePickCoords = () => {
        setIsPickingCoords(true);
        setIsPlacingMarker(false);
    };

    const [isFullScreen, setIsFullScreen] = useState(false);

    const enablePlaceMarker = () => {
        setIsPlacingMarker(true);
        setIsPickingCoords(false);
    };

    // Helper to set zoom while keeping map centered
    const setZoomLevelCentered = (newZoom: number) => {
        setZoomLevel((prevZoom: number) => {
            const scaleFactor = newZoom / prevZoom;
            // Adjust panOffset so that the point (50,50) stays centered
            setPanOffset((prev: { x: number; y: number }) => ({
                x: prev.x - (50 - prev.x) * (scaleFactor - 1),
                y: prev.y - (50 - prev.y) * (scaleFactor - 1),
            }));
            return Math.min(Math.max(newZoom, 0.5), 3);
        });
    };

    const handleZoomIn = () => {
        const newZoom = Math.min(zoomLevel + 0.2, 3);
        setZoomLevelCentered(newZoom);
    };

    const handleZoomOut = () => {
        const newZoom = Math.max(zoomLevel - 0.2, 0.5);
        setZoomLevelCentered(newZoom);
    };

    // Reset zoom and pan to default
    const handleResetZoom = () => {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
    };

    // Pan functions
    const handlePanStart = (event: React.MouseEvent<SVGSVGElement>) => {
        if (isPlacingMarker || isPickingCoords) {
            return;
        }
        panMovedRef.current = false;
        setIsPanning(true);
        setLastPanPoint({ x: event.clientX, y: event.clientY });
    };

    const handlePanMove = (event: React.MouseEvent<SVGSVGElement>) => {
        if (!isPanning) {
            return;
        }

        const deltaX = event.clientX - lastPanPoint.x;
        const deltaY = event.clientY - lastPanPoint.y;

        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
            panMovedRef.current = true;
        }

        setPanOffset((prev) => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY,
        }));

        setLastPanPoint({ x: event.clientX, y: event.clientY });
    };

    const handlePanEnd = () => {
        setIsPanning(false);
    };

    const pickedLatLng = lastPickedCoords
        ? estimateLatLngFromMapPoint(
            lastPickedCoords.x,
            lastPickedCoords.y,
            campusCenter,
        )
        : null;

    // This is where you'll embed your SRCBMap.svg
    // For now, I'll create a placeholder SVG that represents a school layout
    return (
        <div
            className={`relative rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 ${className} ${isFullScreen ? 'fixed inset-0 z-50 h-full w-full overflow-auto p-4' : ''}`}
        >
            <div className="p-4 pb-2 text-sm text-gray-600 dark:text-slate-400">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Event Geotagging & Campus Map
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                    Set event attendance coordinates and geofence radius for automated student check-in.
                </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="px-4 pb-2">
                <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-900">
                    <button
                        type="button"
                        onClick={() => setMapMode('leaflet')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                            mapMode === 'leaflet'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <MapPin className="h-4 w-4" />
                        <span>Leaflet.js Real-World Geotagging Map (Recommended)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMapMode('blueprint')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                            mapMode === 'blueprint'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <Compass className="h-4 w-4" />
                        <span>2D Campus Schematic Blueprint</span>
                    </button>
                </div>
            </div>

            {mapMode === 'leaflet' ? (
                <div className="p-4 pt-1">
                    <LeafletMapSelector
                        onLocationSelect={(lat, lng, name) =>
                            onLocationSelect(lat, lng, name)
                        }
                        initialLocation={
                            selectedLocation
                                ? {
                                      lat: selectedLocation.latitude,
                                      lng: selectedLocation.longitude,
                                      name: selectedLocation.name,
                                  }
                                : {
                                      lat: campusCenter.lat,
                                      lng: campusCenter.lng,
                                      name: "St. Rita's College of Balingasag",
                                  }
                        }
                    />
                </div>
            ) : (
                <div className="p-4">
                    <div className="mb-3 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => void useDeviceGps()}
                        disabled={gpsLoading}
                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                    >
                        <LocateFixed className="h-4 w-4" />
                        {gpsLoading
                            ? 'Getting GPS…'
                            : 'Use device GPS (recommended)'}
                    </button>
                </div>

                {gpsError && (
                    <p className="mb-3 text-xs text-rose-600 dark:text-rose-400">
                        {gpsError}
                    </p>
                )}

                {mapPinOnly && selectedMapPoint && (
                    <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                        Map pin placed for reference only. Stand at that spot
                        and click <strong>Use device GPS</strong> to save real
                        latitude and longitude for validation.
                    </p>
                )}

                <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Quick Select Location
                    </label>
                    <select
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        value={selectedLocation?.id || ''}
                        onChange={(e) => {
                            const loc = schoolLocations.find(
                                (l) => l.id === e.target.value,
                            );
                            if (loc) handleLocationClick(loc);
                            else clearSelection();
                        }}
                    >
                        <option value="">-- Choose a location --</option>
                        {schoolLocations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                                {loc.building
                                    ? `${loc.building} - ${loc.name}`
                                    : loc.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            isPlacingMarker
                                ? setIsPlacingMarker(false)
                                : enablePlaceMarker()
                        }
                        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${isPlacingMarker
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                            }`}
                    >
                        {isPlacingMarker
                            ? 'Click map for visual pin'
                            : 'Place visual pin on map'}
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            isPickingCoords
                                ? setIsPickingCoords(false)
                                : enablePickCoords()
                        }
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isPickingCoords
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                            }`}
                    >
                        <Crosshair className="h-4 w-4" />
                        {isPickingCoords
                            ? 'Click map to read x, y'
                            : 'Pick coordinates'}
                    </button>
                    {selectedLocation && (
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-900/50"
                        >
                            Clear selection
                        </button>
                    )}
                </div>

                <div
                    className="relative overflow-hidden rounded-lg bg-gray-50 dark:bg-slate-900"
                    style={
                        isFullScreen
                            ? {
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100vw',
                                height: '100vh',
                                zIndex: 1000,
                                backgroundColor: 'white',
                            }
                            : { height: '45vh', minHeight: '280px' }
                    }
                    ref={mapContainerRef}
                >
                    {/* Full-screen toggle button */}
                    <button
                        type="button"
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className="absolute top-2 right-12 z-10 rounded-md bg-white p-1 shadow-md hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        title={
                            isFullScreen ? 'Exit Full Screen' : 'Full Screen'
                        }
                    >
                        {isFullScreen ? (
                            <Minimize2 className="h-4 w-4" />
                        ) : (
                            <Maximize2 className="h-4 w-4" />
                        )}
                    </button>
                    {/* Zoom Controls */}
                    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                        <button
                            onClick={handleZoomIn}
                            className="rounded-md bg-white p-2 shadow-md transition-colors hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            title="Zoom In"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="rounded-md bg-white p-2 shadow-md transition-colors hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            title="Zoom Out"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleResetZoom}
                            className="rounded-md bg-white p-2 shadow-md transition-colors hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            title="Reset Zoom"
                        >
                            <RefreshCcw className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Zoom Level Indicator */}
                    <div className="absolute top-2 left-2 z-10 rounded-md bg-white px-2 py-1 text-xs font-medium shadow-md dark:bg-slate-800 dark:text-slate-200">
                        {Math.round(zoomLevel * 100)}%
                    </div>

                    <svg
                        ref={svgRef}
                        viewBox="0 0 100 100"
                        className="h-full w-full cursor-crosshair"
                        onClick={handleSvgClick}
                        onMouseDown={handlePanStart}
                        onMouseMove={handlePanMove}
                        onMouseUp={handlePanEnd}
                        onMouseLeave={handlePanEnd}
                        style={{
                            cursor:
                                isPlacingMarker || isPickingCoords
                                    ? 'crosshair'
                                    : isPanning
                                        ? 'grabbing'
                                        : 'grab',
                        }}
                    >
                        <g
                            ref={mapGroupRef}
                            transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}
                        >
                            {/* Your SRCBMap.svg content - using external image */}
                            <image
                                href="/images/SRCBMap.svg"
                                x="0"
                                y="0"
                                width="120"
                                height="100"
                                preserveAspectRatio="xMidYMid meet"
                            />

                            {/* Predefined Location Markers */}
                            {schoolLocations.map((location: any) => (
                                <g
                                    key={location.id}
                                    className="group cursor-pointer"
                                    transform={`translate(${location.x}, ${location.y})`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLocationClick(location);
                                    }}
                                >
                                    {/* Pure SVG Map Pin (Teardrop Shape pointing down at 0,0) */}
                                    <path
                                        d={`
                      M 0,0 
                      C -${1.3 / zoomLevel},-${1.3 / zoomLevel} -${1.3 / zoomLevel},-${3.0 / zoomLevel} 0,-${3.0 / zoomLevel}
                      C ${1.3 / zoomLevel},-${3.0 / zoomLevel} ${1.3 / zoomLevel},-${1.3 / zoomLevel} 0,0 
                      Z
                    `}
                                        fill="#3b82f6"
                                        className="stroke-white"
                                        strokeWidth={0.2 / zoomLevel}
                                        strokeLinejoin="round"
                                    />

                                    {/* Inner White Dot (Shifted up to center inside the pin head) */}
                                    <circle
                                        cx="0"
                                        cy={-2.0 / zoomLevel}
                                        r={0.4 / zoomLevel}
                                        fill="white"
                                    />

                                    {/* Location Name Text Label */}
                                    <text
                                        x={0}
                                        y={-4.2 / zoomLevel}
                                        textAnchor="middle"
                                        fontSize={1.8 / zoomLevel}
                                        fill="#1f2937"
                                        className={`pointer-events-none font-medium transition-opacity select-none ${location.building
                                            ? 'opacity-0 group-hover:opacity-100'
                                            : 'opacity-100'
                                            }`}
                                    >
                                        {location.name}
                                    </text>
                                </g>
                            ))}

                            {lastPickedCoords && (
                                <g pointerEvents="none">
                                    <circle
                                        cx={lastPickedCoords.x}
                                        cy={lastPickedCoords.y}
                                        r={2.5 / zoomLevel}
                                        fill="#f59e0b"
                                        stroke="#d97706"
                                        strokeWidth={0.6 / zoomLevel}
                                    />
                                    <text
                                        x={lastPickedCoords.x}
                                        y={lastPickedCoords.y - 4 / zoomLevel}
                                        textAnchor="middle"
                                        fontSize={2 / zoomLevel}
                                        fill="#b45309"
                                        fontWeight="bold"
                                    >
                                        PICKED
                                    </text>
                                </g>
                            )}

                            {/* Selected Location Marker */}
                            {selectedMapPoint && (
                                <g pointerEvents="none">
                                    <circle
                                        cx={selectedMapPoint.x}
                                        cy={selectedMapPoint.y}
                                        r={3 / zoomLevel}
                                        fill="#ef4444"
                                        stroke="#dc2626"
                                        strokeWidth={0.5 / zoomLevel}
                                    />
                                    <text
                                        x={selectedMapPoint.x}
                                        y={selectedMapPoint.y - 5 / zoomLevel}
                                        textAnchor="middle"
                                        fontSize={2 / zoomLevel}
                                        fill="#dc2626"
                                        fontWeight="bold"
                                    >
                                        SELECTED
                                    </text>
                                </g>
                            )}
                        </g>
                    </svg>
                </div>

                {lastPickedCoords && pickedLatLng && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                    Map coordinates (0–100)
                                </p>
                                <p className="mt-1 font-mono text-sm text-amber-800 dark:text-amber-300">
                                    x: {lastPickedCoords.x}, y:{' '}
                                    {lastPickedCoords.y}
                                </p>
                                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                                    Lat: {pickedLatLng.lat.toFixed(6)}, Lng:{' '}
                                    {pickedLatLng.lng.toFixed(6)}
                                </p>
                                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                                    x/y tune the map pin. For each building,
                                    stand on site and use{' '}
                                    <strong>Use device GPS</strong>, then paste
                                    the real lat/lng into schoolLocations.
                                </p>
                                <p className="mt-1 text-xs text-amber-600/90 dark:text-amber-500">
                                    Lat/lng below are estimates only — do not
                                    use them for geofence without verifying on
                                    site.
                                </p>
                            </div>
                            {copyHint && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                                    <Check className="h-3.5 w-3.5" />
                                    {copyHint}
                                </span>
                            )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    void copyText(
                                        `x: ${lastPickedCoords.x}, y: ${lastPickedCoords.y}`,
                                        'Copied x, y',
                                    )
                                }
                                className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-slate-800 dark:text-amber-200 dark:hover:bg-slate-700"
                            >
                                <Copy className="h-3.5 w-3.5" />
                                Copy x, y
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    void copyText(
                                        `x: ${lastPickedCoords.x}, y: ${lastPickedCoords.y}, lat: ${pickedLatLng.lat.toFixed(6)}, lng: ${pickedLatLng.lng.toFixed(6)}`,
                                        'Copied full line',
                                    )
                                }
                                className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-slate-800 dark:text-amber-200 dark:hover:bg-slate-700"
                            >
                                <Copy className="h-3.5 w-3.5" />
                                Copy x, y, lat, lng
                            </button>
                        </div>
                    </div>
                )}

                {selectedLocation && (
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/40">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <div>
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                                    Selected location
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-400">
                                    Lat: {selectedLocation.latitude.toFixed(6)},
                                    Lng: {selectedLocation.longitude.toFixed(6)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-4 text-xs text-gray-500 dark:text-slate-400">
                    <p>• Click predefined locations for quick selection</p>
                    <p>
                        • Pick coordinates: click a spot on the map, then copy
                        values into schoolLocations
                    </p>
                    <p>
                        • Place custom marker: sets the event geofence location
                    </p>
                    <p>
                        • Zoom and pan in normal mode; reset zoom if the map
                        feels off
                    </p>
                </div>
            </div>
            )}
        </div>
    );
}
