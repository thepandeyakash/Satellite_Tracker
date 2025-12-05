import { useSatellite } from "./context/SatelliteContext";
import Dashboard from "./pages/Dashboard";




function App() {
  const {observerLocation} = useSatellite();
  console.log("Observer Location:", observerLocation);

  return (
    <div className="p-6">
      <Dashboard />
    </div>
  );
}

export default App
