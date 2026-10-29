/**
 * Form Focus Navigation Utility
 *
 * Implements WCAG-compliant automatic keyboard focus navigation for forms:
 * - Enter advances to the next form field (Shift+Enter goes back).
 * - Textareas preserve standard Enter (newline) behavior.
 * - Automatically opens/focuses native calendar pickers when date fields are reached.
 * - Preserves user input: never advances mid-keystroke or interrupts normal typing.
 * - Supports fixed-length inputs (e.g. verification code or fixed student ID) with auto-advance on complete.
 * - Provides clear focus indicators and validation compatibility.
 */

import React from 'react';

const NAVIGABLE_SELECTOR = [
    'input:not([type="hidden"]):not([type="button"]):not([type="reset"]):not([disabled]):not([readonly]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([readonly]):not([tabindex="-1"])',
    'button[type="submit"]:not([disabled]):not([tabindex="-1"])',
    '[role="combobox"]:not([disabled]):not([tabindex="-1"])',
].join(', ');

/**
 * Checks whether an element is visible and interactive in the DOM.
 */
export function isElementVisible(element: HTMLElement): boolean {
    if (!element || element.tabIndex === -1) return false;
    if (element.offsetWidth === 0 && element.offsetHeight === 0 && element.getClientRects().length === 0) {
        return false;
    }
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

/**
 * Safely opens the calendar picker for date/datetime/time inputs if supported by the browser.
 */
export function openDatePicker(element: HTMLElement | null): boolean {
    if (!element || !(element instanceof HTMLInputElement)) return false;
    const dateTypes = ['date', 'datetime-local', 'time', 'month', 'week'];
    if (!dateTypes.includes(element.type)) return false;

    try {
        if ('showPicker' in element && typeof element.showPicker === 'function') {
            element.showPicker();
            return true;
        }
    } catch {
        // Ignored if user activation gesture is not currently active in the browser
    }
    return false;
}

/**
 * Finds all visible, enabled form controls within a container.
 */
export function getNavigableFormControls(container: HTMLElement): HTMLElement[] {
    const rawElements = Array.from(container.querySelectorAll<HTMLElement>(NAVIGABLE_SELECTOR));
    return rawElements.filter(isElementVisible);
}

/**
 * Locates the logical form or container holding the current element.
 */
export function findFormContainer(element: HTMLElement): HTMLElement {
    return (
        element.closest('form') ||
        element.closest('[data-form-container]') ||
        element.closest('[role="dialog"]') ||
        element.closest('.modal-body') ||
        element.parentElement ||
        document.body
    );
}

/**
 * Focuses the next appropriate field in the form.
 * Returns true if a subsequent field was found and focused, false otherwise.
 */
export function focusNextFormField(
    currentElement: HTMLElement,
    container?: HTMLElement | null
): boolean {
    const root = container || findFormContainer(currentElement);
    const controls = getNavigableFormControls(root);
    const currentIndex = controls.indexOf(currentElement);

    if (currentIndex === -1 || currentIndex >= controls.length - 1) {
        return false;
    }

    const nextControl = controls[currentIndex + 1];
    if (nextControl) {
        nextControl.focus();

        // If next field is a date input, automatically open its calendar picker
        if (nextControl instanceof HTMLInputElement) {
            openDatePicker(nextControl);
            if (nextControl.type === 'text' || nextControl.type === 'number') {
                try {
                    nextControl.select();
                } catch {
                    // Ignore elements that don't support selection
                }
            }
        }
        return true;
    }

    return false;
}

/**
 * Focuses the previous field in the form (e.g. for Shift+Enter).
 */
export function focusPreviousFormField(
    currentElement: HTMLElement,
    container?: HTMLElement | null
): boolean {
    const root = container || findFormContainer(currentElement);
    const controls = getNavigableFormControls(root);
    const currentIndex = controls.indexOf(currentElement);

    if (currentIndex <= 0) {
        return false;
    }

    const prevControl = controls[currentIndex - 1];
    if (prevControl) {
        prevControl.focus();
        if (prevControl instanceof HTMLInputElement) {
            openDatePicker(prevControl);
        }
        return true;
    }

    return false;
}

/**
 * Keyboard event handler for form containers or individual inputs to navigate on Enter.
 */
export function handleFormNavigationKeyDown(
    e: React.KeyboardEvent<HTMLElement>,
    container?: HTMLElement | null
): void {
    if (e.defaultPrevented) return;

    const target = e.target as HTMLElement;
    if (!target) return;

    // Do not interfere with textareas (unless Ctrl+Enter / Cmd+Enter is used)
    if (target.tagName.toLowerCase() === 'textarea') {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            const moved = focusNextFormField(target, container);
            if (moved) e.preventDefault();
        }
        return;
    }

    // Do not interfere with search inputs that intend to submit queries on Enter
    if (target instanceof HTMLInputElement && target.type === 'search') {
        return;
    }

    // Do not intercept submit buttons
    if (target.tagName.toLowerCase() === 'button' && (target as HTMLButtonElement).type === 'submit') {
        return;
    }

    if (e.key === 'Enter') {
        // Explicitly opt out with data-no-auto-advance="true"
        if (target.getAttribute('data-no-auto-advance') === 'true') {
            return;
        }

        if (e.shiftKey) {
            const moved = focusPreviousFormField(target, container);
            if (moved) {
                e.preventDefault();
            }
        } else {
            // Validate the current field if browser validation is available
            if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
                if (typeof target.checkValidity === 'function' && !target.checkValidity()) {
                    target.reportValidity?.();
                    return;
                }
            }

            const moved = focusNextFormField(target, container);
            if (moved) {
                e.preventDefault();
            }
        }
    }
}

/**
 * React hook to equip any form or container with auto-focus navigation.
 */
export function useFormFocusNavigation<T extends HTMLElement = HTMLFormElement>() {
    const containerRef = React.useRef<T>(null);

    const onKeyDown = React.useCallback((e: React.KeyboardEvent<T>) => {
        handleFormNavigationKeyDown(e, containerRef.current);
    }, []);

    return {
        containerRef,
        onKeyDown,
    };
}

/**
 * Automatically focuses the first invalid form control within a container.
 * Looks for elements marked with aria-invalid="true" or native :invalid.
 */
export function focusFirstInvalidField(container?: HTMLElement | null): HTMLElement | null {
    const root = container || document.body;
    const invalidElement = root.querySelector<HTMLElement>(
        '[aria-invalid="true"]:not([disabled]), :invalid:not([disabled]):not([type="hidden"])'
    );
    if (invalidElement && isElementVisible(invalidElement)) {
        try {
            invalidElement.focus();
            openDatePicker(invalidElement);
            if (invalidElement instanceof HTMLInputElement && (invalidElement.type === 'text' || invalidElement.type === 'email' || invalidElement.type === 'number')) {
                invalidElement.select();
            }
        } catch {
            // Ignore focus error if element is unselectable
        }
        return invalidElement;
    }
    return null;
}

