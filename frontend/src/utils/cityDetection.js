// src/utils/cityDetection.js

const CITY_BOUNDARIES = {
    // Northern Iraq
    'Mosul': {
        north: 36.4,
        south: 36.2,
        east: 43.2,
        west: 42.9,
        tolerance: 0.15
    },
    'Erbil': {
        north: 36.25,
        south: 36.05,
        east: 44.15,
        west: 43.85,
        tolerance: 0.15
    },
    'Sulaymaniyah': {
        north: 35.6,
        south: 35.4,
        east: 45.5,
        west: 45.3,
        tolerance: 0.15
    },
    'Kirkuk': {
        north: 35.5,
        south: 35.3,
        east: 44.4,
        west: 44.2,
        tolerance: 0.15
    },
    'Dohuk': {
        north: 37.0,
        south: 36.8,
        east: 43.0,
        west: 42.8,
        tolerance: 0.15
    },

    // Central Iraq
    'Baghdad': {
        north: 33.4152,
        south: 33.2152,
        east: 44.5212,
        west: 44.2321,
        tolerance: 0.15
    },
    'Ramadi': {
        north: 33.45,
        south: 33.25,
        east: 43.4,
        west: 43.2,
        tolerance: 0.15
    },
    'Fallujah': {
        north: 33.4,
        south: 33.2,
        east: 43.9,
        west: 43.7,
        tolerance: 0.15
    },
    'Samarra': {
        north: 34.2,
        south: 34.0,
        east: 43.9,
        west: 43.7,
        tolerance: 0.15
    },
    'Baqubah': {
        north: 33.8,
        south: 33.6,
        east: 44.7,
        west: 44.5,
        tolerance: 0.15
    },
    'Tikrit': {
        north: 34.7,
        south: 34.5,
        east: 43.8,
        west: 43.6,
        tolerance: 0.15
    },

    // Southern Iraq
    'Basra': {
        north: 30.7,
        south: 30.4,
        east: 48.0,
        west: 47.6,
        tolerance: 0.15
    },
    'Nasiriyah': {
        north: 31.15,
        south: 30.95,
        east: 46.35,
        west: 46.15,
        tolerance: 0.15
    },
    'Najaf': {
        north: 32.05,
        south: 31.85,
        east: 44.4,
        west: 44.2,
        tolerance: 0.15
    },
    'Karbala': {
        north: 32.7,
        south: 32.5,
        east: 44.1,
        west: 43.9,
        tolerance: 0.15
    },
    'Hillah': {
        north: 32.5,
        south: 32.3,
        east: 44.5,
        west: 44.3,
        tolerance: 0.15
    },
    'Diwaniyah': {
        north: 32.05,
        south: 31.85,
        east: 45.0,
        west: 44.8,
        tolerance: 0.15
    },
    'Samawah': {
        north: 31.45,
        south: 31.25,
        east: 45.35,
        west: 45.15,
        tolerance: 0.2
    },
    'Kut': {
        north: 32.55,
        south: 32.35,
        east: 45.9,
        west: 45.7,
        tolerance: 0.15
    },
    'Amarah': {
        north: 31.85,
        south: 31.35,
        east: 47.65,
        west: 47.15,
        tolerance: 0.25  // Increased tolerance for wider coverage
    },

    // Additional Major Cities
    'Kufa': {
        north: 32.05,
        south: 31.85,
        east: 44.5,
        west: 44.3,
        tolerance: 0.15
    },
    'Zubayr': {
        north: 30.4,
        south: 30.2,
        east: 47.8,
        west: 47.6,
        tolerance: 0.15
    },
    'Muqdadiyah': {
        north: 33.9,
        south: 33.7,
        east: 45.1,
        west: 44.9,
        tolerance: 0.15
    }
};

export const detectCity = (lat, lon) => {
    if (!lat || !lon) return 'Unknown';

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) return 'Unknown';

    console.log(`Checking coordinates: ${latitude}, ${longitude}`);

    for (const [city, bounds] of Object.entries(CITY_BOUNDARIES)) {
        const tolerance = bounds.tolerance || 0.15;
        
        if (latitude <= (bounds.north + tolerance) && 
            latitude >= (bounds.south - tolerance) && 
            longitude <= (bounds.east + tolerance) && 
            longitude >= (bounds.west - tolerance)) {
            
            console.log(`Found match: ${city} for coordinates: ${latitude}, ${longitude}`);
            return city;
        }
    }

    // Region detection for areas that don't match specific cities
    if (latitude >= 33.0 && latitude <= 33.5) return 'Baghdad Region';
    if (latitude >= 30.3 && latitude <= 30.8) return 'Basra Region';
    if (latitude >= 36.1 && latitude <= 36.5) return 'Mosul Region';
    if (latitude >= 35.2 && latitude <= 35.6) return 'Kirkuk Region';
    if (latitude >= 31.2 && latitude <= 31.8 && longitude >= 45.0 && longitude <= 45.5) return 'Muthanna Region';
    if (latitude >= 31.5 && latitude <= 32.1 && longitude >= 44.8 && longitude <= 45.3) return 'Qadisiyah Region';
    if (latitude >= 32.3 && latitude <= 32.7 && longitude >= 44.2 && longitude <= 44.6) return 'Babil Region';
    if (latitude >= 31.35 && latitude <= 31.85 && longitude >= 47.15 && longitude <= 47.65) {
        return 'Maysan Region';
    }
    if (latitude >= 32.3 && latitude <= 32.7 && longitude >= 45.7 && longitude <= 46.1) return 'Wasit Region';
    if (latitude >= 34.3 && latitude <= 34.7 && longitude >= 43.5 && longitude <= 43.9) return 'Salah ad Din Region';
    if (latitude >= 33.2 && latitude <= 33.6 && longitude >= 43.2 && longitude <= 43.6) return 'Anbar Region';
    if (latitude >= 33.6 && latitude <= 34.0 && longitude >= 44.5 && longitude <= 44.9) return 'Diyala Region';
    if (latitude >= 31.45 && latitude <= 31.75 && longitude >= 47.25 && longitude <= 47.55) {
        return 'Central Maysan';
    }

    console.log(`No match found for coordinates: ${latitude}, ${longitude}`);
    return 'Other';
};

export const groupSitesByCity = (sites) => {
    console.log('Grouping sites by city...');
    const cityGroups = {};

    sites.forEach(site => {
        const city = detectCity(parseFloat(site.LAT), parseFloat(site.LON));
        
        if (!cityGroups[city]) {
            cityGroups[city] = {
                totalSites: 0,
                totalVisits: 0,
                sites: [],
                averageVisits: 0,
                coordinates: []
            };
        }

        cityGroups[city].totalSites++;
        cityGroups[city].totalVisits += site.Number_of_Visits;
        cityGroups[city].sites.push(site);
        cityGroups[city].coordinates.push([site.LAT, site.LON]);
    });

    Object.entries(cityGroups).forEach(([city, group]) => {
        group.averageVisits = Math.round(group.totalVisits / group.totalSites);
        console.log(`${city}: ${group.totalSites} sites, ${group.totalVisits} total visits`);
    });

    return cityGroups;
};