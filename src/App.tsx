import { useObserver } from "./context/ObserverContext"
import ObserverLocationForm from "./components/ObserverLocationForm";




function App() {
  const {observerLocation} = useObserver();
  console.log("Observer Location:", observerLocation);

  return (
    <div className="p-6">
      <ObserverLocationForm />
    </div>
  );
}

export default App
