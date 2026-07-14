const fs = require('fs');

const tsxFile = 'resources/js/pages/admin-dashboard/attendance/CreateEventModal.tsx';
let content = fs.readFileSync(tsxFile, 'utf8');

// 1. Add currentStep state
content = content.replace(
    /const \[showMapSelector, setShowMapSelector\] = useState\(false\);/,
    `const [currentStep, setCurrentStep] = useState(1);
    const [showMapSelector, setShowMapSelector] = useState(false);`
);

// 2. Reset step in handleClose
content = content.replace(
    /setScannerStudentError\(''\);\s+onClose\(\);/,
    `setScannerStudentError('');
        setCurrentStep(1);
        onClose();`
);

// 3. Update the JSX body
const jsxStartRegex = /<div className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto bg-white px-6 py-6 dark:bg-slate-900">\s*<div className="grid grid-cols-1 gap-6">\s*<div className="grid gap-4 sm:grid-cols-2">/;

const jsxEndRegex = /<\/div>\s*<\/div>\s*<\/div>\s*<div className="flex shrink-0 justify-end gap-2 rounded-b-xl border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800\/80">/;

// I will extract the blocks using regex to ensure they are untouched, then wrap them in steps.
const eventNameBlockMatch = content.match(/<div className="grid gap-2 sm:col-span-2">\s*<Label htmlFor="eventName"[\s\S]*?<\/datalist>\s*\)}[\s\S]*?<\/div>/);
const organizerBlockMatch = content.match(/<div className="grid gap-2">\s*<Label htmlFor="organizer"[\s\S]*?<\/Select>\s*<\/div>/);
const eventDateBlockMatch = content.match(/<div className="grid gap-2">\s*<Label htmlFor="eventDate"[\s\S]*?<\/Input>\s*<\/div>/);
const eventTimeBlockMatch = content.match(/<div className="grid gap-2">\s*<Label htmlFor="eventTime"[\s\S]*?<\/Input>\s*<\/div>/);
const regTimeBlockMatch = content.match(/<div className="grid gap-2">\s*<Label htmlFor="registrationEndTime"[\s\S]*?<\/Input>\s*<\/div>/);
const descBlockMatch = content.match(/<div className="grid gap-2 sm:col-span-2">\s*<Label htmlFor="description"[\s\S]*?<\/textarea>\s*<\/div>/);

const locationBlockMatch = content.match(/<div className="grid gap-2">\s*<Label htmlFor="location"[\s\S]*?<\/Input>\s*<\/div>/);
const geotaggingBlockMatch = content.match(/<div className="grid gap-2 sm:col-span-2">\s*<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Geotagging<\/Label>[\s\S]*?<\/p>\s*<\/div>/);
const geofenceDetailsBlockMatch = content.match(/\{formData\.geofenceEnabled && \([\s\S]*?<\/>\s*\)}/);

const attendeesBlockMatch = content.match(/<div className="grid gap-2 sm:col-span-2">\s*<Label htmlFor="expectedAttendees"[\s\S]*?<\/Input>\s*<\/div>/);
const coursesBlockMatch = content.match(/<div className="grid gap-2 sm:col-span-1">\s*<Label htmlFor="courses"[\s\S]*?<\/Select>\s*<\/div>/);
const yearLevelsBlockMatch = content.match(/<div className="grid gap-2 sm:col-span-1">\s*<Label htmlFor="yearLevels"[\s\S]*?<\/Select>\s*<\/div>/);
const scannerBlockMatch = content.match(/<div className="grid gap-2 sm:col-span-2">\s*<Label htmlFor="scannerStudentId"[\s\S]*?<\/div>\s*\)}\s*<\/div>/);

const newJsxBody = \`
<div className="flex-1 overflow-x-hidden overflow-y-auto bg-white px-6 py-6 dark:bg-slate-900">
    {/* Stepper Header */}
    <div className="mb-8 flex items-center justify-center sm:justify-start">
        {[
            { step: 1, label: "Basic Info" },
            { step: 2, label: "Location" },
            { step: 3, label: "Audience" }
        ].map(({ step, label }) => (
            <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                    <div className={\`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors \${
                        currentStep === step ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500' :
                        currentStep > step ? 'border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-400' :
                        'border-slate-300 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }\`}>
                        {currentStep > step ? '✓' : step}
                    </div>
                    <span className={\`mt-1.5 hidden text-xs font-medium sm:block \${
                        currentStep === step ? 'text-blue-700 dark:text-blue-400' :
                        currentStep > step ? 'text-slate-700 dark:text-slate-300' :
                        'text-slate-400 dark:text-slate-500'
                    }\`}>
                        {label}
                    </span>
                </div>
                {step < 3 && (
                    <div className={\`mx-2 h-0.5 w-12 sm:mx-4 sm:w-20 sm:-mt-5 \${
                        currentStep > step ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                    }\`} />
                )}
            </div>
        ))}
    </div>

    <div className="grid gap-6">
        {currentStep === 1 && (
            <div className="grid gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-right-4 duration-300">
                \${eventNameBlockMatch[0]}
                \${organizerBlockMatch[0]}
                <div className="hidden sm:block"></div>
                \${eventDateBlockMatch[0]}
                \${eventTimeBlockMatch[0]}
                \${regTimeBlockMatch[0]}
                <div className="hidden sm:block"></div>
                \${descBlockMatch[0]}
            </div>
        )}

        {currentStep === 2 && (
            <div className="grid gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-right-4 duration-300">
                \${locationBlockMatch[0]}
                <div className="col-span-2 border-t border-slate-100 my-2 dark:border-slate-800"></div>
                \${geotaggingBlockMatch[0]}
                \${geofenceDetailsBlockMatch[0]}
            </div>
        )}

        {currentStep === 3 && (
            <div className="grid gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-right-4 duration-300">
                \${coursesBlockMatch[0]}
                \${yearLevelsBlockMatch[0]}
                \${attendeesBlockMatch[0]}
                <div className="col-span-2 border-t border-slate-100 my-2 dark:border-slate-800"></div>
                \${scannerBlockMatch[0]}
            </div>
        )}
    </div>
</div>
\`;

const fullRegex = new RegExp('<div className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto bg-white px-6 py-6 dark:bg-slate-900">[\\\\s\\\\S]*?</div>\\\\s*</div>\\\\s*</div>');

content = content.replace(fullRegex, newJsxBody);

// Update footer buttons
const footerRegex = /<Button variant="secondary" type="button" onClick=\{handleClose\}>\s*Cancel\s*<\/Button>\s*<Button\s*type="submit"\s*className="bg-\[#121F78\] hover:bg-\[#0f1a66\]"\s*onClick=\{handleSubmit\}\s*>\s*Create Event\s*<\/Button>/;

const newFooter = \`
<Button variant="secondary" type="button" onClick={handleClose}>
    Cancel
</Button>
<div className="flex gap-2 ml-auto">
    {currentStep > 1 && (
        <Button variant="outline" type="button" onClick={() => setCurrentStep(prev => prev - 1)}>
            Back
        </Button>
    )}
    {currentStep < 3 ? (
        <Button 
            type="button" 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={() => setCurrentStep(prev => prev + 1)}
        >
            Next Step
        </Button>
    ) : (
        <Button
            type="submit"
            className="bg-[#121F78] hover:bg-[#0f1a66]"
            onClick={handleSubmit}
        >
            Create Event
        </Button>
    )}
</div>
\`;

content = content.replace(footerRegex, newFooter);

fs.writeFileSync(tsxFile, content);
console.log('done');
