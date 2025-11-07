// Global state
const AppState = {
    restaurants: [],
    filteredRestaurants: [],
    userLocation: null,
    currentSort: { column: 'name', direction: 'asc' },
    filters: {
        name: '',
        county: '',
        cuisine: '',
        maxViolations: null,
        maxDistance: null
    },
    map: null,
    markers: []
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    initializeEventListeners();
    initializeMap();
    renderTable();
    updateResultsCount();
});

// Load restaurant data from JSON
async function loadData() {
    try {
        const response = await fetch('data/inspections.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        AppState.restaurants = data.restaurants;
        AppState.filteredRestaurants = [...AppState.restaurants];

        // Update last updated date
        if (data.lastUpdated) {
            document.getElementById('last-updated-date').textContent =
                new Date(data.lastUpdated).toLocaleDateString();
        }

        // Populate cuisine filter dropdown
        populateCuisineFilter();

    } catch (error) {
        console.error('Error loading restaurant data:', error);
        document.getElementById('table-body').innerHTML =
            '<tr><td colspan="8" style="text-align: center; color: #e74c3c;">Error loading data. Please try again later.</td></tr>';
    }
}

// Populate cuisine filter with unique cuisines
function populateCuisineFilter() {
    const cuisines = [...new Set(AppState.restaurants.map(r => r.cuisine))].sort();
    const select = document.getElementById('filter-cuisine');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.value = cuisine;
        option.textContent = cuisine;
        select.appendChild(option);
    });
}

// Initialize event listeners
function initializeEventListeners() {
    // Filter inputs
    document.getElementById('search-name').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('filter-county').addEventListener('change', applyFilters);
    document.getElementById('filter-cuisine').addEventListener('change', applyFilters);
    document.getElementById('filter-violations').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('filter-distance').addEventListener('input', debounce(applyFilters, 300));

    // Filter buttons
    document.getElementById('btn-apply-filters').addEventListener('click', applyFilters);
    document.getElementById('btn-clear-filters').addEventListener('click', clearFilters);
    document.getElementById('btn-get-location').addEventListener('click', getUserLocation);

    // View toggle
    document.getElementById('btn-table-view').addEventListener('click', () => switchView('table'));
    document.getElementById('btn-map-view').addEventListener('click', () => switchView('map'));

    // Table sorting
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => sortTable(th.dataset.sort));
    });

    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('detail-modal').addEventListener('click', (e) => {
        if (e.target.id === 'detail-modal') closeModal();
    });
}

// Debounce helper function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply filters to restaurant list
function applyFilters() {
    AppState.filters = {
        name: document.getElementById('search-name').value.toLowerCase(),
        county: document.getElementById('filter-county').value,
        cuisine: document.getElementById('filter-cuisine').value,
        maxViolations: parseFloat(document.getElementById('filter-violations').value) || null,
        maxDistance: parseFloat(document.getElementById('filter-distance').value) || null
    };

    AppState.filteredRestaurants = AppState.restaurants.filter(restaurant => {
        // Name filter
        if (AppState.filters.name &&
            !restaurant.name.toLowerCase().includes(AppState.filters.name)) {
            return false;
        }

        // County filter
        if (AppState.filters.county && restaurant.county !== AppState.filters.county) {
            return false;
        }

        // Cuisine filter
        if (AppState.filters.cuisine && restaurant.cuisine !== AppState.filters.cuisine) {
            return false;
        }

        // Violations filter
        if (AppState.filters.maxViolations !== null) {
            const latestInspection = getLatestInspection(restaurant);
            if (!latestInspection ||
                latestInspection.critical_violations > AppState.filters.maxViolations) {
                return false;
            }
        }

        // Distance filter
        if (AppState.filters.maxDistance !== null && AppState.userLocation) {
            const distance = calculateDistance(
                AppState.userLocation.lat,
                AppState.userLocation.lng,
                restaurant.lat,
                restaurant.lng
            );
            if (distance > AppState.filters.maxDistance) {
                return false;
            }
        }

        return true;
    });

    renderTable();
    updateMapMarkers();
    updateResultsCount();
}

// Clear all filters
function clearFilters() {
    document.getElementById('search-name').value = '';
    document.getElementById('filter-county').value = '';
    document.getElementById('filter-cuisine').value = '';
    document.getElementById('filter-violations').value = '';
    document.getElementById('filter-distance').value = '';

    AppState.filters = {
        name: '',
        county: '',
        cuisine: '',
        maxViolations: null,
        maxDistance: null
    };

    AppState.filteredRestaurants = [...AppState.restaurants];
    renderTable();
    updateMapMarkers();
    updateResultsCount();
}

