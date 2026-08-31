export function toUserFacingError(input: {
  status?: number;
  error?: string;
  message?: string;
  body?: any;
}): { title: string; message: string; nextStep?: string } {
  // Extract a text string to search
  const textToSearch = [
    input.error,
    input.message,
    input.body?.error,
    input.body?.message,
    typeof input.body === 'string' ? input.body : ''
  ].filter(Boolean).join(' ').toLowerCase();

  // 1. Network / Fetch failures
  if (!input.status && (textToSearch.includes('failed to fetch') || textToSearch.includes('network'))) {
    return {
      title: 'Connection Error',
      message: 'Unable to reach the server. Your internet connection may be unstable.',
      nextStep: 'Please check your connection and try again.'
    };
  }

  // 2. HTTP Status based fallbacks
  if (input.status === 403) {
    return {
      title: 'Access Denied',
      message: 'You do not have the required permissions to perform this action or edit this record.',
      nextStep: 'Contact your manager if you believe you need access.'
    };
  }
  if (input.status === 404) {
    return {
      title: 'Not Found',
      message: 'The requested record could not be found, or it belongs to a different company.',
      nextStep: 'Refresh the page to see the latest data.'
    };
  }

  // 3. CONTACTED / CALL_LOGGED rules
  if (textToSearch.includes('call_logged') || (textToSearch.includes('contacted') && textToSearch.includes('call'))) {
    return {
      title: 'Cannot Mark Contacted',
      message: 'You must log a call or a WhatsApp message with this lead before changing their status to Contacted.',
      nextStep: 'Please click the "Call" button to log an interaction first.'
    };
  }

  // 4. QUALIFIED rules
  if (
    textToSearch.includes('qualified') ||
    textToSearch.includes('qualification') ||
    textToSearch.includes('budget') ||
    textToSearch.includes('property_type') ||
    textToSearch.includes('preferred_location')
  ) {
    return {
      title: 'Incomplete Qualification',
      message: 'A lead cannot be marked as Qualified without providing their budget, preferred location, and property type.',
      nextStep: 'Please open the Qualification Form and fill out all required fields.'
    };
  }

  // 5. SITE_VISIT prerequisites
  if (textToSearch.includes('site_visit') && (textToSearch.includes('schedule') || textToSearch.includes('prerequisite'))) {
    return {
      title: 'Cannot Schedule Visit',
      message: 'The lead is not in the correct status to schedule a site visit.',
      nextStep: 'Ensure the lead has been contacted and qualified first.'
    };
  }

  // 6. Invalid transition
  if (textToSearch.includes('invalid transition') || textToSearch.includes('not allowed') || textToSearch.includes('invalid status')) {
    return {
      title: 'Invalid Status Change',
      message: 'The lead cannot be moved to this status from their current state.',
      nextStep: 'Please review the lead\'s timeline or refresh the page to see their current status.'
    };
  }

  // Fallback
  const rawMessage = input.message || input.error || input.body?.message || input.body?.error || 'An unexpected error occurred.';
  return {
    title: 'Action Failed',
    message: rawMessage,
    nextStep: 'Review the form or open the record and try again.'
  };
}
