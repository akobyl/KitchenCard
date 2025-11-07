# Scraper Implementation Guide

This guide provides detailed information on implementing the web scrapers for Summit and Cuyahoga counties.

## Data Sources

### Summit County
- **URL**: https://www.healthspace.com/clients/Ohio/Summit/Summit_Web_Live.nsf
- **Type**: Public web interface
- **Technology**: Traditional server-rendered pages
- **Approach**: Requests + BeautifulSoup

### Cuyahoga County
- **URL**: https://inspections.myhealthdepartment.com/ccbh
- **Type**: Public web interface
- **Technology**: JavaScript-rendered (SPA/modern web app)
- **Bot Protection**: Yes (403 errors with simple requests)
- **Approach**: Selenium + headless browser required

## Implementation Strategies

### Summit County Implementation

The Summit County site uses traditional server-rendered HTML, making it suitable for requests + BeautifulSoup.

#### Recommended Approach

```python
import requests
from bs4 import BeautifulSoup
import time

def scrape_summit_county():
    base_url = "https://www.healthspace.com/clients/Ohio/Summit/Summit_Web_Live.nsf"

    # 1. Identify entry points (cities, search pages)
    # 2. Navigate through listings
    # 3. Extract restaurant links
    # 4. Visit each restaurant page
    # 5. Extract inspection details

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    session = requests.Session()
    session.headers.update(headers)

    # Example: Iterate through cities
    cities = ["Akron", "Cuyahoga Falls", "Hudson", "Stow", "Barberton"]

    for city in cities:
        print(f"Processing {city}...")

        # Make request to search/listing page
        # response = session.get(f"{base_url}/search?city={city}")
        # soup = BeautifulSoup(response.content, 'html.parser')

        # Extract restaurant listings
        # restaurants = soup.find_all('div', class_='restaurant-item')

        # For each restaurant, visit detail page
        # for restaurant in restaurants:
        #     detail_url = restaurant.find('a')['href']
        #     detail_response = session.get(detail_url)
        #     detail_soup = BeautifulSoup(detail_response.content, 'html.parser')
        #
        #     # Extract data
        #     name = detail_soup.find('h1', class_='name').text
        #     address = detail_soup.find('div', class_='address').text
        #     # ... etc

        time.sleep(1)  # Rate limiting
```

#### Key Tasks

1. **Explore the site manually**:
   - Open the site in a browser
   - Use Developer Tools (F12) to inspect HTML structure
   - Identify class names, IDs, and navigation patterns

2. **Map the navigation flow**:
   - How do you browse restaurants? (by city, by name, etc.)
   - What pages do you need to visit?
   - What's the URL pattern?

3. **Extract data fields**:
   - Restaurant name
   - Address
   - Inspection dates
   - Violation descriptions
   - Critical vs non-critical flags

4. **Handle pagination**:
   - Does the site have multiple pages?
   - How do you navigate to the next page?

### Cuyahoga County Implementation

The Cuyahoga County site is JavaScript-rendered and has bot protection, requiring Selenium.

#### Recommended Approach

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

def scrape_cuyahoga_county():
    url = "https://inspections.myhealthdepartment.com/ccbh"

    # Set up Chrome options
    options = Options()
    options.add_argument('--headless')  # Run without GUI
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

    # Initialize driver
    driver = webdriver.Chrome(options=options)

    try:
        print("Loading Cuyahoga County site...")
        driver.get(url)

        # Wait for JavaScript to render content
        wait = WebDriverWait(driver, 10)

        # Wait for search form or restaurant list to load
        # wait.until(EC.presence_of_element_located((By.ID, "search-form")))

        # Interact with search/filter elements
        # search_box = driver.find_element(By.ID, "restaurant-search")
        # search_box.send_keys("pizza")
        # search_button = driver.find_element(By.ID, "search-button")
        # search_button.click()

        # Wait for results
        # wait.until(EC.presence_of_element_located((By.CLASS_NAME, "results")))

        # Extract restaurant elements
        # restaurants = driver.find_elements(By.CLASS_NAME, "restaurant-card")

        # for restaurant in restaurants:
        #     name = restaurant.find_element(By.CLASS_NAME, "name").text
        #     address = restaurant.find_element(By.CLASS_NAME, "address").text
        #
        #     # Click to view details
        #     restaurant.click()
        #     time.sleep(1)  # Wait for modal/page load
        #
        #     # Extract inspection data
        #     inspections = driver.find_elements(By.CLASS_NAME, "inspection")
        #     # ... extract violation details ...
        #
        #     # Go back
        #     driver.back()

        time.sleep(1)  # Rate limiting

    finally:
        driver.quit()
