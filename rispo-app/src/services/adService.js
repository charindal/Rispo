import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

/**
 * Advertisement Service
 * Manages advertisement data, placement, and analytics
 */

// Demo advertisements - In production, fetch from backend
const demoAdvertisements = [
  {
    id: 1,
    title: 'Premium Snooker Cues',
    description: 'Top quality cues for competitive players. Visit our showroom today!',
    image: null,
    link: '#',
    bgColor: '#0d5e2f',
    placement: ['sidebar', 'banner'],
    isActive: true,
    priority: 1,
    startDate: '2026-01-01',
    endDate: '2026-12-31'
  },
  {
    id: 2,
    title: 'Join Our Premium Club',
    description: 'Professional facilities, coaching available. New members get 10% off!',
    image: null,
    link: '#',
    bgColor: '#1a8a4a',
    placement: ['sidebar'],
    isActive: true,
    priority: 2,
    startDate: '2026-01-01',
    endDate: '2026-06-30'
  },
  {
    id: 3,
    title: 'Tournament Sponsorship Available',
    description: 'Grow your brand. Contact us for partnership opportunities.',
    image: null,
    link: '#',
    bgColor: '#4a90e2',
    placement: ['banner'],
    isActive: true,
    priority: 3,
    startDate: '2026-01-01',
    endDate: '2026-12-31'
  },
  {
    id: 4,
    title: 'Pro Equipment Store',
    description: 'Everything you need - tables, balls, accessories',
    image: null,
    link: '#',
    bgColor: '#667eea',
    placement: ['inline', 'sidebar'],
    isActive: true,
    priority: 4,
    startDate: '2026-01-01',
    endDate: '2026-12-31'
  },
  {
    id: 5,
    title: 'Snooker Coaching Sessions',
    description: 'Learn from the pros. Improve your game with expert coaching.',
    image: null,
    link: '#',
    bgColor: '#764ba2',
    placement: ['banner', 'sidebar'],
    isActive: true,
    priority: 5,
    startDate: '2026-01-01',
    endDate: '2026-12-31'
  }
];

const adService = {
  /**
   * Get advertisements for a specific placement
   * @param {string} placement - 'sidebar', 'banner', or 'inline'
   * @returns {Promise<Array>} Array of active ads for that placement
   */
  getAdsByPlacement: async (placement = 'sidebar') => {
    try {
      // In production, this would be an API call:
      // const response = await axios.get(`${API_BASE_URL}/advertisements`, {
      //   params: { placement, active: true }
      // });
      // return response.data;

      // For now, return filtered demo ads
      const now = new Date();
      return demoAdvertisements.filter(ad => {
        const isPlacementMatch = ad.placement.includes(placement);
        const isActive = ad.isActive;
        const startDate = new Date(ad.startDate);
        const endDate = new Date(ad.endDate);
        const isInDateRange = now >= startDate && now <= endDate;
        
        return isPlacementMatch && isActive && isInDateRange;
      }).sort((a, b) => a.priority - b.priority);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      return [];
    }
  },

  /**
   * Get a random advertisement for a specific placement
   * @param {string} placement - 'sidebar', 'banner', or 'inline'
   * @returns {Promise<Object|null>} Single random ad or null
   */
  getRandomAd: async (placement = 'sidebar') => {
    try {
      const ads = await adService.getAdsByPlacement(placement);
      if (ads.length === 0) return null;
      
      // Weighted random selection based on priority (lower priority = higher weight)
      const weights = ads.map(ad => 10 / ad.priority);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      let random = Math.random() * totalWeight;
      
      for (let i = 0; i < ads.length; i++) {
        random -= weights[i];
        if (random <= 0) return ads[i];
      }
      
      return ads[0];
    } catch (error) {
      console.error('Error getting random ad:', error);
      return null;
    }
  },

  /**
   * Track an advertisement click
   * @param {number} adId - The ID of the clicked ad
   * @param {Object} context - Additional context (userId, page, etc.)
   * @returns {Promise<void>}
   */
  trackAdClick: async (adId, context = {}) => {
    try {
      // In production, send analytics to backend:
      // await axios.post(`${API_BASE_URL}/advertisements/${adId}/click`, {
      //   timestamp: new Date().toISOString(),
      //   ...context
      // });
      
      console.log('Ad click tracked:', { adId, context, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }
  },

  /**
   * Track an advertisement impression (view)
   * @param {number} adId - The ID of the viewed ad
   * @param {Object} context - Additional context (userId, page, etc.)
   * @returns {Promise<void>}
   */
  trackAdImpression: async (adId, context = {}) => {
    try {
      // In production, send analytics to backend:
      // await axios.post(`${API_BASE_URL}/advertisements/${adId}/impression`, {
      //   timestamp: new Date().toISOString(),
      //   ...context
      // });
      
      console.log('Ad impression tracked:', { adId, context, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  },

  /**
   * Get all active advertisements
   * @returns {Promise<Array>} Array of all active ads
   */
  getAllActiveAds: async () => {
    try {
      const now = new Date();
      return demoAdvertisements.filter(ad => {
        const isActive = ad.isActive;
        const startDate = new Date(ad.startDate);
        const endDate = new Date(ad.endDate);
        const isInDateRange = now >= startDate && now <= endDate;
        
        return isActive && isInDateRange;
      });
    } catch (error) {
      console.error('Error fetching all active ads:', error);
      return [];
    }
  },

  /**
   * Check if advertisements are enabled for the current user/session
   * @returns {boolean} Whether ads should be shown
   */
  areAdsEnabled: () => {
    // In production, check user preferences, subscription status, etc.
    // For example: premium users might not see ads
    const userPreferences = localStorage.getItem('adPreferences');
    if (userPreferences) {
      const prefs = JSON.parse(userPreferences);
      return prefs.enabled !== false;
    }
    return true; // Ads enabled by default
  },

  /**
   * Set advertisement preferences
   * @param {Object} preferences - User's ad preferences
   * @returns {void}
   */
  setAdPreferences: (preferences) => {
    localStorage.setItem('adPreferences', JSON.stringify(preferences));
  }
};

export default adService;
