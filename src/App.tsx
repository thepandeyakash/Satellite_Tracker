import { useObserver } from "./context/ObserverContext"




function App() {
  const {observerLocation} = useObserver();
  console.log("Observer Location:", observerLocation);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white text-3xl">
      Satellite Tracker Setup Complete 🚀
    </div>
  )
}

export default App