// Get user location using Geolocation API
function getUserLocation() {
    const statusDiv = document.getElementById('location-status');

    if (!navigator.geolocation) {
        statusDiv.textContent = 'Geolocation is not supported by your browser.';
        statusDiv.className = 'location-status error';
        return;
    }

    statusDiv.textContent = 'Getting your location...';
    statusDiv.className = 'location-status';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            AppState.userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            statusDiv.textContent = `Location acquired: ${AppState.userLocation.lat.toFixed(4)}, ${AppState.userLocation.lng.toFixed(4)}`;
            statusDiv.className = 'location-status success';

            // Add user marker to map
            if (AppState.map) {
                L.marker([AppState.userLocation.lat, AppState.userLocation.lng], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                }).addTo(AppState.map)
                  .bindPopup('Your Location')
                  .openPopup();

                AppState.map.setView([AppState.userLocation.lat, AppState.userLocation.lng], 11);
            }

            // Re-render table to show distances
            renderTable();
        },
        (error) => {
            let errorMsg = 'Unable to retrieve your location.';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = 'Location access denied. Please enable location permissions.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMsg = 'Location request timed out.';
                    break;
            }
            statusDiv.textContent = errorMsg;
            statusDiv.className = 'location-status error';
        }
    );
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Get latest inspection for a restaurant
function getLatestInspection(restaurant) {
    if (!restaurant.inspections || restaurant.inspections.length === 0) {
        return null;
    }
    return restaurant.inspections.reduce((latest, current) => {
        return new Date(current.date) > new Date(latest.date) ? current : latest;
    });
}