```

#### Key Tasks

1. **Install Selenium**:
   ```bash
   pip install selenium webdriver-manager
   ```

2. **Set up Chrome/Firefox driver**:
   ```python
   from webdriver_manager.chrome import ChromeDriverManager

   driver = webdriver.Chrome(
       service=Service(ChromeDriverManager().install()),
       options=options
   )
   ```

3. **Handle dynamic content**:
   - Wait for elements to load (`WebDriverWait`)
   - Handle infinite scroll if present
   - Deal with modals/popups
   - Handle AJAX requests

4. **Bypass bot detection**:
   - Use realistic user agent
   - Add random delays between actions
   - Mimic human behavior (scroll, move mouse)
   - Consider rotating user agents

## Common Implementation Steps

### 1. Geocoding Addresses

Use a geocoding service to convert addresses to coordinates:

```python
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import time

geolocator = Nominatim(user_agent="ohio_health_inspections")

def geocode_address(address):
    try:
        location = geolocator.geocode(address + ", Ohio")
        if location:
            return (location.latitude, location.longitude)
    except GeocoderTimedOut:
        time.sleep(1)
        return geocode_address(address)  # Retry
    return (0.0, 0.0)  # Default if not found
```

**Alternatives**:
- Geocodio (https://www.geocod.io/) - 2,500 free/day
- LocationIQ (https://locationiq.com/) - 5,000 free/day
- Google Maps API (paid, but very accurate)

### 2. Classifying Cuisines

```python
def infer_cuisine(name):
    name_lower = name.lower()

    keywords = {
        "Italian": ["italian", "pizza", "pasta", "trattoria", "ristorante"],
        "Chinese": ["chinese", "china", "wok", "dragon", "panda"],
        "Japanese": ["japanese", "sushi", "hibachi", "ramen", "tokyo"],
        "Mexican": ["mexican", "taco", "burrito", "cantina", "mexico"],
        "American": ["diner", "grill", "burger", "steakhouse", "bbq"],
        "Indian": ["indian", "india", "curry", "tandoor", "masala"],
        "Thai": ["thai", "thailand", "pad", "basil"],
        "Mediterranean": ["mediterranean", "greek", "gyro", "kebab"],
        "French": ["french", "bistro", "cafe", "boulangerie"],
    }

    for cuisine, words in keywords.items():
        if any(word in name_lower for word in words):
            return cuisine

    return "Other"
```

### 3. Parsing Inspection Data

```python
def parse_inspection(inspection_html):
    """Parse raw inspection data into schema format."""

    inspection = {
        "date": extract_date(inspection_html),
        "critical_violations": 0,
        "violations": []
    }

    violations = extract_violations(inspection_html)

    for violation in violations:
        is_critical = is_violation_critical(violation)

        inspection["violations"].append({
            "description": violation["text"],
            "critical": is_critical
        })

        if is_critical:
            inspection["critical_violations"] += 1

    return inspection
```

### 4. Data Validation

```python
def validate_restaurant(restaurant):
    """Validate restaurant data before saving."""

    required_fields = ["id", "name", "address", "lat", "lng", "county", "cuisine"]

    for field in required_fields:
        if field not in restaurant or not restaurant[field]:
            print(f"⚠️  Missing {field} for {restaurant.get('name', 'Unknown')}")
            return False

    # Validate coordinates
    if not (-90 <= restaurant["lat"] <= 90):
        print(f"⚠️  Invalid latitude for {restaurant['name']}")
        return False

    if not (-180 <= restaurant["lng"] <= 180):
        print(f"⚠️  Invalid longitude for {restaurant['name']}")
        return False

    return True
```

## Testing Strategy

### 1. Start Small

Test with a single restaurant first:

```python
# Test with one known restaurant
test_restaurants = ["Luigi's Italian Restaurant"]

for name in test_restaurants:
    data = scrape_restaurant(name)
    print(json.dumps(data, indent=2))
```

### 2. Validate Output

After each scrape, validate the JSON:

```bash
python scripts/scraper.py --county summit
jq . data/inspections.json  # Validate JSON
```

### 3. Check Data Quality

```python
# After scraping, run quality checks
restaurants = load_restaurants()

