import React, { createContext, useContext, useState, ReactNode } from 'react';

export type City = 'fes' | 'rabat' | 'casa';
export type Language = 'fr' | 'ar' | 'en';

interface CityContextType {
  activeCity: City;
  setActiveCity: (city: City) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  getCityColor: (city: City) => string;
  getCityColorLight: (city: City) => string;
  getCityLabel: (city: City) => string;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

const CITY_COLORS: Record<City, { main: string; light: string; label: string }> = {
  fes: {
    main: '#C4532A',
    light: '#FAECE7',
    label: 'Fès',
  },
  rabat: {
    main: '#1B4F8A',
    light: '#E6F1FB',
    label: 'Rabat',
  },
  casa: {
    main: '#6B3FA0',
    light: '#EEEDFE',
    label: 'Casablanca',
  },
};

export function CityProvider({ children }: { children: ReactNode }) {
  const [activeCity, setActiveCity] = useState<City>('rabat');
  const [language, setLanguage] = useState<Language>('fr');

  const getCityColor = (city: City) => CITY_COLORS[city].main;
  const getCityColorLight = (city: City) => CITY_COLORS[city].light;
  const getCityLabel = (city: City) => CITY_COLORS[city].label;

  const value: CityContextType = {
    activeCity,
    setActiveCity,
    language,
    setLanguage,
    getCityColor,
    getCityColorLight,
    getCityLabel,
  };

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within CityProvider');
  }
  return context;
}
