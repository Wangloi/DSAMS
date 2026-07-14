const fs = require('fs');

const tsxFile = 'C:/laragon/www/DSAMS/resources/js/components/SchoolMapSelector.tsx';
const jsonFile = 'C:/laragon/www/DSAMS/scratch-locations.json';

let data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

let newLocations = '';
for (let d of data) {
    // Use JSON.stringify to safely escape the name string
    let safeName = JSON.stringify(d.name);
    newLocations += `    { id: '${d.id}', name: ${safeName}, building: '${d.building}', x: ${d.x}, y: ${d.y}, lat: ${d.lat}, lng: ${d.lng} },\n`;
}

let tsxContent = fs.readFileSync(tsxFile, 'utf8');

const startMarker = "const schoolLocations = [";

const startIndex = tsxContent.indexOf(startMarker);

if (startIndex !== -1) {
    const endIndex = tsxContent.indexOf("  ];", startIndex);
    
    if (endIndex !== -1) {
        const originalLocations = `    { id: 'main_gate', name: "Main Gate", x: 47, y: 77, lat: 14.5995, lng: 120.9842 },
    { id: 'sister_convent', name: "Sister Convent", x: 13, y: 15, lat: 14.5996, lng: 120.9841 },
    { id: 'cafeteria', name: "Cafeteria", x: 15, y: 28, lat: 14.5997, lng: 120.9840 },
    { id: 'gymnasium', name: "Gymnasium", x: 20, y: 65, lat: 14.5993, lng: 120.9844 },
    { id: 'st_rita_building', name: "St. Rita Building", x: 50, y: 35, lat: 14.5995, lng: 120.9842 },
    { id: 'mother_ignacia_building', name: "Mother Ignacia Building", x: 93, y: 15, lat: 14.5994, lng: 120.9843 },
    { id: 'sto_nino', name: "Sto. niño", x: 50, y: 16, lat: 14.5994, lng: 120.9843 },
    { id: 'rvm_ttp_program_office', name: "RVM TTP Program Office", x: 13, y: 52, lat: 14.5996, lng: 120.9841 },
    { id: 'power_house', name: "Power House", x: 93, y: 60, lat: 14.5993, lng: 120.9844 },
    { id: 'parking_area', name: "Parking Area", x: 93, y: 78, lat: 14.5997, lng: 120.9840 },
    { id: 'outer_ground', name: "Outer Ground", x: 55, y: 58, lat: 14.5997, lng: 120.9840 },
    { id: 'inner_ground', name: "Inner Ground", x: 66, y: 30, lat: 14.5997, lng: 120.9840 },
    { id: 'parents_lounge', name: "Parents Lounge", x: 30, y: 80, lat: 14.5997, lng: 120.9840 },\n`;

        const newContent = tsxContent.substring(0, startIndex + startMarker.length) + '\n' + originalLocations + newLocations + tsxContent.substring(endIndex);
        fs.writeFileSync(tsxFile, newContent);
        console.log("Success");
    } else {
        console.log("End marker not found.");
    }
} else {
    console.log("Start marker not found.");
}

// Also let's fix the type 'unknown' error in reduce.
let content = fs.readFileSync(tsxFile, 'utf8');
content = content.replace(").map((location) => (", ").map((location: any) => (");
fs.writeFileSync(tsxFile, content);
