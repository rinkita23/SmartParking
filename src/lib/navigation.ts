const PARKING_DESTINATION = "Nexus Ahmedabad One Mall";
const PARKING_LOCATION_LABEL = "Nexus Ahmedabad One Mall";

export function navigateToParking() {
  const destinationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(PARKING_DESTINATION)}`;

  const openUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!("geolocation" in navigator)) {
    openUrl(destinationUrl);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const origin = `${position.coords.latitude},${position.coords.longitude}`;
      openUrl(
        `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(PARKING_DESTINATION)}&travelmode=driving`,
      );
    },
    () => {
      openUrl(destinationUrl);
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
  );
}

export function getParkingLocationLabel() {
  return PARKING_LOCATION_LABEL;
}
