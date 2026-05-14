import MapContainer from './MapContainer';

export default function MapPreload() {
  return (
    <div
      aria-hidden="true"
      className="fixed -left-[9999px] top-0 w-[512px] h-[512px] overflow-hidden pointer-events-none opacity-0"
    >
      <MapContainer center={[39.1255, 117.1901]} zoom={11} mapTypeId="satellite" />
    </div>
  );
}
