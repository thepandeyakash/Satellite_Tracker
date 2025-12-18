
import ObserverLocationForm from "../components/ObserverLocationForm";
import SatelliteList from "../components/SatelliteList";
import { useSatellite } from "../context/SatelliteContext";
import MapView from "../components/MapView";


export default function Dashboard() {
  const { observerLocation, selectedSatellite } = useSatellite();

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="col-span-1 space-y-4">
        <ObserverLocationForm />
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <h4 className="font-semibold mb-2">Observer</h4>
          <div className="text-sm text-gray-700">
            Lat: {observerLocation.lat.toFixed(4)} <br />
            Lng: {observerLocation.lng.toFixed(4)} <br />
            Alt: {observerLocation.alt}
          </div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <h4 className="font-semibold mb-2">Selected Satellite</h4>
          {selectedSatellite ? (
            <div className="text-sm">
              <div className="font-medium">{selectedSatellite.satname}</div>
              <div className="text-xs text-gray-600">NORAD: {selectedSatellite.satid}</div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No satellite selected</div>
          )}
        </div>
      </div>

      <div className="col-span-2">
        <SatelliteList />
        <div className="mt-6">
          <MapView />
        </div>
      </div>
    </div>
  );
}
