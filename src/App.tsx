/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Header from './components/Header';
import WeatherHome from './views/WeatherHome';
import HealthView from './views/HealthView';
import WarningMapView from './views/WarningMapView';
import EcoView from './views/EcoView';
import FloodView from './views/FloodView';
import LiveWeatherView from './views/LiveWeatherView';
import ScienceView from './views/ScienceView';
import MountainView from './views/MountainView';
import TrafficRealtimeMetroView from './views/TrafficRealtimeMetroView';
import ConventionalWeatherView from './views/ConventionalWeatherView';
import RadarView from './views/RadarView';
import TourismView from './views/TourismView';
import ChatPage from './views/ChatPage';
import AIAssistant from './components/AIAssistant';
import MapPreload from './components/MapPreload';
import { motion, AnimatePresence } from 'framer-motion';

export type ViewType = 'weather' | 'map' | 'health' | 'tourism' | 'flood' | 'traffic' | 'mountain' | 'science' | 'eco' | 'real' | 'conventional';

export const TIANJIN_DISTRICTS = [
  '和平区', '河东区', '河西区', '南开区', '河北区', '红桥区', 
  '滨海新区', '东丽区', '西青区', '津南区', '北辰区', '武清区', 
  '宝坻区', '宁河区', '静海区', '蓟州区'
];

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('weather');
  const [selectedDistrict, setSelectedDistrict] = useState('和平区');
  const [showRadar, setShowRadar] = useState(false);
  const [isOpenChat, setIsOpenChat] = useState(false);
  const [chatInitialInput, setChatInitialInput] = useState<string | undefined>();
  const [chatAssistantName, setChatAssistantName] = useState<string>('津小晴');

  const handleOpenChat = (initialInput?: string, assistantName?: string) => {
    setChatAssistantName(assistantName || '津小晴');
    setChatInitialInput(initialInput);
    setIsOpenChat(true);
  };

  const handleNavigate = (view: ViewType) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderView = () => {
    switch (activeView) {
      case 'weather':
        return <WeatherHome onNavigate={handleNavigate} district={selectedDistrict} />;
      case 'health':
        return <HealthView district={selectedDistrict} />;
      case 'map':
        return <WarningMapView onBack={() => setActiveView('weather')} />;
      case 'flood':
        return <FloodView onBack={() => setActiveView('weather')} />;
      case 'real':
        return <LiveWeatherView />;
      case 'science':
        return <ScienceView />;
      case 'mountain':
        return <MountainView onBack={() => setActiveView('weather')} />;
      case 'traffic':
        return <TrafficRealtimeMetroView onBack={() => setActiveView('weather')} />;
      case 'eco':
        return <EcoView />;
      case 'conventional':
        return <ConventionalWeatherView onShowRadar={() => setShowRadar(true)} />;
      case 'tourism':
        return <TourismView onBack={() => setActiveView('weather')} />;
      default:
        return <WeatherHome onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary-fixed selection:text-on-primary-fixed">
      <MapPreload />
      <Header 
        location={selectedDistrict} 
        showBack={activeView !== 'weather'}
        onBack={() => setActiveView('weather')}
        onLocationClick={() => {}} 
        districts={TIANJIN_DISTRICTS}
        onDistrictSelect={setSelectedDistrict}
      />
      
      <main className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showRadar && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100]"
          >
            <RadarView onBack={() => setShowRadar(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AIAssistant onOpenChat={handleOpenChat} />
      
      <AnimatePresence>
        {isOpenChat && (
          <ChatPage
            onClose={() => { setIsOpenChat(false); setChatInitialInput(undefined); }}
            initialInput={chatInitialInput}
            assistantName={chatAssistantName}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

