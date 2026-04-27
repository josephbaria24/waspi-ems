import React, { useState, Children, useRef, useLayoutEffect, HTMLAttributes, ReactNode } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  initialStep?: number;
  value?: number;
  onValueChange?: (step: number) => void;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  onBeforeNext?: (currentStep: number) => boolean | Promise<boolean>;
  onBeforeBack?: (currentStep: number) => boolean | Promise<boolean>;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  backButtonText?: string;
  nextButtonText?: string;
  disableStepIndicators?: boolean;
  renderStepIndicator?: (props: {
    step: number;
    currentStep: number;
    onStepClick: (clicked: number) => void;
  }) => ReactNode;
}

export default function Stepper({
  children,
  initialStep = 1,
  value,
  onValueChange,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  onBeforeNext,
  onBeforeBack,
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  disableStepIndicators = false,
  renderStepIndicator,
  ...rest
}: StepperProps) {
  const [internalStep, setInternalStep] = useState<number>(initialStep);
  const currentStep = value !== undefined ? value : internalStep;
  const [direction, setDirection] = useState<number>(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;
  
  const updateStep = (newStep: number) => {
    if (onValueChange) {
      onValueChange(newStep);
    } else {
      setInternalStep(newStep);
    }
    
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = async () => {
    if (currentStep > 1) {
      if (onBeforeBack) {
        const canMove = await onBeforeBack(currentStep);
        if (!canMove) return;
      }
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = async () => {
    if (!isLastStep) {
      if (onBeforeNext) {
        const canMove = await onBeforeNext(currentStep);
        if (!canMove) return;
      }
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    if (onBeforeNext) {
      const canMove = await onBeforeNext(currentStep);
      if (!canMove) return;
    }
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div
      className="w-full"
      {...rest}
    >
      <div
        className={`mx-auto w-full ${stepCircleContainerClassName}`}
      >
        {/* Step Indicators Header */}
        <div className={`${stepContainerClassName} flex w-full items-center px-8 py-6 border-b border-gray-100 bg-gray-50/50`}>
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: async clicked => {
                      if (clicked > currentStep && onBeforeNext) {
                        const canMove = await onBeforeNext(currentStep);
                        if (!canMove) return;
                      }
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={async clicked => {
                      if (clicked > currentStep && onBeforeNext) {
                        const canMove = await onBeforeNext(currentStep);
                        if (!canMove) return;
                      }
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }}
                  />
                )}
                {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="relative">
          <StepContentWrapper
            isCompleted={isCompleted}
            currentStep={currentStep}
            direction={direction}
            className={`px-8 pt-8 pb-4 ${contentClassName}`}
          >
            {stepsArray[currentStep - 1]}
          </StepContentWrapper>
        </div>

        {/* Step Footer (Buttons) */}
        {!isCompleted && (
          <div className={`px-8 pb-8 pt-6 ${footerClassName}`}>
            <div className={`flex ${currentStep !== 1 ? 'justify-between' : 'justify-end'} items-center`}>
              {currentStep !== 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className={`text-sm font-semibold transition-colors flex items-center gap-2 ${
                    currentStep === 1
                      ? 'pointer-events-none opacity-0'
                      : 'text-gray-400 hover:text-emerald-600'
                  }`}
                  {...backButtonProps}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  {backButtonText}
                </button>
              )}
              <button
                type="button"
                onClick={isLastStep ? handleComplete : handleNext}
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-10 py-3 text-sm font-bold shadow-lg shadow-emerald-100 transition-all hover:shadow-xl hover:shadow-emerald-200 active:scale-[0.98]"
                {...nextButtonProps}
              >
                {isLastStep ? 'Complete Registration' : nextButtonText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StepContentWrapperProps {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: ReactNode;
  className?: string;
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = ''
}: StepContentWrapperProps) {
  const [parentHeight, setParentHeight] = useState<number>(0);

  return (
    <motion.div
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: 'spring', duration: 0.4 }}
      className={className}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction} onHeightReady={h => setParentHeight(h)}>
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface SlideTransitionProps {
  children: ReactNode;
  direction: number;
  onHeightReady: (height: number) => void;
}

function SlideTransition({ children, direction, onHeightReady }: SlideTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      onHeightReady(containerRef.current.offsetHeight);
    }
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4 }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  );
}

const stepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? '-100%' : '100%',
    opacity: 0
  }),
  center: {
    x: '0%',
    opacity: 1
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? '50%' : '-50%',
    opacity: 0
  })
};

interface StepProps {
  children: ReactNode;
}

export function Step({ children }: StepProps) {
  return <div className="px-8">{children}</div>;
}

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  onClickStep: (clicked: number) => void;
  disableStepIndicators?: boolean;
}

function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators = false }: StepIndicatorProps) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete';

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step);
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      className={`relative outline-none focus:outline-none ${disableStepIndicators ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: { scale: 1, backgroundColor: '#f3f4f6', color: '#9ca3af' },
          active: { scale: 1, backgroundColor: '#16a35c', color: '#16a35c' },
          complete: { scale: 1, backgroundColor: '#16a35c', color: '#16a35c' }
        }}
        transition={{ duration: 0.3 }}
        className="flex h-8 w-8 items-center justify-center rounded-full font-semibold border-2 border-transparent"
      >
        {status === 'complete' ? (
          <CheckIcon className="h-4 w-4 text-white" />
        ) : status === 'active' ? (
          <div className="h-2.5 w-2.5 rounded-full bg-white" />
        ) : (
          <span className="text-sm">{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

interface StepConnectorProps {
  isComplete: boolean;
}

function StepConnector({ isComplete }: StepConnectorProps) {
  const lineVariants: Variants = {
    incomplete: { width: 0, backgroundColor: 'transparent' },
    complete: { width: '100%', backgroundColor: '#16a35c' }
  };

  return (
    <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded bg-gray-200">
      <motion.div
        className="absolute left-0 top-0 h-full"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? 'complete' : 'incomplete'}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}

interface CheckIconProps extends React.SVGProps<SVGSVGElement> {}

function CheckIcon(props: CheckIconProps) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.1,
          type: 'tween',
          ease: 'easeOut',
          duration: 0.3
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
