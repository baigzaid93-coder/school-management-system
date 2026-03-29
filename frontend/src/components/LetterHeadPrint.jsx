import { useState, useEffect } from 'react';
import api from '../services/api';
import { Building2, Phone, Mail, Globe, MapPin } from 'lucide-react';

function LetterHeadPrint({ showLogo = true, compact = false }) {
  const [letterHead, setLetterHead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLetterHead();
  }, []);

  const loadLetterHead = async () => {
    try {
      const response = await api.get('/letter-head');
      if (response.data && Object.keys(response.data).length > 0) {
        setLetterHead(response.data);
      }
    } catch (err) {
      console.log('Letter head not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !letterHead) {
    return null;
  }

  return (
    <div className="letter-head border-b-2 border-blue-800 pb-4 mb-6">
      <div className="flex items-center gap-4">
        {showLogo && letterHead.logo && (
          <img 
            src={letterHead.logo} 
            alt="School Logo" 
            className={`${compact ? 'h-12' : 'h-16'} w-auto object-contain`}
          />
        )}
        <div className="flex-1 text-center">
          <h1 className={`font-bold text-gray-800 ${compact ? 'text-lg' : 'text-2xl'}`}>
            {letterHead.headerText || 'School Name'}
          </h1>
          {letterHead.tagline && (
            <p className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
              {letterHead.tagline}
            </p>
          )}
          <div className={`flex flex-wrap justify-center gap-4 ${compact ? 'text-xs mt-1' : 'text-sm mt-2'}`}>
            {letterHead.address && (
              <span className="flex items-center gap-1">
                <MapPin size={compact ? 12 : 14} />
                {letterHead.address}
              </span>
            )}
            {letterHead.phone && (
              <span className="flex items-center gap-1">
                <Phone size={compact ? 12 : 14} />
                {letterHead.phone}
              </span>
            )}
            {letterHead.email && (
              <span className="flex items-center gap-1">
                <Mail size={compact ? 12 : 14} />
                {letterHead.email}
              </span>
            )}
            {letterHead.website && (
              <span className="flex items-center gap-1">
                <Globe size={compact ? 12 : 14} />
                {letterHead.website}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LetterHeadPrint;
