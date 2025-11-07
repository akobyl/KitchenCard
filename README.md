# Ohio Restaurant Health Inspections

A searchable, interactive website for viewing restaurant health inspection data from Summit and Cuyahoga counties in Ohio. Built as a static site deployable on GitHub Pages.

🔗 **Live Site**: [Your GitHub Pages URL]

## Features

- 🔍 **Smart Filtering**: Search by restaurant name, county, cuisine type, violation count, and distance from your location
- 🗺️ **Interactive Map**: View restaurants on a map with color-coded markers based on violation severity
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 📊 **Detailed Inspection History**: View complete inspection records including all violations
- 📍 **Location-Based**: Calculate distances from your current location using GPS
- ⚡ **Fast & Static**: Pure client-side app with no backend required

## Demo

The site includes sample data from 12 restaurants across Summit and Cuyahoga counties. Replace this with real data using the scraper scripts.

## Quick Start

### View the Site Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/KitchenCard.git
   cd KitchenCard
   ```

2. Serve the site locally:
   ```bash
   # Using Python
   python -m http.server 8000

   # Or using Node.js
   npx serve

   # Or any other static file server
   ```

3. Open your browser to `http://localhost:8000`

### Deploy to GitHub Pages

1. Push your repository to GitHub

2. Go to **Settings** → **Pages**

3. Under **Source**, select your main branch and root folder

4. Click **Save**

5. Your site will be live at `https://yourusername.github.io/KitchenCard/`

## Project Structure

```
KitchenCard/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Responsive styles
├── js/
│   └── app.js              # Application logic
├── data/
│   └── inspections.json    # Restaurant inspection data
├── scripts/
│   ├── scraper.py          # Data collection script
│   └── requirements.txt    # Python dependencies
├── .github/
│   └── workflows/
│       └── update-data.yml # GitHub Actions workflow
└── README.md               # This file
```

## Data Schema

The `data/inspections.json` file follows this schema:

```json
{
  "lastUpdated": "ISO8601 timestamp",
  "restaurants": [
    {
      "id": "unique_id",
      "name": "Restaurant Name",
      "address": "123 Main St, City, OH 12345",
      "lat": 41.1234,
      "lng": -81.5678,
      "county": "Summit|Cuyahoga",
      "cuisine": "Italian|Chinese|American|etc",
      "inspections": [
        {
          "date": "ISO8601 timestamp",
          "critical_violations": 2,
          "violations": [
            {
              "description": "Violation description",
              "critical": true|false
            }
          ]
        }
      ]
    }
  ]
}
```

## Updating Restaurant Data

### Option 1: Manual Data Update

1. Edit `data/inspections.json` directly
2. Follow the schema above
3. Commit and push changes

### Option 2: Using the Scraper Script

The project includes a Python scraper template for automating data collection.

#### Setup

```bash
cd scripts
pip install -r requirements.txt
```

#### Usage

```bash
# Scrape all counties
python scripts/scraper.py --all

# Scrape specific county
python scripts/scraper.py --county summit
python scripts/scraper.py --county cuyahoga

# Merge with existing data instead of overwriting
python scripts/scraper.py --all --merge
```

⚠️ **Important**: The scraper is a template and requires customization:

1. Implement actual web scraping logic for Summit County
2. Identify and implement Cuyahoga County data source
3. Set up geocoding (see section below)
4. Refine cuisine classification logic

### Option 3: GitHub Actions (Automated)

The repository includes a GitHub Actions workflow for automated data updates.

#### Manual Trigger

1. Go to **Actions** tab in GitHub
2. Select **Update Restaurant Inspection Data**
3. Click **Run workflow**
4. Choose county and merge options
5. Click **Run workflow**

#### Scheduled Updates (Optional)

Uncomment the `schedule` section in `.github/workflows/update-data.yml`:

```yaml
schedule:
  - cron: '0 2 * * 0'  # Every Sunday at 2 AM UTC
```

## Data Sources

