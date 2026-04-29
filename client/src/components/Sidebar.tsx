import React, { useState } from 'react';
import { useCity, City, Language } from '@/contexts/CityContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface HistoryItem {
  id: string;
  title: string;
  type: string;
  date: Date;
  city: City;
}

export default function Sidebar() {
  const { activeCity, setActiveCity, language, setLanguage, getCityColor, getCityLabel } = useCity();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const cities: City[] = ['fes', 'rabat', 'casa'];
  const languages: Language[] = ['fr', 'ar', 'en'];
  const languageLabels: Record<Language, string> = {
    fr: 'FR',
    ar: 'AR',
    en: 'EN',
  };

  const handleNewSimulation = () => {
    // Trigger new conversation
    window.dispatchEvent(new CustomEvent('newSimulation'));
  };

  const handleCityChange = (city: City) => {
    setActiveCity(city);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="w-[280px] h-screen bg-background border-r border-border flex flex-col">
      {/* Header avec logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg font-bold text-foreground">Aqar.ma</h1>
            <p className="text-xs text-muted-foreground">Assistant fiscal</p>
          </div>
        </div>
      </div>

      {/* Sélecteur de ville */}
      <div className="px-4 py-4 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Ville</p>
        <div className="flex gap-2">
          {cities.map(city => (
            <motion.button
              key={city}
              onClick={() => handleCityChange(city)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeCity === city
                  ? 'text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              style={
                activeCity === city
                  ? {
                      backgroundColor: getCityColor(city),
                      boxShadow: `0 0 12px ${getCityColor(city)}20`,
                    }
                  : {}
              }
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {getCityLabel(city)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Sélecteur de langue */}
      <div className="px-4 py-4 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Langue</p>
        <div className="flex gap-2">
          {languages.map(lang => (
            <motion.button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                language === lang
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {languageLabels[lang]}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Historique */}
      <div className="flex-1 flex flex-col px-4 py-4 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Historique</p>
        <ScrollArea className="flex-1">
          {history.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Aucune conversation</p>
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {history.map(item => (
                <motion.button
                  key={item.id}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: getCityColor(item.city) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.type}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Bouton nouvelle simulation */}
      <div className="px-4 py-4 border-b border-border">
        <motion.button
          onClick={handleNewSimulation}
          className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          Nouvelle simulation
        </motion.button>
      </div>

      {/* Profil utilisateur */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold"
            style={{
              backgroundImage: `linear-gradient(135deg, ${getCityColor(activeCity)}, ${getCityColor(activeCity)}dd)`,
            }}
          >
            D
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Mode démo</p>
            <p className="text-xs text-muted-foreground truncate">Sans compte / sans auth</p>
          </div>
        </div>
      </div>
    </div>
  );
}
