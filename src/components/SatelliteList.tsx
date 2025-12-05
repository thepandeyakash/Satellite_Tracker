
import { useSatellite } from "../context/SatelliteContext";
import type { SatelliteSummary } from "../services/n2yoAPI";

export default function SatelliteList() {
  const {
    satellitesAbove,
    loadingSatellites,
    satellitesError,
    selectedSatellite,
    setSelectedSatellite,
    refreshSatellites,
    lastUpdated,
  } = useSatellite();

  const onTrack = (sat: SatelliteSummary) => {
    setSelectedSatellite(sat);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Satellites Above</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshSatellites()}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            aria-label="Refresh satellites"
          >
            Refresh
          </button>
          <div className="text-xs text-gray-500">
            {lastUpdated ? `Updated ${(new Date(lastUpdated)).toLocaleTimeString()}` : "Not loaded yet"}
          </div>
        </div>
      </div>

      {loadingSatellites && <div className="text-sm text-gray-600">Loading satellites…</div>}
      {satellitesError && (
        <div className="text-sm text-red-600 mb-2">
          {satellitesError}
          <div>
            <button onClick={() => refreshSatellites()} className="mt-2 px-3 py-1 bg-red-100 rounded text-sm">
              Retry
            </button>
          </div>
        </div>
      )}

      {!loadingSatellites && !satellitesError && satellitesAbove.length === 0 && (
        <div className="text-sm text-gray-600">No satellites above your location right now.</div>
      )}

      {!loadingSatellites && satellitesAbove.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Name</th>
                <th className="py-2">NORAD</th>
                <th className="py-2">Alt (km)</th>
                <th className="py-2">El/Az</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {satellitesAbove.map((s) => {
                const isSelected = selectedSatellite?.satid === s.satid;
                return (
                  <tr key={s.satid} className={`${isSelected ? "bg-blue-50" : ""} border-b`}>
                    <td className="py-2">{s.satname}</td>
                    <td className="py-2">{s.satid}</td>
                    <td className="py-2">{s.satalt != null ? s.satalt.toFixed(1) : "-"}</td>
                    <td className="py-2">
                      {s.elevation != null ? `${s.elevation}°` : "-"} / {s.azimuth != null ? `${s.azimuth}°` : "-"}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => onTrack(s)}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        {isSelected ? "Tracking" : "Track"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
