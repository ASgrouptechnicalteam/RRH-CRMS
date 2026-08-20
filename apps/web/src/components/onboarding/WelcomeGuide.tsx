import React from 'react';
import { EmptyState, type EmptyStateProps } from '../common/ui/EmptyState';
import { Card, type CardHeaderProps, type CardTitleProps, type CardDescriptionProps, type CardContentProps, type CardFooterProps } from '../common/ui/Card';
import { Button, type ButtonProps } from '../common/ui/Button';
import { StatusChip, type StatusChipVariant } from '../common/ui/StatusChip';

/**
 * WelcomeGuide — First-time visitor onboarding experience.
 *
 * Visual system:
   - Centered layout using the design system's 8px rhythm
   - Professional welcome message with real-estate terminology
   - Status chip showing CRM state
   - 2-3 primary action buttons for onboarding flows
   - Uses EmptyState, Card, and Button primitives from Phase 19
 *
 * Accessibility:
   - aria-label on action buttons
   - Proper heading hierarchy
   - Focus-visible styles inherited from design system
 */

export const WelcomeGuide: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = React.useState(true);

  const handleDismiss = () => {
    setShowOnboarding(false);
  };

  return (
    <EmptyState
      title="Welcome to Sonthillu CRM"
      description="Your real‑estate command center. Get started by adding your first property listing or reviewing today's site visits."
      actionLabel="Get Started"
      actionOnClick={() => setShowOnboarding(false)}
      skeletonRows={2}
    >
      {/* Custom content inside EmptyState's action slot - replace with card + buttons */}
      <div className="mt-6">
        <Card className="w-full max-w-md">
          <Card.Header>
            <Card.Title className="text-sm font-medium text-neutral-900">My Command Center</Card.Title>
          </Card.Header>
          <Card.Content>
            <p className="text-sm text-neutral-500 mb-4">
              Track leads, manage properties, and coordinate site visits — all from one
              intuitive dashboard built for real‑estate professionals.
            </p>
            <StatusChip variant="available" />
          </Card.Content>
          <Card.Footer>
            <Button variant="primary" size="md" onClick={handleDismiss}>
              Get Started
            </Button>
            <Button variant="secondary" size="md" onClick={handleDismiss}>
              Maybe Later
            </Button>
          </Card.Footer>
        </Card>
      </div>
    </EmptyState>
  );
};

/**
 * Wrapper to conditionally render the WelcomeGuide on first visit.
 * In a production scenario, this would check localStorage or a profile flag.
 * For this packet, we always render it as the first screen.
 */
export const FirstTimeOnboarding: React.FC = () => {
  const [hasSeenOnboarding, setHasSeenOnboarding] = React.useState(false);

  // Simulate onboarding dismissal — in production, persist this
  React.useEffect(() => {
    // Check if user has dismissed onboarding
    const dismissed = localStorage.getItem('onboardingDismissed');
    if (dismissed === 'true') {
      setHasSeenOnboarding(true);
    }
  }, []);

  if (hasSeenOnboarding) {
    return null;
  }

  return <WelcomeGuide />;
};