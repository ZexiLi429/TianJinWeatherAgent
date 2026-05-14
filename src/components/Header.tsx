import { Menu, MapPin, ChevronLeft, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  location: string;
  showBack?: boolean;
  onBack?: () => void;
  onLocationClick?: () => void;
  districts?: string[];
  onDistrictSelect?: (district: string) => void;
}

export default function Header({ 
  location, 
  showBack, 
  onBack, 
  districts = [], 
  onDistrictSelect 
}: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-14 bg-white/60 backdrop-blur-md border-b border-white/20">
      <div className="flex items-center gap-2">
        {showBack ? (
          <button 
            onClick={onBack}
            className="p-2 hover:bg-surface-container-high/50 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-primary" />
          </button>
        ) : (
          <button className="p-2 hover:bg-surface-container-high/50 rounded-full transition-colors">
            <Menu className="w-5 h-5 text-primary" />
          </button>
        )}
        <span className="font-headline font-bold text-lg text-primary">风和气象</span>
      </div>
      
      <div className="relative">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 text-primary font-bold hover:bg-primary/5 px-2 py-1 rounded-lg transition-colors"
        >
          <MapPin className="w-4 h-4" />
          <span className="font-headline text-md">{location}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 max-h-64 overflow-y-auto bg-white rounded-xl shadow-2xl border border-primary/10 z-50 py-2 animate-in fade-in zoom-in duration-200">
              {districts.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    onDistrictSelect?.(d);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-primary/5 transition-colors text-sm ${location === d ? 'text-primary font-bold bg-primary/5' : 'text-on-surface'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
