import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config';

interface WhatsAppContext {
  customer_name?: string;
  property_name?: string;
  pm_name?: string;
  visit_date?: string;
}

export const useWhatsApp = () => {
  const { fetchWithAuth } = useAuth();
  const { showToast } = useToast();

  const sendWhatsAppMessage = async (
    templateKey: string,
    phone: string,
    context?: WhatsAppContext
  ) => {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (context?.customer_name) queryParams.append('customer_name', context.customer_name);
      if (context?.property_name) queryParams.append('property_name', context.property_name);
      if (context?.pm_name) queryParams.append('pm_name', context.pm_name);
      if (context?.visit_date) queryParams.append('visit_date', context.visit_date);

      const url = `${API_BASE_URL}/message-templates/${templateKey}/resolve${
        queryParams.toString() ? '?' + queryParams.toString() : ''
      }`;

      const res = await fetchWithAuth(url);
      
      if (!res.ok) {
        throw new Error('Failed to fetch WhatsApp template');
      }

      const data = await res.json();
      const bodyText = data.body_text || '';

      const cleanPhone = phone.replace(/\D/g, '');
      const whatsAppUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(bodyText)}`;

      window.open(whatsAppUrl, '_blank');
      return true;
    } catch (err) {
      console.error('Error sending WhatsApp message:', err);
      showToast('Error generating WhatsApp message', 'error');
      return false;
    }
  };

  return { sendWhatsAppMessage };
};
