import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { Button, Typography, Dialog, DialogContent } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import strings from '../localization/strings';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const getMarkerColor = (index) => {
  if (index === 0) return 'red';
  if (index === 1) return 'orange';
  if (index === 2) return 'yellow';
  return 'blue';
};

const createCustomIcon = (visits, index) => {
  return L.divIcon({
    html: `<div style="background-color: ${getMarkerColor(index)}; width: 24px; height: 24px; border-radius: 12px; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold;">${visits}</div>`,
    className: 'custom-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const isValidCoordinate = (lat, lon) => {
  const validLat = typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
  const validLon = typeof lon === 'number' && !isNaN(lon) && lon >= -180 && lon <= 180;
  return validLat && validLon;
};

function SiteMap({ sites }) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!sites || sites.length === 0) {
    return <div>{strings.noSiteDataAvailable}</div>;
  }

  // Filter out sites with invalid coordinates and convert strings to numbers
  const validSites = sites.filter(site => {
    const lat = parseFloat(site.LAT);
    const lon = parseFloat(site.LON);
    return isValidCoordinate(lat, lon);
  });

  if (validSites.length === 0) {
    return <div>{strings.noValidCoordinates}</div>;
  }

  // Use the first valid site's coordinates as center
  const center = [parseFloat(validSites[0].LAT), parseFloat(validSites[0].LON)];

  // Group sites by coordinates
  const groupedSites = validSites.reduce((acc, site) => {
    const lat = parseFloat(site.LAT);
    const lon = parseFloat(site.LON);
    const key = `${lat},${lon}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(site);
    return acc;
  }, {});

  const sortedGroupedSites = Object.entries(groupedSites)
    .sort((a, b) => {
      const totalVisitsA = a[1].reduce((sum, site) => sum + site.Number_of_Visits, 0);
      const totalVisitsB = b[1].reduce((sum, site) => sum + site.Number_of_Visits, 0);
      return totalVisitsB - totalVisitsA;
    });

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const mapContent = (
    <MapContainer center={center} zoom={13} style={{ height: isFullScreen ? '90vh' : '600px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <ZoomControl position="topright" />
      {sortedGroupedSites.map(([coords, siteGroup], index) => {
        const [lat, lon] = coords.split(',').map(Number);
        if (!isValidCoordinate(lat, lon)) return null;

        const totalVisits = siteGroup.reduce((sum, site) => sum + (site.Number_of_Visits || 0), 0);

        return (
          <Marker 
            key={index} 
            position={[lat, lon]}
            icon={createCustomIcon(totalVisits, index)}
          >
            <Popup>
              <div>
                <Typography variant="h6">{strings.sitesAtLocation} ({strings.totalVisits}: {totalVisits}):</Typography>
                {siteGroup.map((site, siteIndex) => (
                  <div key={siteIndex}>
                    <Typography variant="subtitle1">{site.Site_Name || site.SITE_NAME || 'Unknown'}</Typography>
                    <Typography>{strings.siteId}: {site.Site_ID || site.SITE_ID}</Typography>
                    <Typography>{strings.numberOfVisits}: {site.Number_of_Visits || 0}</Typography>
                    <Typography>{strings.latitude}: {site.LAT}</Typography>
                    <Typography>{strings.longitude}: {site.LON}</Typography>
                  </div>
                ))}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );

  return (
    <div style={{ position: 'relative' }}>
      <Button
        variant="contained"
        color="primary"
        onClick={toggleFullScreen}
        style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}
      >
        {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
      </Button>
      {!isFullScreen && mapContent}
      <Dialog
        fullScreen
        open={isFullScreen}
        onClose={toggleFullScreen}
      >
        <DialogContent>
          {mapContent}
          <Button variant="contained" onClick={toggleFullScreen} sx={{ mt: 2 }}>
            {strings.exitFullScreenButton}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SiteMap;