import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/ui/Button';
import { Card } from '../common/ui/Card';
import { getRoleTour, TourStep } from './tourDefinitions';
import { getElementRect, scrollToTarget, waitForElement, TourRect } from './tourUtils';

const TOUR_VERSION = 'v1';

export const ProductTour: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isVisible, setIsVisible] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TourRect | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize tour state
  useEffect(() => {
    if (!user) return;
    
    // Check if user has completed or skipped the tour
    const storageKey = `rrh_crms_product_tour_${TOUR_VERSION}:${user.id}`;
    const state = localStorage.getItem(storageKey);
    
    if (state !== 'completed' && state !== 'skipped') {
      setIsVisible(true);
    }
  }, [user]);

  // Handle global event to restart tour
  useEffect(() => {
    const handleRestart = () => {
      setCurrentStepIndex(0);
      setIsVisible(true);
      if (user) {
        localStorage.removeItem(`rrh_crms_product_tour_${TOUR_VERSION}:${user.id}`);
      }
    };
    window.addEventListener('restart-product-tour', handleRestart);
    return () => window.removeEventListener('restart-product-tour', handleRestart);
  }, [user]);

  const steps = useMemo(() => {
    if (!user || !user.roles) return [];
    return getRoleTour(user.roles);
  }, [user]);

  const currentStep = steps[currentStepIndex];

  const handleSkipOrFinish = useCallback((status: 'skipped' | 'completed') => {
    setIsVisible(false);
    if (user?.id) {
      localStorage.setItem(`rrh_crms_product_tour_${TOUR_VERSION}:${user.id}`, status);
    }
  }, [user]);

  // Navigate and find target
  useEffect(() => {
    if (!isVisible || !currentStep) return;

    let isActive = true;

    const findTarget = async () => {
      setIsSearching(true);
      setTargetRect(null);

      // Navigate if route is different
      if (currentStep.route && location.pathname !== currentStep.route) {
        navigate(currentStep.route);
        // Wait for route change to take effect
        await new Promise(r => setTimeout(r, 300));
      }

      const el = await waitForElement(currentStep.target, 2000);
      
      if (!isActive) return;

      if (el) {
        scrollToTarget(currentStep.target);
        // Small delay after scroll to calculate rect accurately
        setTimeout(() => {
          if (isActive) {
            setTargetRect(getElementRect(currentStep.target));
            setIsSearching(false);
          }
        }, 300);
      } else {
        // Target missing - safely skip to next step
        setIsSearching(false);
        console.warn(`Tour Target Missing: ${currentStep.target}. Skipping step.`);
        
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          handleSkipOrFinish('completed'); // Was the last step
        }
      }
    };

    findTarget();

    return () => { isActive = false; };
  }, [currentStepIndex, isVisible, currentStep, location.pathname, navigate, steps.length, handleSkipOrFinish]);

  // Window resize handler
  useEffect(() => {
    if (!isVisible || !currentStep || isSearching) return;
    
    const handleResize = () => {
      setTargetRect(getElementRect(currentStep.target));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [isVisible, currentStep, isSearching]);

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkipOrFinish('skipped');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleSkipOrFinish]);

  if (!isVisible || !currentStep || !user || steps.length === 0) {
    return null;
  }

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) setCurrentStepIndex(prev => prev + 1);
  };

  const handleBack = () => {
    if (!isFirstStep) setCurrentStepIndex(prev => prev - 1);
  };

  // Determine Tooltip Placement
  let tooltipStyle: React.CSSProperties = { opacity: targetRect && !isSearching ? 1 : 0, transition: 'opacity 0.2s' };
  
  if (targetRect) {
    const spaceRight = window.innerWidth - (targetRect.left + targetRect.width);
    const spaceBottom = window.innerHeight - (targetRect.top + targetRect.height);
    
    const placement = currentStep.placement || 
      (spaceRight > 350 ? 'right' : (spaceBottom > 250 ? 'bottom' : 'left'));

    // Mobile specific: center at bottom
    if (window.innerWidth < 768) {
      tooltipStyle = {
        ...tooltipStyle,
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        zIndex: 10000,
      };
    } else {
      tooltipStyle = {
        ...tooltipStyle,
        position: 'absolute',
        zIndex: 10000,
      };

      if (placement === 'right') {
        tooltipStyle.top = Math.max(20, targetRect.top);
        tooltipStyle.left = targetRect.left + targetRect.width + 16;
      } else if (placement === 'left') {
        tooltipStyle.top = Math.max(20, targetRect.top);
        tooltipStyle.left = targetRect.left - 340 - 16;
        if (tooltipStyle.left < 20) {
          tooltipStyle.left = 20; // fallback if runs off screen
        }
      } else if (placement === 'bottom') {
        tooltipStyle.top = targetRect.top + targetRect.height + 16;
        tooltipStyle.left = Math.max(20, targetRect.left);
      } else {
        // top
        tooltipStyle.top = targetRect.top - 200 - 16;
        tooltipStyle.left = Math.max(20, targetRect.left);
      }
    }
  } else {
    // Fallback centered
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10000,
      ...tooltipStyle
    };
  }

  return (
    <>
      {/* Dimmed Overlay */}
      <div 
        className="fixed inset-0 z-[9000] bg-slate-900/40 backdrop-blur-[1px] transition-opacity duration-300 pointer-events-auto"
        onClick={() => handleSkipOrFinish('skipped')}
      />

      {/* Spotlight Cutout */}
      {targetRect && !isSearching && (
        <div 
          className="fixed z-[9500] pointer-events-none rounded-md ring-4 ring-navy-500/50 shadow-[0_0_0_9999px_rgba(15,23,42,0.4)] transition-all duration-300 ease-in-out"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Tooltip Card */}
      <div style={tooltipStyle} className="w-full max-w-[340px]">
        <Card className="shadow-2xl border-0 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-navy-600"></div>
          <Card.Header title={currentStep.title} />
          <Card.Content>
            <p className="text-slate-600 text-sm leading-relaxed">
              {currentStep.description}
            </p>
          </Card.Content>
          <Card.Footer className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 pb-4 bg-slate-50/80 border-t border-slate-100">
            <div className="text-xs font-medium text-slate-400">
              {currentStepIndex + 1} / {steps.length}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {!isFirstStep && (
                <Button variant="secondary" size="sm" onClick={handleBack} disabled={isSearching}>
                  Back
                </Button>
              )}
              {isLastStep ? (
                <Button variant="primary" size="sm" onClick={() => handleSkipOrFinish('completed')} disabled={isSearching}>
                  Finish
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={handleNext} disabled={isSearching}>
                  Next
                </Button>
              )}
            </div>
          </Card.Footer>
        </Card>
        
        {/* Skip action below card */}
        <div className="text-center mt-2">
          <button 
            onClick={() => handleSkipOrFinish('skipped')}
            className="text-xs text-white/70 hover:text-white font-medium hover:underline px-2 py-1"
          >
            Skip Tour (Esc)
          </button>
        </div>
      </div>
    </>
  );
};