### Summit County
- **Source**: [Summit County Health Department](https://www.healthspace.com/clients/Ohio/Summit/Summit_Web_Live.nsf)
- **Access**: Public web interface
- **Method**: Web scraping required (navigate by city → restaurant)

### Cuyahoga County
- **Source**: TBD - Please provide URL or API endpoint
- **Access**: TBD
- **Method**: TBD

## Geocoding Addresses

To show restaurants on the map, you need latitude/longitude coordinates.

### Option 1: Pre-geocode (Recommended)

Use a geocoding service to convert addresses before committing:

```python
from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="ohio_health_inspections")
location = geolocator.geocode("123 Main St, Akron, OH")
print(f"Lat: {location.latitude}, Lng: {location.longitude}")
```

**Free geocoding services:**
- [Nominatim (OpenStreetMap)](https://nominatim.org/)
- [Geocodio](https://www.geocod.io/) - 2,500 free requests/day
- [LocationIQ](https://locationiq.com/) - 5,000 free requests/day

### Option 2: Bulk Geocoding

For large datasets, use batch geocoding services:
- Google Maps Geocoding API (paid, but accurate)
- Geocodio batch processing
- Census Geocoder (free, US only)

## Cuisine Classification

The scraper includes basic keyword-based cuisine inference. For better accuracy:

### Option 1: Manual Classification
- Review and manually tag cuisine types
- Store in a separate mapping file

### Option 2: Enhanced Heuristics
- Use more comprehensive keyword lists
- Analyze menu items if available
- Check business category from health dept

### Option 3: External APIs
- Use business APIs (Yelp, Google Places)
- Cross-reference with restaurant databases

## Development

### Technologies Used

- **Frontend**: Vanilla JavaScript (ES6+)
- **Mapping**: Leaflet.js
- **Styling**: CSS3 with CSS Grid and Flexbox
- **Data**: JSON
- **Scraping**: Python with BeautifulSoup

### Key Features Implementation

#### Filtering
- Real-time text search with debouncing
- Multi-criteria filtering (county, cuisine, violations, distance)
- Results update dynamically

#### Distance Calculation
- Haversine formula for accurate distance
- Geolocation API for user position
- Straight-line distance (no routing API required)

#### Map Integration
- Color-coded markers:
  - 🟢 Green: 0-2 critical violations
  - 🟠 Orange: 3-5 critical violations
  - 🔴 Red: 6+ critical violations
- Popups with restaurant info
- Auto-fit bounds to visible markers

#### Sorting
- Click table headers to sort
- Toggle ascending/descending
- Persistent sort state

## Performance Considerations

- **Data Size**: Keep JSON file under 5MB for fast loading
- **Pagination**: Consider implementing if > 1000 restaurants
- **Lazy Loading**: Load map markers on demand if performance issues
- **CDN**: Use CDN for Leaflet.js (already implemented)

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️  IE 11 not supported (uses modern JavaScript)

## Troubleshooting

### Site doesn't load on GitHub Pages

1. Check that GitHub Pages is enabled in repository settings
2. Ensure `index.html` is in the root directory
3. Wait a few minutes for GitHub to build the site
4. Check the Actions tab for deployment status

### Map doesn't display

1. Check browser console for errors
2. Verify Leaflet.js CDN is accessible
3. Ensure restaurants have valid lat/lng coordinates
4. Check that `#map` div has a defined height in CSS

### Geolocation not working

1. GitHub Pages requires HTTPS for geolocation
2. User must grant location permission
3. Some browsers block geolocation in iframes

### No restaurants showing

1. Check `data/inspections.json` exists and is valid JSON
2. Open browser console for error messages
3. Verify JSON schema matches expected format

## Contributing

Contributions welcome! Areas for improvement:

- [ ] Implement complete Summit County scraper
- [ ] Add Cuyahoga County data source and scraper
- [ ] Enhance cuisine classification algorithm
- [ ] Add export functionality (CSV, PDF)
- [ ] Implement advanced filtering (date ranges, violation types)
- [ ] Add data visualization (charts, trends)
- [ ] Mobile app (React Native/Flutter)
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)

## Data Privacy & Disclaimers

- All data is sourced from public health department records
- Information provided for reference only
- Users should verify inspection details with official county health departments
- This is an unofficial tool not affiliated with any government agency
- Location data is processed client-side and never stored

## License

MIT License - feel free to use, modify, and distribute.

## Acknowledgments

- Data provided by Summit County and Cuyahoga County Health Departments
- Map tiles © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Built with [Leaflet.js](https://leafletjs.com/)

## Questions & Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Open an issue on GitHub
3. Review the code comments for implementation details

---

**Last Updated**: November 2025
