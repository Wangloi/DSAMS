<?php

namespace App\Services;

use DOMDocument;
use Exception;
use ZipArchive;

class EvaluationAutoGeneratorService
{
    /**
     * Extract evaluation name, description, and questions from a file.
     *
     * @throws Exception
     */
    public static function extractQuestionsFromFile(string $filePath, string $extension): array
    {
        $text = '';
        $extension = strtolower($extension);

        if ($extension === 'pdf') {
            $text = self::extractTextFromPdf($filePath);
        } elseif ($extension === 'docx') {
            $text = self::extractTextFromDocx($filePath);
        } elseif (in_array($extension, ['xlsx', 'xls'])) {
            $text = self::extractTextFromExcel($filePath);
        } else {
            throw new Exception("Unsupported file format: {$extension}");
        }

        return self::parseTextToEvaluation($text);
    }

    /**
     * Extract text from a PDF file using Smalot PDF Parser.
     *
     * @throws Exception
     */
    private static function extractTextFromPdf(string $filePath): string
    {
        if (! class_exists(\Smalot\PdfParser\Parser::class)) {
            throw new Exception('PDF parser library is not installed.');
        }
        $parser = new \Smalot\PdfParser\Parser;
        $pdf = $parser->parseFile($filePath);

        return $pdf->getText();
    }

    /**
     * Extract text from a DOCX file using native zip/XML extraction.
     */
    private static function extractTextFromDocx(string $filePath): string
    {
        $zip = new ZipArchive;
        if ($zip->open($filePath) === true) {
            if (($index = $zip->locateName('word/document.xml')) !== false) {
                $xmlContent = $zip->getFromIndex($index);
                $dom = new DOMDocument;
                // Load XML with security flags
                $dom->loadXML($xmlContent, LIBXML_NOENT | LIBXML_XINCLUDE | LIBXML_NOERROR | LIBXML_NOWARNING);
                $text = '';
                // Get all paragraphs
                $paragraphs = $dom->getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'p');
                foreach ($paragraphs as $p) {
                    $text .= $p->textContent."\n";
                }
                $zip->close();

                return $text;
            }
            $zip->close();
        }

