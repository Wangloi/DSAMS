<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Event;
use App\Models\EvaluationResponse;

class Evaluation extends Model
{
    protected $fillable = [
        'name',
        'description',
        'event_id',
        'event',
        'qr_code_path',
        'form_data',
        'is_active',
        'is_archived',
        'published_at',
    ];

    protected $casts = [
        'form_data' => 'array',
        'is_active' => 'boolean',
        'is_archived' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function eventRecord()
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    public function responses()
    {
        return $this->hasMany(EvaluationResponse::class);
    }

    public static function getDefaultFormData(): array
    {
        return [
            'questions' => [
                // Standard 1: THE PRESENTER
                [
                    'id' => 'std1_q1',
                    'section' => 'Standard 1: The Presenter',
                    'section_note' => '1 as the lowest (poor) and 5 as the highest (excellent)',
                    'type' => 'rating',
                    'label' => 'The goals of the presentation were clear',
                    'required' => true,
                ],
                [
                    'id' => 'std1_q2',
                    'section' => 'Standard 1: The Presenter',
                    'section_note' => '1 as the lowest (poor) and 5 as the highest (excellent)',
                    'type' => 'rating',
                    'label' => 'The style of the presentation was organized',
                    'required' => true,
                ],
                [
                    'id' => 'std1_q3',
                    'section' => 'Standard 1: The Presenter',
                    'section_note' => '1 as the lowest (poor) and 5 as the highest (excellent)',
                    'type' => 'rating',
                    'label' => 'The presenter was well prepared',
                    'required' => true,
                ],
                [
                    'id' => 'std1_q4',
                    'section' => 'Standard 1: The Presenter',
                    'section_note' => '1 as the lowest (poor) and 5 as the highest (excellent)',
                    'type' => 'rating',
                    'label' => 'The presenter was engaging & dynamic',
                    'required' => true,
                ],
                [
                    'id' => 'std1_q5',
                    'section' => 'Standard 1: The Presenter',
                    'section_note' => '1 as the lowest (poor) and 5 as the highest (excellent)',
                    'type' => 'rating',
                    'label' => 'I found the presenter easy to interact with',
                    'required' => true,
                ],
                [
                    'id' => 'std1_q6',
                    'section' => 'Standard 1: The Presenter',
                    'section_note' => '1 as the lowest (poor) and 5 as the highest (excellent)',
                    'type' => 'rating',
                    'label' => 'My overall evaluation of the presenter - excellent',
                    'required' => true,
                ],

                // Standard 2: PRESENTATION
                [
                    'id' => 'std2_q1',
                    'section' => 'Standard 2: Presentation',
                    'section_note' => 'Kindly check the corresponding box of your answer.',
                    'type' => 'multiple_choice',
                    'label' => 'Were the objectives of the seminar communicated to you?',
                    'options' => ['YES', 'NO'],
                    'required' => true,
                ],
                [
                    'id' => 'std2_q2',
                    'section' => 'Standard 2: Presentation',
                    'section_note' => 'Kindly check the corresponding box of your answer.',
                    'type' => 'multiple_choice',
                    'label' => 'Did the seminar meet all of its stated objectives?',
                    'options' => ['YES', 'NO'],
                    'required' => true,
                ],
                [
                    'id' => 'std2_q3',
                    'section' => 'Standard 2: Presentation',
                    'section_note' => 'Kindly check the corresponding box of your answer.',
                    'type' => 'multiple_choice',
                    'label' => 'Did the seminar/training address the concerns of your spiritual being?',
                    'options' => ['YES', 'NO'],
                    'required' => true,
                ],
                [
                    'id' => 'std2_q4',
                    'section' => 'Standard 2: Presentation',
                    'section_note' => 'Kindly check the corresponding box of your answer.',
                    'type' => 'multiple_choice',
                    'label' => 'Will the activity help you to improve your whole being?',
                    'options' => ['YES', 'NO'],
                    'required' => true,
                ],

                // Standard 3: About the Seminar/Training
                [
                    'id' => 'std3_q1',
                    'section' => 'Standard 3: About the Seminar/Training',
                    'section_note' => 'Note: You are required to fill in this portion',
                    'type' => 'long_text',
                    'label' => 'What was the best thing about this training?',
                    'required' => true,
                ],
                [
                    'id' => 'std3_q2',
                    'section' => 'Standard 3: About the Seminar/Training',
                    'section_note' => 'Note: You are required to fill in this portion',
                    'type' => 'long_text',
                    'label' => 'What are the specific things you enjoyed LEAST about this presentation?',
                    'required' => true,
                ],
                [
                    'id' => 'std3_q3',
                    'section' => 'Standard 3: About the Seminar/Training',
                    'section_note' => 'Note: You are required to fill in this portion',
                    'type' => 'long_text',
                    'label' => 'List any suggestions you have for improving this presentation',
                    'required' => true,
                ],
            ],
        ];
    }
}