// Sort table by column
function sortTable(column) {
    // Update sort state
    if (AppState.currentSort.column === column) {
        AppState.currentSort.direction =
            AppState.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        AppState.currentSort.column = column;
        AppState.currentSort.direction = 'asc';
    }

    // Update table header classes
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });
    document.querySelector(`th[data-sort="${column}"]`)
        .classList.add(`sorted-${AppState.currentSort.direction}`);

    // Sort filtered restaurants
    AppState.filteredRestaurants.sort((a, b) => {
        let aVal, bVal;

        switch(column) {
            case 'name':
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
                break;
            case 'address':
                aVal = a.address.toLowerCase();
                bVal = b.address.toLowerCase();
                break;
            case 'county':
                aVal = a.county;
                bVal = b.county;
                break;
            case 'cuisine':
                aVal = a.cuisine;
                bVal = b.cuisine;
                break;
            case 'date':
                const aInspection = getLatestInspection(a);
                const bInspection = getLatestInspection(b);
                aVal = aInspection ? new Date(aInspection.date).getTime() : 0;
                bVal = bInspection ? new Date(bInspection.date).getTime() : 0;
                break;
            case 'violations':
                const aLatest = getLatestInspection(a);
                const bLatest = getLatestInspection(b);
                aVal = aLatest ? aLatest.critical_violations : 0;
                bVal = bLatest ? bLatest.critical_violations : 0;
                break;
            case 'distance':
                if (!AppState.userLocation) return 0;
                aVal = calculateDistance(AppState.userLocation.lat, AppState.userLocation.lng, a.lat, a.lng);
                bVal = calculateDistance(AppState.userLocation.lat, AppState.userLocation.lng, b.lat, b.lng);
                break;
            default:
                return 0;
        }

        if (aVal < bVal) return AppState.currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return AppState.currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    renderTable();
}

// Render the restaurant table
function renderTable() {
    const tbody = document.getElementById('table-body');

    if (AppState.filteredRestaurants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">No restaurants found matching your filters.</td></tr>';
        return;
    }

    tbody.innerHTML = AppState.filteredRestaurants.map(restaurant => {
        const latestInspection = getLatestInspection(restaurant);
        const criticalViolations = latestInspection ? latestInspection.critical_violations : 0;
        const inspectionDate = latestInspection ?
            new Date(latestInspection.date).toLocaleDateString() : 'N/A';

        let violationClass = 'violations-low';
        if (criticalViolations > 5) violationClass = 'violations-high';
        else if (criticalViolations > 2) violationClass = 'violations-medium';

        let distanceText = 'N/A';
        if (AppState.userLocation) {
            const distance = calculateDistance(
                AppState.userLocation.lat,
                AppState.userLocation.lng,
                restaurant.lat,
                restaurant.lng
            );
            distanceText = `${distance.toFixed(1)} mi`;
        }

        return `
            <tr>
                <td><strong>${restaurant.name}</strong></td>
                <td>${restaurant.address}</td>
                <td>${restaurant.county}</td>
                <td>${restaurant.cuisine}</td>
                <td>${inspectionDate}</td>
                <td><span class="violations-badge ${violationClass}">${criticalViolations}</span></td>
                <td>${distanceText}</td>
                <td><button class="btn-details" onclick="showRestaurantDetails('${restaurant.id}')">Details</button></td>
            </tr>
        `;
    }).join('');
}

// Update results count
function updateResultsCount() {
    const count = AppState.filteredRestaurants.length;
    const total = AppState.restaurants.length;
    document.getElementById('results-count').textContent =
        `Showing ${count} of ${total} restaurants`;
}

// Switch between table and map view
function switchView(view) {
    const tableView = document.getElementById('table-view');
    const mapView = document.getElementById('map-view');
    const tableBtn = document.getElementById('btn-table-view');
    const mapBtn = document.getElementById('btn-map-view');

    if (view === 'table') {
        tableView.classList.add('active');
        mapView.classList.remove('active');
        tableBtn.classList.add('active');
        mapBtn.classList.remove('active');
    } else {
        tableView.classList.remove('active');
        mapView.classList.add('active');
        tableBtn.classList.remove('active');
        mapBtn.classList.add('active');

        // Refresh map when switching to map view
        if (AppState.map) {
            setTimeout(() => {
                AppState.map.invalidateSize();
                updateMapMarkers();
            }, 100);
        }
    }
}

// Initialize Leaflet map
function initializeMap() {
    // Center on Ohio (between Summit and Cuyahoga counties)
    const ohioCenter = [41.3, -81.6];

    AppState.map = L.map('map').setView(ohioCenter, 10);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(AppState.map);

    updateMapMarkers();
}

// Update map markers based on filtered restaurants
function updateMapMarkers() {
    if (!AppState.map) return;

    // Clear existing markers
    AppState.markers.forEach(marker => AppState.map.removeLayer(marker));
    AppState.markers = [];

    // Add markers for filtered restaurants
    AppState.filteredRestaurants.forEach(restaurant => {
        const latestInspection = getLatestInspection(restaurant);
        const criticalViolations = latestInspection ? latestInspection.critical_violations : 0;

        // Color code markers by violation severity
        let markerColor = 'green';
        if (criticalViolations > 5) markerColor = 'red';
        else if (criticalViolations > 2) markerColor = 'orange';

        const marker = L.marker([restaurant.lat, restaurant.lng], {
            icon: L.icon({
                iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${markerColor}.png`,
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(AppState.map);

        const inspectionDate = latestInspection ?
            new Date(latestInspection.date).toLocaleDateString() : 'N/A';

        marker.bindPopup(`
            <div class="popup-content">
                <h3>${restaurant.name}</h3>
                <p><strong>Address:</strong> ${restaurant.address}</p>
                <p><strong>Cuisine:</strong> ${restaurant.cuisine}</p>
                <p><strong>Last Inspection:</strong> ${inspectionDate}</p>
                <p><strong>Critical Violations:</strong> ${criticalViolations}</p>
                <button class="popup-btn" onclick="showRestaurantDetails('${restaurant.id}')">View Full Details</button>
            </div>
        `);

        AppState.markers.push(marker);
    });

    // Fit bounds if there are markers
    if (AppState.markers.length > 0) {
        const group = L.featureGroup(AppState.markers);
        AppState.map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Show restaurant details in modal
function showRestaurantDetails(restaurantId) {
    const restaurant = AppState.restaurants.find(r => r.id === restaurantId);
    if (!restaurant) return;

    const modalBody = document.getElementById('modal-body');

    let distanceInfo = '';
    if (AppState.userLocation) {
        const distance = calculateDistance(
            AppState.userLocation.lat,
            AppState.userLocation.lng,
            restaurant.lat,
            restaurant.lng
        );
        distanceInfo = `<p><strong>Distance from you:</strong> ${distance.toFixed(1)} miles</p>`;
    }

    const inspectionsHTML = restaurant.inspections
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(inspection => {
            const violationsHTML = inspection.violations.map(v => {
                const vClass = v.critical ? 'violation-critical' : 'violation-non-critical';
                const vLabel = v.critical ? '[CRITICAL]' : '[Non-Critical]';
                return `<li class="${vClass}">${vLabel} ${v.description}</li>`;
            }).join('');

            return `
                <div class="inspection-item">
                    <div class="inspection-date">${new Date(inspection.date).toLocaleDateString()}</div>
                    <p><strong>Critical Violations:</strong> ${inspection.critical_violations}</p>
                    <p><strong>Total Violations:</strong> ${inspection.violations.length}</p>
                    <ul class="violation-list">
                        ${violationsHTML}
                    </ul>
                </div>
            `;
        }).join('');

    modalBody.innerHTML = `
        <div class="restaurant-detail">
            <h2>${restaurant.name}</h2>
            <div class="detail-info">
                <p><strong>Address:</strong> ${restaurant.address}</p>
                <p><strong>County:</strong> ${restaurant.county}</p>
                <p><strong>Cuisine Type:</strong> ${restaurant.cuisine}</p>
                ${distanceInfo}
            </div>
            <div class="inspection-history">
                <h3>Inspection History</h3>
                ${inspectionsHTML}
            </div>
        </div>
    `;

    document.getElementById('detail-modal').classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('detail-modal').classList.remove('active');
}
