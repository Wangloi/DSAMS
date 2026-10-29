import { useState, useCallback } from 'react';
import { focusFirstInvalidField } from '@/lib/formFocusNavigation';

export interface ValidationRule {
    required?: boolean;
    label?: string;
    validate?: (val: any) => string | undefined;
    message?: string;
}

export type ValidationRules<T extends Record<string, any>> = {
    [K in keyof T]?: ValidationRule;
};

/**
 * Reusable Form Validation Hook for DSAMS.
 * 
 * Satisfies all requirements:
 * 1. Tracks touched state: no errors shown on initial open.
 * 2. Field-level validation on blur: shows clear field-specific message when left empty or invalid.
 * 3. Clearing on correction: clears error when valid input is typed.
 * 4. Submit-level validation: marks all fields touched and blocks submission if invalid.
 * 5. Automatic focus: automatically focuses the first invalid element upon failed submission.
 * 6. Server error integration: seamlessly combines frontend validation with Laravel server errors.
 */
export function useFormValidation<T extends Record<string, any>>(
    rules: ValidationRules<T>,
    serverErrors: Record<string, any> = {}
) {
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const validateFieldValue = useCallback(
        (field: keyof T, value: any): string | undefined => {
            const rule = rules[field];
            if (!rule) return undefined;

            const label = rule.label || String(field);

            // Required check
            if (rule.required) {
                const isEmpty =
                    value === undefined ||
                    value === null ||
                    (typeof value === 'string' && value.trim() === '') ||
                    (Array.isArray(value) && value.length === 0) ||
                    (typeof value === 'boolean' && !value);

                if (isEmpty) {
                    return rule.message || `Please enter ${label.toLowerCase()}.`;
                }
            }

            // Custom validation rule
            if (rule.validate) {
                return rule.validate(value);
            }

            return undefined;
        },
        [rules]
    );

    const handleBlur = useCallback(
        (field: keyof T, value: any) => {
            setTouched((prev) => ({ ...prev, [field]: true }));
            const error = validateFieldValue(field, value);
            setClientErrors((prev) => {
                const next = { ...prev };
                if (error) {
                    next[field as string] = error;
                } else {
                    delete next[field as string];
                }
                return next;
            });
        },
        [validateFieldValue]
    );

    const handleChange = useCallback(
        (field: keyof T, value: any) => {
            // If the field has already been touched or has an error, validate as user types
            if (touched[field as string] || clientErrors[field as string] || serverErrors[field as string]) {
                const error = validateFieldValue(field, value);
                setClientErrors((prev) => {
                    const next = { ...prev };
                    if (error) {
                        next[field as string] = error;
                    } else {
                        delete next[field as string];
                    }
                    return next;
                });
            }
        },
        [touched, clientErrors, serverErrors, validateFieldValue]
    );

    const validateAll = useCallback(
        (data: T, formContainer?: HTMLElement | null): boolean => {
            const newTouched: Record<string, boolean> = {};
            const newErrors: Record<string, string> = {};
            let hasError = false;

            for (const key of Object.keys(rules) as (keyof T)[]) {
                newTouched[key as string] = true;
                const err = validateFieldValue(key, data[key]);
                if (err) {
                    newErrors[key as string] = err;
                    hasError = true;
                }
            }

            setTouched((prev) => ({ ...prev, ...newTouched }));
            setClientErrors(newErrors);

            if (hasError) {
                // Focus the first invalid field after re-render
                setTimeout(() => {
                    focusFirstInvalidField(formContainer);
                }, 50);
                return false;
            }

            return true;
        },
        [rules, validateFieldValue]
    );

    const getFieldError = useCallback(
        (field: keyof T): string | undefined => {
            const fieldStr = field as string;
            // Return client error if touched, or fallback to server error
            if (touched[fieldStr] && clientErrors[fieldStr]) {
                return clientErrors[fieldStr];
            }
            if (serverErrors[fieldStr]) {
                const serverErr = serverErrors[fieldStr];
                return Array.isArray(serverErr) ? serverErr[0] : String(serverErr);
            }
            return undefined;
        },
        [touched, clientErrors, serverErrors]
    );

    const resetValidation = useCallback(() => {
        setTouched({});
        setClientErrors({});
    }, []);

    return {
        touched,
        clientErrors,
        handleBlur,
        handleChange,
        validateAll,
        getFieldError,
        resetValidation,
    };
}