print(f"Total restaurants: {len(restaurants)}")
print(f"Restaurants with coordinates: {sum(1 for r in restaurants if r['lat'] != 0)}")
print(f"Restaurants with inspections: {sum(1 for r in restaurants if r['inspections'])}")
print(f"Total inspections: {sum(len(r['inspections']) for r in restaurants)}")
```

## Rate Limiting Best Practices

### Respectful Scraping

```python
import time
import random

def polite_sleep(min_seconds=1, max_seconds=3):
    """Sleep for a random duration to mimic human behavior."""
    time.sleep(random.uniform(min_seconds, max_seconds))

# Use between requests
for restaurant in restaurants:
    scrape_restaurant(restaurant)
    polite_sleep(1, 2)  # 1-2 seconds between requests
```

### Check robots.txt

Before scraping, check the robots.txt file:

- Summit: https://www.healthspace.com/robots.txt
- Cuyahoga: https://inspections.myhealthdepartment.com/robots.txt

```python
from urllib.robotparser import RobotFileParser

def can_scrape(url):
    rp = RobotFileParser()
    rp.set_url(url + "/robots.txt")
    rp.read()
    return rp.can_fetch("*", url)
```

## Error Handling

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def safe_scrape(url):
    max_retries = 3

    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response

        except requests.Timeout:
            logger.warning(f"Timeout on attempt {attempt + 1}/{max_retries}")
            time.sleep(2 ** attempt)  # Exponential backoff

        except requests.HTTPError as e:
            if e.response.status_code == 429:  # Rate limit
                logger.warning("Rate limited, waiting 60 seconds...")
                time.sleep(60)
            else:
                logger.error(f"HTTP error: {e}")
                break

        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            break

    return None
```

## Deployment Considerations

### GitHub Actions Environment

When running in GitHub Actions:

```python
# Selenium needs special setup for CI/CD
options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')  # Required in CI
options.add_argument('--disable-dev-shm-usage')  # Required in CI
options.add_argument('--disable-gpu')  # Optional

# For GitHub Actions, you might need:
if os.getenv('CI'):
    options.binary_location = "/usr/bin/chromium-browser"
```

### Caching Results

To avoid re-geocoding or re-scraping:

```python
import pickle
import os

CACHE_FILE = "scraper_cache.pkl"

def load_cache():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'rb') as f:
            return pickle.load(f)
    return {}

def save_cache(cache):
    with open(CACHE_FILE, 'wb') as f:
        pickle.dump(cache, f)

# Usage
cache = load_cache()

if address not in cache:
    coords = geocode_address(address)
    cache[address] = coords
    save_cache(cache)
else:
    coords = cache[address]
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| 403 Forbidden | Use Selenium, proper user agent, rate limiting |
| Empty results | Check selectors, wait for JavaScript to load |
| Wrong data extracted | Inspect HTML structure, update selectors |
| Geocoding fails | Verify address format, add "Ohio" to queries |
| Chrome driver not found | Use webdriver-manager for auto-installation |
| Out of memory | Process in batches, clear data periodically |

### Debug Mode

```python
# Add debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Save HTML for inspection
with open('debug.html', 'w') as f:
    f.write(response.text)

# Take screenshots with Selenium
driver.save_screenshot('debug.png')

# Print extracted data
import json
print(json.dumps(restaurant_data, indent=2))
```

## Resources

- **BeautifulSoup Docs**: https://www.crummy.com/software/BeautifulSoup/bs4/doc/
- **Selenium Docs**: https://selenium-python.readthedocs.io/
- **Requests Docs**: https://requests.readthedocs.io/
- **Geopy Docs**: https://geopy.readthedocs.io/
- **Web Scraping Best Practices**: https://www.scrapehero.com/how-to-prevent-getting-blacklisted-while-scraping/

## Next Steps

1. **Explore both county websites manually** using browser developer tools
2. **Map out the data structure** and navigation flow
3. **Implement Summit County scraper first** (simpler, no JavaScript)
4. **Test with small samples** before full scraping
5. **Set up geocoding** with your preferred service
6. **Implement Cuyahoga County scraper** with Selenium
7. **Test the GitHub Actions workflow** with manual trigger
8. **Schedule automatic updates** once stable

---

**Last Updated**: November 2025
