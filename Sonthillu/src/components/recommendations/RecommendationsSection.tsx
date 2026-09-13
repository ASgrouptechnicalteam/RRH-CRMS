'use client';

import { useEffect } from 'react';
import { PropertyCard } from '@/components/search/PropertyCard';
import type { RecommendationGroup } from '@/lib/recommendations/types';
import { GROUP_LABELS } from '@/lib/recommendations/types';
import {
  trackRecommendationEvent,
  buildRecommendationEvent,
} from '@/lib/recommendations/analytics';
import type { RecommendationSurface } from '@/lib/recommendations/analytics';
import { trackClientActivity } from '@/lib/analytics/activity';

interface RecommendationsSectionProps {
  groups: RecommendationGroup[];
  surface: RecommendationSurface;
}

/**
 * Presentational section for the Search Recommendation Engine (Packet 7).
 * Renders one clearly-labeled group at a time and fires the documented
 * recommendation_impression analytics events on mount (client only).
 */
export function RecommendationsSection({ groups, surface }: RecommendationsSectionProps) {
  useEffect(() => {
    for (const group of groups) {
      for (const item of group.items) {
        trackRecommendationEvent(
          buildRecommendationEvent('recommendation_impression', {
            propertyId: item.property.id,
            groupType: group.type,
            rankWithinGroup: item.rankWithinGroup,
            surface,
          })
        );
        trackClientActivity({
          eventName: 'recommendation_impression',
          propertyId: item.property.id,
          metadata: { groupType: group.type, rankWithinGroup: item.rankWithinGroup, surface },
        });
      }
    }
    // Fire once per rendered result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  if (!groups || groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-10">
      {groups.map((group) => {
        const labels = GROUP_LABELS[group.type];
        return (
          <section key={group.type} aria-labelledby={`rec-${group.type}`}>
            <h2
              id={`rec-${group.type}`}
              className="text-xl font-semibold text-brand-navy"
              style={{ fontFamily: 'var(--font-family-display)' }}
            >
              {labels.title}
            </h2>
            <p className="mt-1 mb-4 text-sm text-text-secondary">{labels.description}</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <div key={item.property.id} className="relative">
                  <PropertyCard
                    property={item.property}
                    variant="recommendation"
                    onRecommendationClick={() => {
                      trackRecommendationEvent(
                        buildRecommendationEvent('recommendation_click', {
                          propertyId: item.property.id,
                          groupType: group.type,
                          rankWithinGroup: item.rankWithinGroup,
                          surface,
                        })
                      );
                      trackClientActivity({
                        eventName: 'recommendation_click',
                        propertyId: item.property.id,
                        metadata: {
                          groupType: group.type,
                          rankWithinGroup: item.rankWithinGroup,
                          surface,
                        },
                      });
                    }}
                  />
                  {item.reasons.length > 0 && (
                    <p className="mt-2 text-xs font-medium text-brand-navy line-clamp-2">
                      {item.reasons[0]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
