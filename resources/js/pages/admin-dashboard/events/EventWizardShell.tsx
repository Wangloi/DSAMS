import type { ReactNode } from 'react';

type WizardStep = 1 | 2 | 3;

type Props = {
    title: string;
    description: string;
    open: boolean;
    onClose: () => void;
    currentStep: WizardStep;
    onStepChange?: (step: WizardStep) => void;
    canGoBack: boolean;
    canGoNext: boolean;
    nextLabel?: string;
    backLabel?: string;
    submitLabel?: string;
    onBack?: () => void;
    onNext?: () => void;
    onSubmit?: () => void;
    children: ReactNode;
    footerLeft?: ReactNode;
};

export default function EventWizardShell({
    title,
    description,
    open,
    onClose,
    currentStep,
    canGoBack,
    canGoNext,
    nextLabel = 'Next',
    backLabel = 'Back',
    submitLabel,
    onBack,
    onNext,
    onSubmit,
    children,
    footerLeft,
}: Props) {
    // Note: This shell intentionally does not import the UI kit to avoid coupling.
    // The existing Create/Edit/View modals already use specific shadcn/ui components.
    // This file is a stub shell and should be wrapped by each modal’s existing Dialog implementation.
    //
    // In practice we will not use this stub shell directly yet.
    // It exists only to reserve a location for the shared design.

    void open;
    void onClose;
    void canGoNext;
    void canGoBack;
    void nextLabel;
    void backLabel;
    void submitLabel;
    void onBack;
    void onNext;
    void onSubmit;
    void currentStep;
    void children;
    void footerLeft;

    return null;
}