        return '';
    }

    /**
     * Extract text from an Excel file (XLSX/XLS) using PhpSpreadsheet.
     *
     * @throws Exception
     */
    private static function extractTextFromExcel(string $filePath): string
    {
        if (! class_exists(\PhpOffice\PhpSpreadsheet\IOFactory::class)) {
            throw new Exception('Excel parser library is not installed.');
        }
        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($filePath);
        $sheet = $spreadsheet->getActiveSheet();
        $text = '';
        foreach ($sheet->getRowIterator() as $row) {
            $cellIterator = $row->getCellIterator();
            $cellIterator->setIterateOnlyExistingCells(false);
            $rowValues = [];
            foreach ($cellIterator as $cell) {
                $rowValues[] = (string) $cell->getValue();
            }
            // Filter out empty cells and join with spaces
            $rowText = trim(implode(' ', array_filter($rowValues)));
            if ($rowText !== '') {
                $text .= $rowText."\n";
            }
        }

        return $text;
    }

    /**
     * Core parsing engine that structures plain text into an evaluation form state.
     */
    public static function parseTextToEvaluation(string $text): array
    {
        // Normalize line endings
        $text = str_replace("\r", '', $text);
        $lines = explode("\n", $text);

        $evaluationName = 'Auto-Generated Evaluation';
        $evaluationDescription = '';
        $questions = [];

        // Find title and description from the header lines before any question
        $headerLines = [];
        $firstQuestionIndex = -1;

        // Question prefix pattern (e.g. "1. ", "Question 1:", "Q1) ", "1- ")
        $questionPattern = '/^\s*(?:Question\s*|Q)?\s*(\d+)\s*[\.\)\:\]\s]+\s*(.+)$/i';

        foreach ($lines as $idx => $line) {
            $trimmed = trim($line);
            if ($trimmed === '') {
                continue;
            }

            // Check if this line looks like a question without considering option patterns
            if ((preg_match($questionPattern, $trimmed) || (str_ends_with($trimmed, '?') && strlen($trimmed) > 10)) && ! preg_match('/^\d+\s*[-–]\s*.+$/', $trimmed)) {
                $firstQuestionIndex = $idx;
                break;
            }
            $headerLines[] = $trimmed;
        }

        if (! empty($headerLines)) {
            $evaluationName = $headerLines[0];
            if (count($headerLines) > 1) {
                $evaluationDescription = implode(' ', array_slice($headerLines, 1));
            }
        }

        // Now parse questions
        $currentQuestion = null;
        $currentOptions = [];

        $choicePattern = '/^\s*(?:\[\s*\]|\(\s*\)|[A-Ea-e\d]\s*[\.\)\-]|•|\-|\*|o)\s+(.+)$/';

        for ($i = ($firstQuestionIndex !== -1 ? $firstQuestionIndex : 0); $i < count($lines); $i++) {
            $line = trim($lines[$i]);
            if ($line === '') {
                continue;
            }

            $isNewQuestion = false;
            $questionLabel = '';

            // Determine if this line is an option/scale line, treating rating scales (e.g., "1 - Poor") as options
            $isOptionLine = (preg_match($choicePattern, $line) && ! preg_match($questionPattern, $line))
                || preg_match('/^\d+\s*[-–]\s*.+$/', $line);
            if ((preg_match($questionPattern, $line, $matches) && ! $isOptionLine)) {
                $isNewQuestion = true;
                $questionLabel = trim($matches[2]);
            } elseif (str_ends_with($line, '?') && strlen($line) > 10 && ! $isOptionLine) {
                // If it ends with ? and is not starting with choice characters, treat it as a question
                if (! preg_match($choicePattern, $line)) {
                    $isNewQuestion = true;
                    $questionLabel = $line;
                }
            }

            if ($isNewQuestion) {
                [$nextExplicitType, $nextCleanQuestionLabel] = self::extractExplicitQuestionType($questionLabel);
                if (
                    $currentQuestion !== null
                    && ($currentQuestion['label'] ?? '') === ''
                    && ! empty($currentQuestion['explicit_type'])
                    && $nextCleanQuestionLabel !== ''
                ) {
                    $currentQuestion['label'] = $nextCleanQuestionLabel;
                    if ($nextExplicitType !== null) {
                        $currentQuestion['explicit_type'] = $nextExplicitType;
                    }

                    continue;
                }

                // Save previous question if any
                if ($currentQuestion !== null) {
                    $currentQuestion['options'] = $currentOptions;
                    $currentQuestion['type'] = self::determineQuestionType($currentQuestion, $currentOptions);
                    unset($currentQuestion['explicit_type']);
                    if ($currentQuestion['type'] !== 'multiple_choice' && $currentQuestion['type'] !== 'checkbox') {
                        unset($currentQuestion['options']);
                    }
                    $questions[] = $currentQuestion;
                }

                // Start new question
                $currentQuestion = [
                    'id' => 'q_'.bin2hex(random_bytes(4)),
                    'type' => 'short_text', // default, refined later
                    'label' => $nextCleanQuestionLabel,
                    'required' => true,
                ];
                if ($nextExplicitType !== null) {
                    $currentQuestion['explicit_type'] = $nextExplicitType;
                }
                $currentOptions = [];
            } else {
                // It might be a choice/option or detail for the current question
                if ($currentQuestion !== null) {
                    [$explicitType, $remainingLine] = self::extractExplicitQuestionType($line);
                    if ($explicitType !== null) {
                        $currentQuestion['explicit_type'] = $explicitType;

                        if ($remainingLine !== '') {
                            if ($currentQuestion['label'] === '') {
                                $currentQuestion['label'] = $remainingLine;
                            } elseif (count($currentOptions) > 0) {
                                $currentOptions[] = $remainingLine;
                            } else {
                                $currentQuestion['label'] .= ' '.$remainingLine;
                            }
                        }
                    } elseif (preg_match($choicePattern, $line, $optMatches)) {
                        $currentOptions[] = trim($optMatches[1]);
                    } elseif (preg_match('/^\s*(?:[A-Ea-e])\s*[\.\)\-]?\s+(.+)$/i', $line, $optMatches)) {
                        // Letter option without explicit symbol (e.g. "a. Option")
                        $currentOptions[] = trim($optMatches[1]);
                    } elseif (preg_match('/^\s*\d+\s*[-–]\s*(.+)$/', $line, $optMatches)) {
                        // Rating scale option like "1 - Poor"
                        $currentOptions[] = trim($optMatches[1]);
                    } else {
                        // Just an additional line of text, append to the label if it's short, or treat as option
                        if (count($currentOptions) === 0 && strlen($line) < 100 && ! str_contains($line, '?')) {
                            // If it's a short text following the question, it might be description or continuation
                            $currentQuestion['label'] .= ' '.$line;
                        } else {
                            // Treat as a plain option if we already have options
                            if (count($currentOptions) > 0) {
                                $currentOptions[] = $line;
                            }
                        }
                    }
                }
            }
        }

        // Save the last question
        if ($currentQuestion !== null) {
            $currentQuestion['options'] = $currentOptions;
            $currentQuestion['type'] = self::determineQuestionType($currentQuestion, $currentOptions);
            unset($currentQuestion['explicit_type']);
            if ($currentQuestion['type'] !== 'multiple_choice' && $currentQuestion['type'] !== 'checkbox') {
                unset($currentQuestion['options']);
            }
            $questions[] = $currentQuestion;
        }

        // If no questions were parsed, add a default one
        if (empty($questions)) {
            $questions[] = [
                'id' => 'q_'.bin2hex(random_bytes(4)),
                'type' => 'rating',
                'label' => 'How would you rate this event overall?',
                'required' => true,
            ];
        }

        return [
            'name' => substr($evaluationName, 0, 100),
            'description' => $evaluationDescription,
            'questions' => $questions,
        ];
    }

    /**
     * Determine the type of a question based on its label and parsed options.
     */
    private static function determineQuestionType(array $question, array $options): string
    {
        if (! empty($question['explicit_type']) && self::isSupportedQuestionType((string) $question['explicit_type'])) {
            return (string) $question['explicit_type'];
        }

        $label = strtolower($question['label']);

        // Check for rating keywords
        if (
            str_contains($label, 'rate') ||
            str_contains($label, 'rating') ||
            str_contains($label, 'scale') ||
            str_contains($label, '1-5') ||
            str_contains($label, '1 to 5') ||
            str_contains($label, 'satisfied') ||
            str_contains($label, 'satisfaction')
        ) {
            return 'rating';
        }

        // If we have options:
        if (! empty($options)) {
            // Check for rating scale options (e.g. 1 - Poor, 5 - Excellent)
            // Check for rating scale options (e.g., numeric 1-5 or descriptive words)
            $isRatingScale = true;
            foreach ($options as $opt) {
                // Accept numeric ratings or typical rating descriptors
                if (! preg_match('/^\s*(\d+|poor|excellent|neutral|agree|disagree|strongly|very\s+good|good|bad|fair|average|satisfied|unsatisfied)$/i', $opt)) {
                    $isRatingScale = false;
                    break;
                }
            }
            if ($isRatingScale && count($options) <= 5 && count($options) >= 2) {
                return 'rating';
            }

            // Check for checkbox indicators
            if (
                str_contains($label, 'select all') ||
                str_contains($label, 'check all') ||
                str_contains($label, 'choose all') ||
                str_contains($label, 'select multiple')
            ) {
                return 'checkbox';
            }

            return 'multiple_choice';
        }

        // Text questions
        if (
            str_contains($label, 'comment') ||
            str_contains($label, 'feedback') ||
            str_contains($label, 'describe') ||
            str_contains($label, 'explain') ||
            str_contains($label, 'suggest') ||
            str_contains($label, 'what is your') ||
            str_contains($label, 'why')
        ) {
            return 'long_text';
        }

        return 'short_text';
    }

    /**
     * Extract explicit type markers from question text.
     *
     * Supported examples:
     * - "1. (Rating) How satisfied are you?"
     * - "[Multiple Choice] Which session did you attend?"
     * - "Type: Checkbox"
     * - "What should we improve? (Long Text)"
     */
    private static function extractExplicitQuestionType(string $text): array
    {
        $text = trim($text);
        $typePattern = '(rating|multiple[\s_-]*choice|checkbox(?:es)?|short[\s_-]*text|long[\s_-]*text)';

        $patterns = [
            '/^\s*(?:type\s*[:\-–]\s*)?[\(\[\{]\s*'.$typePattern.'\s*[\)\]\}]\s*[:\-–]?\s*(.*)$/i',
            '/^\s*type\s*[:\-–]\s*'.$typePattern.'\s*$/i',
            '/^(.*?)\s*[\(\[\{]\s*'.$typePattern.'\s*[\)\]\}]\s*$/i',
        ];

        foreach ($patterns as $index => $pattern) {
            if (! preg_match($pattern, $text, $matches)) {
                continue;
            }

            if ($index === 2) {
                return [
                    self::normalizeQuestionType((string) $matches[2]),
                    trim((string) $matches[1]),
                ];
            }

            return [
                self::normalizeQuestionType((string) $matches[1]),
                trim((string) ($matches[2] ?? '')),
            ];
        }

        return [null, $text];
    }

    private static function normalizeQuestionType(string $type): ?string
    {
        $normalized = strtolower(trim($type));
        $normalized = str_replace(['-', '_'], ' ', $normalized);
        $normalized = preg_replace('/\s+/', ' ', $normalized) ?: $normalized;

        return match ($normalized) {
            'rating' => 'rating',
            'multiple choice' => 'multiple_choice',
            'checkbox', 'checkboxes' => 'checkbox',
            'short text' => 'short_text',
            'long text' => 'long_text',
            default => null,
        };
    }

    private static function isSupportedQuestionType(string $type): bool
    {
        return in_array($type, ['rating', 'multiple_choice', 'checkbox', 'short_text', 'long_text'], true);
    }
}
