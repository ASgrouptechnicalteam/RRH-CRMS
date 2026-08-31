export function extractRawMessage(body: any): string {
  if (!body) return '';
  if (typeof body === 'string') return body;
  
  if (typeof body.message === 'string' && body.message) return body.message;
  if (typeof body.error === 'string' && body.error) return body.error;
  if (body.error && typeof body.error.message === 'string' && body.error.message) return body.error.message;
  
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    if (typeof body.errors[0] === 'string') return body.errors.join('; ');
    if (body.errors[0] && typeof body.errors[0].message === 'string') {
      return body.errors.map((e: any) => e.message).join('; ');
    }
  }
  
  if (typeof body.reason === 'string' && body.reason) return body.reason;
  if (typeof body.detail === 'string' && body.detail) return body.detail;
  
  return '';
}

export function toUserFacingError(input: {
  status?: number;
  error?: string;
  message?: string;
  body?: any;
}): { title: string; message: string; nextStep?: string } {
  const rawMsg = extractRawMessage(input.body) || input.message || input.error || '';
  const textToSearch = [
    input.error,
    input.message,
    input.body?.error,
    input.body?.message,
    typeof input.body === 'string' ? input.body : ''
  ].filter(Boolean).join(' ').toLowerCase();

  // 1. Network / Fetch failures
  if (!input.status && (textToSearch.includes('failed to fetch') || textToSearch.includes('network'))) {
    return { title: 'Connection Error', message: rawMsg || 'Unable to reach the server. Your internet connection may be unstable.', nextStep: 'Please check your connection and try again.' };
  }

  // 2. Lead workflow SPECIFIC
  if (textToSearch.includes('call_logged') || (textToSearch.includes('contacted') && textToSearch.includes('call')) || textToSearch.includes('requires a call')) {
    return { title: 'Cannot mark as Contacted', message: 'You need to log a call with this lead before marking them as Contacted.', nextStep: 'Tap Call, complete the call log, then use Update Status again.' };
  }
  if (textToSearch.includes('lead') && (textToSearch.includes('invalid transition') || textToSearch.includes('cannot be moved') || (textToSearch.includes('from') && textToSearch.includes('to')))) {
    return { title: 'This status change is not allowed', message: rawMsg || 'The lead cannot move to that status from its current status.', nextStep: 'Open the lead, check current status, and only choose an allowed next step.' };
  }
  if (textToSearch.includes('qualification fields') || (textToSearch.includes('qualified') && textToSearch.includes('requires all'))) {
    return { title: 'Qualification incomplete', message: 'Budget (min and max), property type, and preferred location are required before marking Qualified.', nextStep: 'Open Qualification, fill all fields, then save.' };
  }
  if (textToSearch.includes('assign') && textToSearch.includes('lead')) {
    return { title: 'Cannot assign lead', message: rawMsg || 'You are not allowed to assign this lead or the selected user is invalid.', nextStep: 'Pick a valid team member or ask your manager.' };
  }

  // 3. Site visit
  if (textToSearch.includes('sitevisitbooking') || textToSearch.includes('site visit booking')) {
    return { title: 'Cannot set site visit status yet', message: 'A site visit booking must exist for this lead before status can be Site Visit Scheduled.', nextStep: 'Book a site visit from Site Visits (property + date/time), then status can update.' };
  }
  if (textToSearch.includes('site_visit') || textToSearch.includes('visit')) {
    if (textToSearch.includes('assign')) return { title: 'Site visit not assigned', message: 'This visit needs a sales agent assigned before that action.', nextStep: 'Assign an agent, then try again.' };
    if (textToSearch.includes('schedule') || textToSearch.includes('prerequisite')) return { title: 'Cannot schedule site visit', message: 'The lead is not ready for a site visit yet (e.g. not qualified or missing details).', nextStep: 'Complete qualification and required steps on the lead first.' };
    if (textToSearch.includes('invalid transition') || textToSearch.includes('status')) return { title: 'This visit update is not allowed', message: 'That action is not valid for the visit\'s current status.', nextStep: 'Refresh the visit and follow the allowed steps.' };
  }

  // 4. Property workflow
  if (textToSearch.includes('verify') || textToSearch.includes('order') || textToSearch.includes('polish') || textToSearch.includes('approve out of order')) {
    return { title: 'Property step out of order', message: 'This property must complete earlier approval steps before that action.', nextStep: 'Complete verification/polish in order, then try again.' };
  }
  if (textToSearch.includes('photo') || textToSearch.includes('location') || textToSearch.includes('assets')) {
    return { title: 'Photos or location required', message: 'Add property photos and confirm location before this step.', nextStep: 'Edit the property, upload photos, confirm location, then retry.' };
  }

  // 5. Projects
  if (textToSearch.includes('project') && (textToSearch.includes('delete') || textToSearch.includes('active bookings'))) {
    return { title: 'Cannot delete project', message: 'This project cannot be removed while related records (e.g. bookings) exist.', nextStep: 'Close or move related records first, or contact admin.' };
  }

  // 6. Employees / Roles
  if (textToSearch.includes('role') && (textToSearch.includes('assign') || textToSearch.includes('remove') || textToSearch.includes('permission'))) {
    return { title: 'Cannot change this role', message: 'You are not allowed to assign or remove that role.', nextStep: 'Ask an Admin (or MD where allowed) to make this change.' };
  }
  if (textToSearch.includes('managing director') || textToSearch.includes('md') || textToSearch.includes('last')) {
    return { title: 'Cannot remove the last MD', message: 'The company must keep at least one Managing Director.', nextStep: 'Assign MD to another employee before removing this role.' };
  }

  // 7. Bookings / Payments
  if ((textToSearch.includes('booking') || textToSearch.includes('payment')) && (textToSearch.includes('required') || textToSearch.includes('missing'))) {
    return { title: 'Missing information', message: 'Required payment or booking details are incomplete.', nextStep: 'Fill amount, method, and other required fields, then submit.' };
  }
  if (textToSearch.includes('booking') && (textToSearch.includes('invalid transition') || textToSearch.includes('status'))) {
    return { title: 'This booking update is not allowed', message: 'That action is not valid for the booking\'s current status.', nextStep: 'Refresh and use an allowed action.' };
  }

  // 8. Generic Invalid status transitions
  if (textToSearch.includes('invalid transition') || textToSearch.includes('cannot be moved') || (textToSearch.includes('from') && textToSearch.includes('to'))) {
    return { title: 'This status change is not allowed', message: 'The record cannot move to that status from its current status.', nextStep: 'Open the record, check current status, and only choose an allowed next step.' };
  }

  // 9. Duplicates
  if (textToSearch.includes('duplicate') || textToSearch.includes('already exists') || textToSearch.includes('unique constraint')) {
    if (textToSearch.includes('phone') || textToSearch.includes('mobile') || textToSearch.includes('whatsapp')) {
      return { title: 'Phone number already exists', message: 'This phone number is already registered. Please check the number and try a different one.', nextStep: 'Search for the existing record, or enter a different phone number.' };
    }
    if (textToSearch.includes('email')) {
      return { title: 'Email already exists', message: 'This email is already registered. Please check the email address.', nextStep: 'Use a different email, or open the existing record.' };
    }
    if (textToSearch.includes('employee_code') || textToSearch.includes('employee code') || textToSearch.includes('code already')) {
      return { title: 'Employee code already exists', message: 'This employee code is already in use. Please use a different code.', nextStep: 'Ensure the employee code is unique before saving.' };
    }
    if (textToSearch.includes('lead')) {
      return { title: 'Lead already exists', message: 'A lead with this phone or email already exists. Please check the number or email.', nextStep: 'Search existing leads to find the matching record.' };
    }
    return { title: 'Record already exists', message: 'A matching record already exists. Please check phone, email, or code.', nextStep: 'Search existing records before creating a new one.' };
  }

  // 10. Missing / required (Generic)
  if (textToSearch.includes('required') || textToSearch.includes('missing') || textToSearch.includes('empty')) {
    return { title: 'Missing information', message: 'Some required fields are empty.', nextStep: 'Fill all required fields marked on the form and save again.' };
  }

  // 11. Upload size/type
  if (textToSearch.includes('upload') || textToSearch.includes('file') || textToSearch.includes('size') || textToSearch.includes('type')) {
    return { title: 'Invalid file', message: 'The file type or size is not allowed.', nextStep: 'Use an allowed image type and a smaller file, then upload again.' };
  }

  // 12. Auth and HTTP Status
  if (input.status === 401 || /(unauthorized|unauthenticated|token expired|please log in|invalid credentials|invalid password|authentication)/i.test(textToSearch)) {
    // Only map to Auth if it doesn't match invalid status/request
    if (!/(invalid status|invalid transition|invalid state|invalid request)/i.test(textToSearch)) {
      if (textToSearch.includes('password') && (textToSearch.includes('incorrect') || textToSearch.includes('wrong'))) {
        return { title: 'Incorrect password', message: 'The password you entered is incorrect.', nextStep: 'Please check your password and try again.' };
      }
      return { title: 'Session expired or sign-in required', message: 'Please sign in again to continue.', nextStep: 'Log in with your employee credentials.' };
    }
  }
  if (input.status === 403 || (textToSearch.includes('access') && (textToSearch.includes('denied') || textToSearch.includes('permission') || textToSearch.includes('forbidden')))) {
    return { title: 'Access denied', message: 'You do not have permission to do this.', nextStep: 'Ask your manager or Admin if you need access.' };
  }
  if (input.status === 404) {
    return { title: 'Not found', message: rawMsg || 'The requested record could not be found.', nextStep: 'Refresh the page to see the latest data.' };
  }
  if (input.status === 409) {
    return { title: 'Conflict', message: rawMsg || 'This action conflicts with the current state of the record.', nextStep: 'Please refresh the page to see the latest status.' };
  }
  if (input.status === 400) {
    return { title: 'Validation Error', message: rawMsg || 'The information provided is invalid or incomplete.', nextStep: 'Please review the form and try again.' };
  }

  // 13. Fallback
  return { 
    title: 'Something went wrong', 
    message: rawMsg || 'No details were returned by the server.', 
    nextStep: 'Check your entries and try again. If it continues, save the message and contact support.' 
  };
}

export const handleApiError = async (res: Response, showError: any, data?: any, fallbackTitle?: string) => {
  let bodyData = data;
  if (!bodyData) {
    bodyData = await res.json().catch(() => ({}));
  }
  const raw = extractRawMessage(bodyData);
  const formatted = toUserFacingError({ status: res.status, body: bodyData, message: raw, error: raw });
  
  // Apply fallback title if title is generic
  if (fallbackTitle && (formatted.title === 'Something went wrong' || formatted.title === 'Request failed')) {
    formatted.title = fallbackTitle;
  }
  
  showError(formatted);
};
