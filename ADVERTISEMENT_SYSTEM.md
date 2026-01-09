# Advertisement System Documentation

## Overview
The Rispo app now includes a non-intrusive advertisement system that allows you to display ads throughout the application without cluttering the user experience.

## Components

### AdPanel Component
Located: `rispo-app/src/components/AdPanel.js`

A reusable React component that displays advertisements in various formats and placements.

#### Props:
- **placement** (string): Where the ad appears
  - `'sidebar'` - Vertical card style (280px width)
  - `'banner'` - Horizontal style (full width)
  - `'inline'` - Compact style (400px max width)
  
- **size** (string): Size variant
  - `'small'` - Compact version
  - `'medium'` - Default size (recommended)
  - `'large'` - Larger version with more padding
  
- **className** (string): Optional CSS class for custom styling
- **adData** (object): Optional - Pass custom ad data instead of using the service

#### Example Usage:
```jsx
import AdPanel from '../components/AdPanel';

// Simple sidebar ad
<AdPanel placement="sidebar" size="medium" />

// Banner ad at top of page
<AdPanel placement="banner" size="large" />

// Inline ad within content
<AdPanel placement="inline" size="small" />
```

## Services

### Advertisement Service
Located: `rispo-app/src/services/adService.js`

Manages advertisement data, retrieval, and analytics tracking.

#### Key Functions:

**getAdsByPlacement(placement)**
- Fetches all active ads for a specific placement
- Returns: Array of ad objects

**getRandomAd(placement)**
- Gets a single random ad with priority weighting
- Lower priority numbers = higher display chance
- Returns: Single ad object or null

**trackAdClick(adId, context)**
- Tracks when a user clicks an advertisement
- Parameters: adId (number), context (object with page, userId, etc.)

**trackAdImpression(adId, context)**
- Tracks when an ad is displayed
- Parameters: adId (number), context (object)

**areAdsEnabled()**
- Checks if ads should be shown
- Can be used to disable ads for premium users
- Returns: boolean

**setAdPreferences(preferences)**
- Saves user's ad preferences to localStorage
- Parameters: preferences object (e.g., { enabled: false })

## Ad Data Structure

```javascript
{
  id: 1,                                    // Unique identifier
  title: 'Premium Snooker Cues',            // Main headline
  description: 'Quality cues for players',  // Supporting text
  image: null,                              // Image URL (optional)
  link: '#',                                // Click destination URL
  bgColor: '#0d5e2f',                       // Background color
  placement: ['sidebar', 'banner'],         // Where ad can appear
  isActive: true,                           // Enable/disable
  priority: 1,                              // Lower = higher priority
  startDate: '2026-01-01',                  // When ad starts
  endDate: '2026-12-31'                     // When ad expires
}
```

## Integration Examples

### Adding to Any Page Component

```jsx
import AdPanel from '../components/AdPanel';

function MyPage() {
  return (
    <div className="page-container">
      {/* Banner ad at top */}
      <AdPanel placement="banner" size="medium" />
      
      <div className="main-content">
        {/* Your page content */}
      </div>
      
      {/* Sidebar ad at bottom */}
      <div className="sidebar-section">
        <AdPanel placement="sidebar" size="medium" />
      </div>
    </div>
  );
}
```

### Current Implementation
The ad panels are currently integrated into:
- **PlayerDashboard**: Banner ad below welcome section, sidebar ad at bottom

### Recommended Placements
- **Dashboard pages**: Banner at top, sidebar at bottom
- **List/Rankings pages**: Sidebar ads
- **Form pages**: Inline ads between sections
- **Tournament pages**: Banner ads

## Styling

### CSS Classes
Located: `rispo-app/src/styles/AdPanel.css`

All ad panels have these features:
- Smooth fade-in animation
- Hover effects (lift and shadow)
- Close button (×) in top-right
- "Sponsored" label in top-left
- Responsive design for mobile
- Accessibility support (keyboard navigation, reduced motion)

### Customization
Add custom styles by passing a className:

