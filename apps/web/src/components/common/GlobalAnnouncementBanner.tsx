import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config';
import { mediaUrl } from '../../utils/imageUtils';

export const GlobalAnnouncementBanner: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [active, setActive] = useState<boolean>(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/announcement`);
        if (response.ok) {
          const data = await response.json();
          setImageUrl(data.imageUrl);
          setActive(data.active);
        }
      } catch (e) {
        console.error('Failed to fetch announcement banner');
      }
    };
    fetchAnnouncement();
  }, []);

  if (!active || !imageUrl) return null;

  return (
    <div className="w-full bg-slate-950 overflow-hidden relative shadow-md">
      <img 
        src={mediaUrl(imageUrl)} 
        alt="Special Offer Announcement" 
        className="w-full h-auto max-h-[150px] md:max-h-[250px] object-cover object-center animate-in fade-in slide-in-from-top-4 duration-700 ease-out"
      />
    </div>
  );
};
