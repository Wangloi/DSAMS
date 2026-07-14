import re
import sys

def main():
    file_path = 'resources/js/pages/admin-dashboard/attendance/CreateEventModal.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add currentStep state
    content = content.replace(
        "const [showMapSelector, setShowMapSelector] = useState(false);",
        "const [currentStep, setCurrentStep] = useState(1);\n    const [showMapSelector, setShowMapSelector] = useState(false);"
    )

    # 2. Reset step in handleClose
    content = content.replace(
        "setScannerStudentError('');\n        onClose();",
        "setScannerStudentError('');\n        setCurrentStep(1);\n        onClose();"
    )

    # 3. Extract blocks using regex
    def get_block(pattern):
        match = re.search(pattern, content)
        if not match:
            print(f"Failed to find match for {pattern}")
            sys.exit(1)
        return match.group(0)

    eventName = get_block(r'<div className="grid gap-2 sm:col-span-2">\s*<Label htmlFor="eventName"[\s\S]*?</datalist>\s*\)}[\s\S]*?</div>')
    organizer = get_block(r'<div className="grid gap-2">\s*<Label htmlFor="organizer"[\s\S]*?</Select>\s*</div>')
    eventDate = get_block(r'<div className="grid gap-2">\s*<Label htmlFor="eventDate"[\s\S]*?/>\s*</div>')
    eventTime = get_block(r'<div className="grid gap-2">\s*<Label htmlFor="eventTime"[\s\S]*?/>\s*</div>')
    regTime = get_block(r'<div className="grid gap-2">\s*<Label htmlFor="registrationEndTime"[\s\S]*?/>\s*</div>')
    desc = get_block(r'<div className="grid gap-2 sm:col-span-2">\s*<Label htmlFor="description"[\s\S]*?</textarea>\s*</div>')

    location = get_block(r'<div className="grid gap-2">\s*<Label htmlFor="location"[\s\S]*?/>\s*</div>')
    geotagging = get_block(r'<div className="grid gap-2 sm:col-span-2">\s*<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Geotagging</Label>[\s\S]*?</p>\s*</div>')
    geofenceDetails = get_block(r'\{formData\.geofenceEnabled && \([\s\S]*?</>\s*\)}')

    attendees = get_block(r'<div className="grid gap-2 sm:col-span-2">\s*<Label htmlFor="expectedAttendees"[\s\S]*?/>\s*</div>')
    courses = get_block(r'<div className="grid gap-2 sm:col-span-1">\s*<Label htmlFor="courses"[\s\S]*?</Select>\s*</div>')
    yearLevels = get_block(r'<div className="grid gap-2 sm:col-span-1">\s*<Label htmlFor="yearLevels"[\s\S]*?</Select>\s*</div>')
    scanner = get_block(r'<div className="grid gap-2 sm:col-span-2">\s*<Label htmlFor="scannerStudentId"[\s\S]*?</div>\s*\)}\s*</div>')

    new_jsx_body = f"""
                            <div className="flex-1 overflow-x-hidden overflow-y-auto bg-white px-6 py-6 dark:bg-slate-900">
                                {{/* Stepper Header */}}
                                <div className="mb-8 flex items-center justify-center sm:justify-start">
                                    {{[
                                        {{ step: 1, label: "Basic Info" }},
                                        {{ step: 2, label: "Location" }},
                                        {{ step: 3, label: "Audience" }}
                                    ].map(({{ step, label }}) => (
                                        <div key={{step}} className="flex items-center">
                                            <div className="flex flex-col items-center relative">
                                                <div className={{`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${{
                                                    currentStep === step ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500' :
                                                    currentStep > step ? 'border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-400' :
                                                    'border-slate-300 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }}`}}>
                                                    {{currentStep > step ? '✓' : step}}
                                                </div>
                                                <span className={{`absolute -bottom-6 w-max text-xs font-medium ${{
                                                    currentStep === step ? 'text-blue-700 dark:text-blue-400' :
                                                    currentStep > step ? 'text-slate-700 dark:text-slate-300' :
                                                    'text-slate-400 dark:text-slate-500'
                                                }}`}}>
                                                    {{label}}
                                                </span>
                                            </div>
                                            {{step < 3 && (
                                                <div className={{`mx-4 h-0.5 w-16 sm:mx-6 sm:w-24 ${{
                                                    currentStep > step ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                                                }}`}} />
                                            )}}
                                        </div>
                                    ))}}
                                </div>

                                <div className="grid gap-6 mt-6">
                                    {{currentStep === 1 && (
                                        <div className="grid gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                            {eventName}
                                            {organizer}
                                            <div className="hidden sm:block"></div>
                                            {eventDate}
                                            {eventTime}
                                            {regTime}
                                            <div className="hidden sm:block"></div>
                                            {desc}
                                        </div>
                                    )}}

                                    {{currentStep === 2 && (
                                        <div className="grid gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                            {location}
                                            <div className="col-span-2 border-t border-slate-100 my-2 dark:border-slate-800"></div>
                                            {geotagging}
                                            {geofenceDetails}
                                        </div>
                                    )}}

                                    {{currentStep === 3 && (
                                        <div className="grid gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                            {courses}
                                            {yearLevels}
                                            {attendees}
                                            <div className="col-span-2 border-t border-slate-100 my-2 dark:border-slate-800"></div>
                                            {scanner}
                                        </div>
                                    )}}
                                </div>
                            </div>
"""

    full_regex = r'<div className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto bg-white px-6 py-6 dark:bg-slate-900">[\s\S]*?</div>\s*</div>\s*</div>'
    content = re.sub(full_regex, new_jsx_body, content, 1)

    # 4. Update footer buttons
    footer_regex = r'<Button variant="secondary" type="button" onClick=\{handleClose\}>\s*Cancel\s*</Button>\s*<Button\s*type="submit"\s*className="bg-\[#121F78\] hover:bg-\[#0f1a66\]"\s*onClick=\{handleSubmit\}\s*>\s*Create Event\s*</Button>'

    new_footer = """
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
                                            className="bg-blue-600 hover:bg-blue-700 text-white" 
                                            onClick={() => setCurrentStep(prev => prev + 1)}
                                        >
                                            Next Step
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            className="bg-[#121F78] hover:bg-[#0f1a66] text-white"
                                            onClick={handleSubmit}
                                        >
                                            Create Event
                                        </Button>
                                    )}
                                </div>
"""
    content = re.sub(footer_regex, new_footer, content, 1)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