```jsx
<AdPanel 
  placement="sidebar" 
  className="my-custom-ad" 
/>
```

Then in your CSS:
```css
.my-custom-ad {
  margin-top: 40px;
  border: 2px solid gold;
}
```

## Backend Integration (Future)

Currently using demo ads from `adService.js`. To integrate with backend:

1. **Update API calls in adService.js**:
```javascript
getAdsByPlacement: async (placement) => {
  const response = await axios.get(`${API_BASE_URL}/advertisements`, {
    params: { placement, active: true }
  });
  return response.data;
}
```

2. **Create Backend Endpoints**:
- `GET /api/advertisements` - List all ads
- `GET /api/advertisements?placement=sidebar` - Filter by placement
- `POST /api/advertisements/{id}/click` - Track clicks
- `POST /api/advertisements/{id}/impression` - Track views
- `POST /api/advertisements` - Create new ad (admin)
- `PUT /api/advertisements/{id}` - Update ad (admin)
- `DELETE /api/advertisements/{id}` - Delete ad (admin)

3. **Database Schema** (suggested):
```sql
CREATE TABLE advertisements (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  image_url VARCHAR(500),
  link_url VARCHAR(500) NOT NULL,
  bg_color VARCHAR(7) DEFAULT '#0d5e2f',
  placement VARCHAR(20) NOT NULL, -- JSON array or separate table
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 5,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE ad_clicks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ad_id BIGINT NOT NULL,
  user_id BIGINT,
  page VARCHAR(100),
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ad_id) REFERENCES advertisements(id)
);

CREATE TABLE ad_impressions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ad_id BIGINT NOT NULL,
  user_id BIGINT,
  page VARCHAR(100),
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ad_id) REFERENCES advertisements(id)
);
```

## Admin Management (Future Enhancement)

Create an admin page for managing advertisements:

```jsx
// AdminAdvertisements.js
function AdminAdvertisements() {
  // List all ads
  // Create new ads
  // Edit existing ads
  // View analytics (clicks, impressions, CTR)
  // Enable/disable ads
}
```

## Best Practices

1. **Don't Overdo It**: Limit to 1-2 ads per page
2. **Strategic Placement**: 
   - Banners at top or between major sections
   - Sidebars at the end of content
   - Avoid placing ads in primary user workflows
3. **Keep Content Relevant**: Match ads to user context
4. **Monitor Performance**: Track CTR (Click-Through Rate)
5. **Respect Users**: Always provide a close button
6. **Test Mobile**: Ensure ads don't disrupt mobile experience
7. **Premium Option**: Consider offering ad-free experience for paid users

## Disabling Ads

### For All Users:
```javascript
import adService from '../services/adService';
adService.setAdPreferences({ enabled: false });
```

### For Premium Users:
```javascript
// In adService.areAdsEnabled()
areAdsEnabled: () => {
  const user = authService.getCurrentUser();
  if (user?.isPremium) return false;
  // ... rest of logic
}
```

### Per Component:
Simply don't render the AdPanel component where you don't want ads.

## Troubleshooting

**Ads not showing?**
- Check browser console for errors
- Verify `adService.areAdsEnabled()` returns true
- Check ad dates (startDate/endDate)
- Ensure placement matches available ads

**Styling issues?**
- Import AdPanel.css in your component
- Check for CSS conflicts with parent containers
- Test different size props

**Analytics not tracking?**
- Open browser console to see tracking logs
- Implement backend endpoints for production

## Future Enhancements

- [ ] Admin dashboard for ad management
- [ ] A/B testing for ad performance
- [ ] Geo-targeting based on user location
- [ ] User preference center
- [ ] Premium/ad-free subscription
- [ ] Native ad format (looks like content)
- [ ] Video ad support
- [ ] Animated/carousel ads
- [ ] Third-party ad network integration
- [ ] Real-time bidding system
- [ ] Analytics dashboard with CTR, impressions, revenue

## Support

For questions or issues with the advertisement system, please contact the development team or file an issue in the project repository.
