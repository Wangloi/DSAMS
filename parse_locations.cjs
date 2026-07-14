const fs = require('fs');

const raw = `MOTHER IGNACIA BUILDING 
1st floor 

Christian Formation Office 
Chapel
Room 101
HM Laboratory

(2nd Floor)

College Library
Dean of College
College Faculty Room
Program Head's Office
Male Rest Room (CR)
Female Rest Room (CR)

3rd floor
 
Right side
-IT LABORATORY 

Left side
-Room 301
-Room 302
-Room 303
-Cr (Male & Female)

4th floor
Right Side
4th floor crimlab

Left Side
 401 Room
 402 Room
 403 Room
CR M/F

St. Rita Buildings 

4th Floor

Ladies Comfort Room 
Grade 9 - Our Lady of Holy Rosary 
Grade 9 - Our Lady of Mt. Carmel
Grade 10 - Mary Mediatrix of all graces
PAASCU EXHIBIT
Grade 10 - Queenship of Mary 
Grade 10 - Our Lady of Presentation 
Room No. 403 - Gen. Science Laboratory 
Room No. 402 - Physics & Chemistry Laboratory 
Gentlemen Comfort Room 
Grade 10 - Nativity of Our Lady

3rd Floor 

GenEd Computer Laboratory 
Grade 9 - Our Lady of Beaterio
Grade 9 - Our Lady of Visitation 
Grade 8 - Our Lady of Loretto
Grade 8 - Our Lady of Perpetual Help 
Grade 8 - Our Lady of Lourdes 
Grade 8 - Our Lady of Pillar
Grade 7 - Our Lady of Annunciation 
Ladies Comfort Room 
Grade 7 - Our Lady of Assumption 

2nd Floor

Gentlemen Comfort Room 
Room No. 206 - Library 
Room No.  205 - Speech Laboratory 
Room No. 204 - Audio - Visual Room
Grade 7 - Our Lady of Guadalupe
Grade 7 - Our Lady of Hope
Ladies and Gentlemen Comfort Room
Room No. 201 Gradeschool - Computer Laboratory

1st Floor

Dean of Students Affairs 
President's Office Stock Room
Accessible Toilet 
President's Office 
Conference Room - PAASCU HEADQUARTERS 
Encoding Room
Registrar
Finance - Cashier 
Room 106 - Property Custodian 
Audio/Amplifier Control Room
PAASCU Headquarters 
Principal's Office 
BED Faculty Room
Room No. 103 - School Clinic 
Room No. 102 - Guidance Office 
Ladies & Gentlemen Comfort Room 
Room No. 101 - TLE Laboratory

Sto. Building

1. 1st Floor
- (HR COORDINATOR OFFICE) & (TRANSPORT STOCKROOM)
- (BUSINESS MANAGER'S OFFICE) & VPAA OFFICE (Quality Assurance Office)
-Room 101 Grade 3 (ST. GABRIEL)
-Room 102 Grade 2 (ST.MICHAEL)
- ICT OFFICE
- Room 103 (ST. RAPHAEL)
- Room 104 Kinder 1&2 (HOLY ANGELS/ST. THERESE)
- Room 105 (GRADE SCHOOL LIBRARY)
- Room 106 (RESEARCH PLANNING AND DEVELOPMENT OFFICE)
- UTILITY STOCKROOM & ELECTRICAL STOCKROOM

 2. 2nd Floor
-CR 1 Men 
-Room 1- Grade 7 (OUR LADY of IMMACULATE CONCEPTION)
-Room 202- Grade 6 (St. Ignatius of loyal)
-Room 203- Grade 5 (St. Francis xavier)
-Room 204-  Grade 4 (St. Joseph)
-BED POD Office
-Room 205- Junior High School (COMPUTER LABORATORY)
-Room 206- Senior High (COMPUTER LABORATORY)

3rd Floor
- Room 303 Grade 11 (ST. CECILIA)
- Room 305 Grade 11 (ST. RICHARD PAMPURI)
- Room 306 Grade 11 (ST. APOLINIA)
- Room 304 Grade 11 (ST. MONICA)
- SHS PRINCIPAL - OIC 
- Room 201 Grade 11 (ST. CLAIRE OF ASSISI)
- Room 402 Grade 12 (ST. THOMAS AQUINAS)
- Room 307 (ROBOTICS LABORATORY)
- StAC. Office

4. 4th floor
-Men's bathroom 
-Room 401- Grade 11 (San Pedro Calungsod)
-Room 302-  Grade 11 (St. John Paul II)
-Room 403- Grade 12 (St. Lucy of Syracuse)
-Room 404- grade 12 (St. Peter Canisius)
-Subject area Coordinator (SAC)
-Room 405- grade 12 (St. Hubert)
-Room 406- grade 12 (St. Dominic of Osma)
-Room 407-  grade 12 (St. Luke)
-Room 408- grade 12 (St. John XXIII)
-Women's bathroom`;

const lines = raw.split('\n').map(l => l.trim()).filter(l => l);

let currentBuilding = '';
let currentFloor = '';
let currentSide = '';

const buildings = {
    'MOTHER IGNACIA BUILDING': { x: 93, y: 15, lat: 14.5994, lng: 120.9843 },
    'ST. RITA BUILDING': { x: 50, y: 35, lat: 14.5995, lng: 120.9842 },
    'STO. BUILDING': { x: 50, y: 16, lat: 14.5994, lng: 120.9843 }
};

const output = [];

for (const line of lines) {
    if (line.match(/MOTHER IGNACIA BUILDING/i)) {
        currentBuilding = 'MOTHER IGNACIA BUILDING';
        continue;
    } else if (line.match(/St. Rita Buildings?/i)) {
        currentBuilding = 'ST. RITA BUILDING';
        continue;
    } else if (line.match(/Sto. Building/i)) {
        currentBuilding = 'STO. BUILDING';
        continue;
    }

    if (line.match(/^\(?[1-4]((st)|(nd)|(rd)|(th)) floor\)?/i) || line.match(/^[1-4]\.\s+[1-4]((st)|(nd)|(rd)|(th)) Floor/i)) {
        currentFloor = line.replace(/^[1-4]\.\s+/, '').replace(/[\(\)]/g, '').trim();
        currentSide = '';
        continue;
    }

    if (line.match(/Right side/i) || line.match(/Left side/i)) {
        currentSide = line;
        continue;
    }

    let name = line.replace(/^-/, '').trim();
    if (!name) continue;

    let fullName = name;
    if (currentFloor) fullName += ` (${currentFloor})`;

    const b = buildings[currentBuilding];
    if (!b) continue;

    output.push({
        id: fullName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
        name: fullName,
        building: currentBuilding,
        x: b.x,
        y: b.y,
        lat: b.lat,
        lng: b.lng
    });
}

fs.writeFileSync('C:/laragon/www/DSAMS/scratch-locations.json', JSON.stringify(output, null, 2));
