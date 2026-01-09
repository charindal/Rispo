import React, { useState, useEffect } from 'react';
import adService from '../services/adService';
import '../styles/AdPanel.css';

/**
 * AdPanel Component - Displays advertisements in a non-intrusive manner
 * Supports multiple placement options: sidebar, banner, or inline
 */
const AdPanel = ({ 
  placement = 'sidebar', // 'sidebar', 'banner', 'inline'
  size = 'medium', // 'small', 'medium', 'large'
  className = '',
  adData = null // Pass custom ad data if needed
}) => {
  const [currentAd, setCurrentAd] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if ads are enabled
    if (!adService.areAdsEnabled()) {
      setIsVisible(false);
      setLoading(false);
      return;
    }

    // Load ad based on placement
    const loadAd = async () => {
      try {
        setLoading(true);
        let ad;
        
        if (adData) {
          ad = adData;
        } else {
          ad = await adService.getRandomAd(placement);
        }
        
        if (ad) {
          setCurrentAd(ad);
          // Track impression
          await adService.trackAdImpression(ad.id, { placement });
        }
      } catch (error) {
        console.error('Error loading ad:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAd();
  }, [placement, adData]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleAdClick = async () => {
    if (currentAd) {
      // Track ad click
      await adService.trackAdClick(currentAd.id, { placement });
      console.log('Ad clicked:', currentAd.title);
    }
  };

  if (!isVisible || loading || !currentAd) {
    return null;
  }

  return (
    <div className={`ad-panel ad-panel-${placement} ad-panel-${size} ${className}`}>
      <div className="ad-label">Sponsored</div>
      <button className="ad-close" onClick={handleClose} aria-label="Close advertisement">
        ×
      </button>
      
      <a 
        href={currentAd.link} 
        className="ad-content"
        onClick={handleAdClick}
        target="_blank"
        rel="noopener noreferrer"
        style={{ backgroundColor: currentAd.bgColor }}
      >
        {currentAd.image && (
          <div className="ad-image">
            <img src={currentAd.image} alt={currentAd.title} />
          </div>
        )}
        
        <div className="ad-text">
          <h3 className="ad-title">{currentAd.title}</h3>
          {currentAd.description && (
            <p className="ad-description">{currentAd.description}</p>
          )}
        </div>
      </a>
    </div>
  );
};

export default AdPanel;
