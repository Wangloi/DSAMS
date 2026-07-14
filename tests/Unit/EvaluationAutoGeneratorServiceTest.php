<?php

use App\Services\EvaluationAutoGeneratorService;

test('it extracts evaluation name and description from header text', function () {
    $text = "Laravel seminar evaluation\nThis is a custom description on line 2\n\n1. How are you?";
    $result = EvaluationAutoGeneratorService::parseTextToEvaluation($text);

    expect($result['name'])->toBe('Laravel seminar evaluation');
    expect($result['description'])->toBe('This is a custom description on line 2');
    expect($result['questions'])->toHaveCount(1);
    expect($result['questions'][0]['label'])->toBe('How are you?');
});

test('it parses multiple choice questions', function () {
    $text = "Seminar Evaluation\n\n" .
            "1. Which program did you attend?\n" .
            "A. BSCS\n" .
            "B. BSIT\n" .
            "C. BSIS\n";
            
    $result = EvaluationAutoGeneratorService::parseTextToEvaluation($text);

    expect($result['questions'])->toHaveCount(1);
    $q = $result['questions'][0];
    expect($q['type'])->toBe('multiple_choice');
    expect($q['options'])->toBe(['BSCS', 'BSIT', 'BSIS']);
});

test('it parses checkbox questions', function () {
    $text = "Seminar Evaluation\n\n" .
            "1. Select all web technologies you use:\n" .
            "[ ] React\n" .
            "[ ] Vue\n" .
            "[ ] Angular\n";
            
    $result = EvaluationAutoGeneratorService::parseTextToEvaluation($text);

    expect($result['questions'])->toHaveCount(1);
    $q = $result['questions'][0];
    expect($q['type'])->toBe('checkbox');
    expect($q['options'])->toBe(['React', 'Vue', 'Angular']);
});

test('it parses rating questions based on scale keywords', function () {
    $text = "Seminar Evaluation\n\n" .
            "1. How would you rate the speaker's performance on a scale of 1 to 5?\n" .
            "1 - Very Poor\n" .
            "2 - Poor\n" .
            "3 - Neutral\n" .
            "4 - Good\n" .
            "5 - Excellent\n";
            
    $result = EvaluationAutoGeneratorService::parseTextToEvaluation($text);

    expect($result['questions'])->toHaveCount(1);
    $q = $result['questions'][0];
    expect($q['type'])->toBe('rating');
    // For rating type questions, options are omitted as the frontend renders a standard rating input
    expect($q)->not->toHaveKey('options');
});

test('it parses comments/feedback as long text', function () {
    $text = "Seminar Evaluation\n\n" .
            "1. Do you have any additional comments or suggestions?\n";
            
    $result = EvaluationAutoGeneratorService::parseTextToEvaluation($text);

    expect($result['questions'])->toHaveCount(1);
    $q = $result['questions'][0];
    expect($q['type'])->toBe('long_text');
});
