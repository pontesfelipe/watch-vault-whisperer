export function tripEventPrefill(
  trip: { location: string; notes: string },
  event: { location: string; purpose: string },
) {
  return {
    location: trip.location.trim() ? trip.location : event.location,
    purpose: trip.notes.trim() ? trip.notes : event.purpose,
  };
}