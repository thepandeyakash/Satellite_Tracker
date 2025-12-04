import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type ObserverLocation = {
    lat: number;
    lng: number;
    alt: number;
};

type ObserverContextType = {
    observerLocation: ObserverLocation;
    setObserverLocation: (Location: ObserverLocation) => void;
};

const ObserverContext = createContext<ObserverContextType | undefined>(undefined);

export const ObserverProvider = ({ children }: { children: ReactNode }) => {
    const [observerLocation, setObserverLocation] = useState<ObserverLocation>({
        lat: 28.6139, // default: New Delhi
        lng: 77.2090,
        alt: 0,
    });

    return (
        <ObserverContext.Provider value={{observerLocation, setObserverLocation}}>
            {children}
        </ObserverContext.Provider>
    );
};

export const useObserver = () => {
    const context = useContext(ObserverContext);

    if (!context) {
        throw new Error("useObserver must be used within an ObserverProvider");
    }
    return context;
}
