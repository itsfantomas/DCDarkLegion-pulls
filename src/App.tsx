import { useState, useMemo, useEffect } from 'react';

type Tier = 'White' | 'Blue' | 'Purple' | 'Gold' | 'Red';

interface StarLevel {
  tier: Tier;
  stars: number;
  totalShards: number;
  copies: number;
}

const SHARDS_PER_COPY = 40;
const MAX_COPIES = 26; // 1 Unlock + 25 Copies
const MAX_SHARDS = (MAX_COPIES - 1) * SHARDS_PER_COPY; // 1000

const STAR_DATA: StarLevel[] = [
  { tier: 'White', stars: 1, totalShards: 2, copies: 1 },
  { tier: 'White', stars: 2, totalShards: 5, copies: 1 },
  { tier: 'White', stars: 3, totalShards: 10, copies: 1 },
  { tier: 'White', stars: 4, totalShards: 20, copies: 1 },
  { tier: 'White', stars: 5, totalShards: 40, copies: 2 },
  { tier: 'Blue', stars: 1, totalShards: 60, copies: 2 },
  { tier: 'Blue', stars: 2, totalShards: 80, copies: 3 },
  { tier: 'Blue', stars: 3, totalShards: 100, copies: 3 },
  { tier: 'Blue', stars: 4, totalShards: 130, copies: 4 },
  { tier: 'Blue', stars: 5, totalShards: 160, copies: 5 },
  { tier: 'Purple', stars: 1, totalShards: 200, copies: 6 },
  { tier: 'Purple', stars: 2, totalShards: 240, copies: 7 },
  { tier: 'Purple', stars: 3, totalShards: 280, copies: 8 },
  { tier: 'Purple', stars: 4, totalShards: 320, copies: 9 },
  { tier: 'Purple', stars: 5, totalShards: 360, copies: 10 },
  { tier: 'Gold', stars: 1, totalShards: 400, copies: 11 },
  { tier: 'Gold', stars: 2, totalShards: 440, copies: 12 },
  { tier: 'Gold', stars: 3, totalShards: 480, copies: 13 },
  { tier: 'Gold', stars: 4, totalShards: 540, copies: 14 },
  { tier: 'Gold', stars: 5, totalShards: 600, copies: 16 },
  { tier: 'Red', stars: 1, totalShards: 680, copies: 18 },
  { tier: 'Red', stars: 2, totalShards: 760, copies: 20 },
  { tier: 'Red', stars: 3, totalShards: 840, copies: 22 },
  { tier: 'Red', stars: 4, totalShards: 920, copies: 24 },
  { tier: 'Red', stars: 5, totalShards: 1000, copies: 26 },
];

const TIER_COLORS = {
  White: { active: 'bg-gray-200 text-gray-900 border-gray-200 shadow-[0_0_10px_rgba(229,231,235,0.4)]', outline: 'border-gray-400 text-gray-300 hover:bg-gray-800' },
  Blue: { active: 'bg-blue-500 text-white border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]', outline: 'border-blue-500/50 text-blue-400 hover:bg-blue-500/20' },
  Purple: { active: 'bg-purple-500 text-white border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]', outline: 'border-purple-500/50 text-purple-400 hover:bg-purple-500/20' },
  Gold: { active: 'bg-yellow-400 text-gray-900 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]', outline: 'border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/20' },
  Red: { active: 'bg-red-500 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]', outline: 'border-red-500/50 text-red-400 hover:bg-red-500/20' },
};

// ==================== SCHEDULE PLANNER UTILS ====================
interface BannerNode {
  id: string;
  name: string;
  type: 'Release' | 'Rerun';
  customStartDate: string;
  decision: 'Skip' | 'Pull';
  budget: number;
  isOwned?: boolean;
  currentTier?: Tier;
  currentStar?: number;
  extraShards?: number;
}

const parseDateString = (dateStr: string) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date();
  const parsedDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
};

const formatDate = (date: Date) => {
  if (isNaN(date.getTime())) return 'Invalid Date';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const calculateSchedule = (
  banners: BannerNode[], 
  trackingStartDate: string, 
  initialAnvils: number, 
  isCustomIncome: boolean, 
  customMonthlyAnvils: number
) => {
  if (!Array.isArray(banners)) return { placed: [], results: {} };
  
  let nextReleaseStart = parseDateString(trackingStartDate);
  let nextRerunStart = parseDateString(trackingStartDate);
  
  const placed = banners.map(b => {
    let sDate: Date;
    if (b.customStartDate) {
      sDate = parseDateString(b.customStartDate);
      if (b.type === 'Release') nextReleaseStart = new Date(sDate);
      else nextRerunStart = new Date(sDate);
    } else {
      sDate = b.type === 'Release' ? new Date(nextReleaseStart) : new Date(nextRerunStart);
    }
    
    const duration = b.type === 'Release' ? 28 : 14;
    const eDate = new Date(sDate);
    eDate.setDate(eDate.getDate() + duration - 1);
    
    const nextDate = new Date(eDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    if (b.type === 'Release') nextReleaseStart = nextDate;
    else nextRerunStart = nextDate;
    
    return { ...b, startDate: sDate, endDate: eDate };
  });

  const sorted = [...placed].sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
  
  let simDate = parseDateString(trackingStartDate);
  const maxDate = sorted.length > 0 ? new Date(sorted[sorted.length - 1].endDate) : new Date(simDate);
  
  let currAnvils = initialAnvils || 0;
  let currGems = 0;
  const results: Record<string, { anvilsBefore: number, anvilsAfter: number, gemsCost: number }> = {};
  
  let safeguards = 0;
  if (isNaN(simDate.getTime()) || isNaN(maxDate.getTime())) return { placed, results };

  const dailyCustomAnvils = isCustomIncome ? (customMonthlyAnvils / 30) : 0;

  while(simDate <= maxDate && safeguards < 3650) { 
    currGems += 180;
    const day = simDate.getDay();
    if (day === 0) { 
      currGems += 3000;
    }

    if (isCustomIncome) {
      currAnvils += dailyCustomAnvils;
    } else {
      currAnvils += 7;
      if (day === 1) currAnvils += 4; 
      if (day === 0) currAnvils += 40; 
    }
    
    sorted.forEach(b => {
      if (b.endDate.getTime() === simDate.getTime()) {
         const anvilsBefore = Math.floor(currAnvils);
         const budget = Number(b.budget) || 0;
         if (b.decision === 'Pull') currAnvils -= budget;
         results[b.id] = { anvilsBefore, anvilsAfter: Math.floor(currAnvils), gemsCost: currGems };
      }
    });
    
    simDate.setDate(simDate.getDate() + 1);
    safeguards++;
  }
  
  return { placed, results };
};

// ==================== UI COMPONENTS ====================
const NeonArrows = () => (
  <div className="hidden md:flex items-center justify-center shrink-0 mx-2 mt-4">
    <span className="text-purple-500 font-bold tracking-widest drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] text-xl">
      &gt;&gt;
    </span>
  </div>
);

const CustomNumberInput = ({ value, onChange, max, step = 1, placeholder = '' }: { value: string, onChange: (v: string) => void, max?: number, step?: number, placeholder?: string }) => {
  const handleUp = () => {
    const num = parseFloat(value) || 0;
    const next = num + step;
    if (max !== undefined && next > max) return;
    onChange(Number(next.toFixed(2)).toString());
  };

  const handleDown = () => {
    const num = parseFloat(value) || 0;
    const next = Math.max(0, num - step);
    onChange(Number(next.toFixed(2)).toString());
  };

  return (
    <div className="relative">
      <input type="number" min="0" step={step} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-gray-950 border border-gray-600 rounded p-3 pr-10 text-lg focus:border-purple-500 outline-none transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" />
      <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-center gap-1">
        <button onClick={handleUp} className="text-gray-500 hover:text-purple-400 bg-gray-900 rounded p-0.5 transition-colors border border-gray-700 hover:border-purple-500">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
        </button>
        <button onClick={handleDown} className="text-gray-500 hover:text-purple-400 bg-gray-900 rounded p-0.5 transition-colors border border-gray-700 hover:border-purple-500">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'total' | 'path' | 'schedule'>('schedule');
  const [luckLevel, setLuckLevel] = useState<number>(100);

  const [anvilsStr, setAnvilsStr] = useState<string>('2600');
  const [expandedTierTotal, setExpandedTierTotal] = useState<Tier | null>(null);

  const [pathCurrentTier, setPathCurrentTier] = useState<Tier>('White');
  const [pathCurrentStar, setPathCurrentStar] = useState<number>(1);
  const [extraShardsStr, setExtraShardsStr] = useState<string>('0');
  const [expandedTierPath, setExpandedTierPath] = useState<Tier | null>('White');
  const [pathTargetTier, setPathTargetTier] = useState<Tier>('Red');
  const [pathTargetStar, setPathTargetStar] = useState<number>(5);
  const [expandedTargetTierPath, setExpandedTargetTierPath] = useState<Tier | null>('Red');

  const [bannerFilter, setBannerFilter] = useState<'All' | 'Active' | 'Pulls'>('All');

  const [schedule, setSchedule] = useState<BannerNode[]>(() => {
    try {
      const saved = localStorage.getItem('dc-legion-schedule');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });
  
  const [trackingSettings, setTrackingSettings] = useState(() => {
    const defaultSettings = { 
      startDate: new Date().toISOString().split('T')[0], 
      anvils: 0,
      isCustomIncome: false,
      customMonthlyAnvils: 300
    };
    try {
      const saved = localStorage.getItem('dc-legion-tracking');
      if (!saved) return defaultSettings;
      const parsed = JSON.parse(saved);
      return { ...defaultSettings, ...parsed }; 
    } catch (e) {
      return defaultSettings;
    }
  });

  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('dc-legion-schedule', JSON.stringify(schedule)); }, [schedule]);
  useEffect(() => { localStorage.setItem('dc-legion-tracking', JSON.stringify(trackingSettings)); }, [trackingSettings]);

  // ==================== TOTAL COST ЛОГИКА ====================
  const validAnvils = isNaN(parseFloat(anvilsStr)) ? 0 : Math.max(0, parseFloat(anvilsStr));
  const cappedAnvils = Math.min(validAnvils, MAX_COPIES * luckLevel);
  const calculatedCopies = Math.min(cappedAnvils / luckLevel, MAX_COPIES);
  const calculatedShards = Math.max(0, Math.min((calculatedCopies - 1) * SHARDS_PER_COPY, MAX_SHARDS));

  const totalCurrentStar = useMemo(() => {
    let current = STAR_DATA[0];
    for (let i = 0; i < STAR_DATA.length; i++) {
      if (calculatedShards >= STAR_DATA[i].totalShards) current = STAR_DATA[i];
      else break;
    }
    return current;
  }, [calculatedShards]);

  const handleTotalAnvilsChange = (val: string) => {
    if (val === '') { setAnvilsStr(''); return; }
    const num = parseInt(val, 10);
    if (!isNaN(num)) setAnvilsStr(Math.max(0, num).toString());
  };

  const handleTotalCopiesChange = (val: string) => {
    if (val === '') { setAnvilsStr(''); return; }
    const num = parseFloat(val);
    if (!isNaN(num)) setAnvilsStr(Math.round(Math.min(Math.max(0, num), MAX_COPIES) * luckLevel).toString());
  };

  const handleTotalShardsChange = (val: string) => {
    if (val === '') { setAnvilsStr(''); return; }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const capped = Math.min(Math.max(0, num), MAX_SHARDS);
      setAnvilsStr(Math.round(((capped / SHARDS_PER_COPY) + 1) * luckLevel).toString());
    }
  };

  const handleTotalStarSelect = (tier: Tier, stars: number) => {
    const target = STAR_DATA.find((s) => s.tier === tier && s.stars === stars);
    if (target) setAnvilsStr(Math.round(((target.totalShards / SHARDS_PER_COPY) + 1) * luckLevel).toString());
  };

  // ==================== PATH TO TARGET ЛОГИКА ====================
  const pathBaseTarget = STAR_DATA.find(s => s.tier === pathCurrentTier && s.stars === pathCurrentStar);
  const pathBaseShards = pathBaseTarget ? pathBaseTarget.totalShards : 0;
  const parsedExtraShards = isNaN(parseFloat(extraShardsStr)) ? 0 : Math.max(0, parseFloat(extraShardsStr));
  const totalOwnedShards = Math.min(pathBaseShards + parsedExtraShards, MAX_SHARDS);
  const pathFinalTarget = STAR_DATA.find(s => s.tier === pathTargetTier && s.stars === pathTargetStar);
  const pathTargetShards = pathFinalTarget ? pathFinalTarget.totalShards : 0;
  const remainingShards = Math.max(0, pathTargetShards - totalOwnedShards);
  const remainingCopies = Math.ceil(remainingShards / SHARDS_PER_COPY);
  const remainingAnvils = Math.round(remainingCopies * luckLevel);

  // ==================== SCHEDULE PLANNER ЛОГИКА ====================
  const { placed: placedBanners, results: scheduleResults } = useMemo(() => {
    return calculateSchedule(
      schedule, 
      trackingSettings.startDate, 
      trackingSettings.anvils,
      trackingSettings.isCustomIncome,
      trackingSettings.customMonthlyAnvils
    );
  }, [schedule, trackingSettings]);

  const handleAddBanner = () => {
    const newId = generateId();
    setSchedule([...schedule, { 
      id: newId, 
      name: '', 
      type: 'Release', 
      customStartDate: '', 
      decision: 'Skip', 
      budget: 300,
      isOwned: false,
      currentTier: 'White',
      currentStar: 1,
      extraShards: 0
    }]);
    setEditingBannerId(newId);
  };
  
  const handleDeleteBanner = (id: string) => {
    setSchedule(schedule.filter(b => b.id !== id));
    if (editingBannerId === id) setEditingBannerId(null);
  };
  
  const updateBanner = (id: string, field: keyof BannerNode, value: any) => setSchedule(schedule.map(b => b.id === id ? { ...b, [field]: value } : b));
  
  const moveBanner = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === schedule.length - 1) return;
    const newSchedule = [...schedule];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newSchedule[index], newSchedule[swapIndex]] = [newSchedule[swapIndex], newSchedule[index]];
    setSchedule(newSchedule);
  };

  const handleExport = () => {
    const dataToSave = { schedule, trackingSettings };
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dc_legion_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.schedule) setSchedule(parsed.schedule);
        if (parsed.trackingSettings) setTrackingSettings(parsed.trackingSettings);
        alert('Schedule successfully restored! 🎉');
      } catch (err) {
        alert('Error reading file. Make sure it is a valid backup JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your entire schedule? This cannot be undone!')) {
      setSchedule([]);
      setTrackingSettings({ startDate: new Date().toISOString().split('T')[0], anvils: 0, isCustomIncome: false, customMonthlyAnvils: 300 });
      localStorage.removeItem('dc-legion-schedule');
      localStorage.removeItem('dc-legion-tracking');
    }
  };

  // ==================== 🎲 МАГИЯ ПРЕДСКАЗАНИЯ 🎲 ====================
  const getProjectedStats = (b: BannerNode, luck: number) => {
    if (b.decision !== 'Pull' || !b.budget) return null;
    const pulledCopies = Math.floor(b.budget / luck);
    
    if (pulledCopies === 0) return { text: 'No copies 😢', color: 'text-gray-500' };

    const bOwned = b.isOwned || false;
    let finalShards = 0;
    
    if (bOwned) {
      const bTier = b.currentTier || 'White';
      const bStar = b.currentStar || 1;
      const bExtra = Number(b.extraShards) || 0;
      const baseTarget = STAR_DATA.find(s => s.tier === bTier && s.stars === bStar);
      const baseShards = baseTarget ? baseTarget.totalShards : 0;
      finalShards = baseShards + bExtra + (pulledCopies * SHARDS_PER_COPY);
    } else {
      finalShards = (pulledCopies - 1) * SHARDS_PER_COPY;
      if (finalShards < 0) finalShards = 0;
    }

    if (finalShards === 0 && !bOwned) {
      return { text: 'Base Unlock ✨', color: 'text-gray-300' };
    }

    const cappedShards = Math.min(finalShards, MAX_SHARDS);
    let current = STAR_DATA[0];
    for (let i = 0; i < STAR_DATA.length; i++) {
      if (cappedShards >= STAR_DATA[i].totalShards) current = STAR_DATA[i];
      else break;
    }

    const tierColorMap: Record<Tier, string> = {
      White: 'text-gray-300',
      Blue: 'text-blue-400',
      Purple: 'text-purple-400',
      Gold: 'text-yellow-400',
      Red: 'text-red-500'
    };

    return { text: `${current.tier} ${current.stars}★`, color: tierColorMap[current.tier] };
  };

  const editingBanner = schedule.find(b => b.id === editingBannerId);
  const finalResult = placedBanners.length > 0 ? scheduleResults[placedBanners[placedBanners.length - 1].id] : null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8 font-sans relative overflow-hidden flex flex-col items-center">
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle,rgba(168,85,247,0.4)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

      {/* МОДАЛЬНОЕ ОКНО ДЛЯ РЕДАКТИРОВАНИЯ БАННЕРА */}
      {editingBanner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gray-900 border border-purple-500/50 rounded-2xl p-6 w-full max-w-md shadow-2xl relative max-h-[95vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setEditingBannerId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
            <h3 className="text-xl font-bold text-purple-400 mb-6 border-b border-gray-800 pb-2">Banner Settings</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Character Name</label>
                <input value={editingBanner.name} onChange={e => updateBanner(editingBanner.id, 'name', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-sm text-gray-200 outline-none focus:border-purple-500 transition-colors" placeholder="e.g. Nightwing" autoFocus />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Banner Type</label>
                  <select value={editingBanner.type} onChange={e => updateBanner(editingBanner.id, 'type', e.target.value as any)} className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-sm text-gray-200 outline-none focus:border-purple-500 transition-colors">
                    <option value="Release">Release (28 days)</option>
                    <option value="Rerun">Rerun (14 days)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                  <input type="date" value={editingBanner.customStartDate || ''} onChange={e => updateBanner(editingBanner.id, 'customStartDate', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-sm text-gray-200 outline-none focus:border-purple-500 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Decision</label>
                  <select value={editingBanner.decision} onChange={e => updateBanner(editingBanner.id, 'decision', e.target.value as any)} className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-sm text-gray-200 outline-none focus:border-purple-500 transition-colors">
                    <option value="Skip">Skip</option>
                    <option value="Pull">Pull</option>
                  </select>
                </div>
                <div className={`transition-opacity ${editingBanner.decision === 'Pull' ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  <label className="block text-xs text-gray-400 mb-1">Pull Budget</label>
                  <CustomNumberInput value={String(editingBanner.budget || 0)} onChange={v => { if (v === '') { updateBanner(editingBanner.id, 'budget', 0); return; } const n = parseInt(v, 10); if(!isNaN(n)) updateBanner(editingBanner.id, 'budget', Math.max(0, n)); }} step={1} />
                </div>
              </div>

              {/* ПЛАН 🎲 : НАСТРОЙКИ ТЕКУЩЕЙ ПРОКАЧКИ */}
              <div className={`transition-all duration-300 overflow-hidden ${editingBanner.decision === 'Pull' ? 'max-h-[500px] opacity-100 mt-4 border-t border-gray-800 pt-4' : 'max-h-0 opacity-0'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <label className="flex items-center cursor-pointer gap-2">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={editingBanner.isOwned || false}
                        onChange={(e) => updateBanner(editingBanner.id, 'isOwned', e.target.checked)}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${(editingBanner.isOwned || false) ? 'bg-purple-500' : 'bg-gray-700'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${(editingBanner.isOwned || false) ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-300">I already own this character</span>
                  </label>
                </div>

                {(editingBanner.isOwned || false) && (
                  <div className="grid grid-cols-3 gap-3 bg-gray-950/50 p-3 rounded-lg border border-gray-800 animate-fade-in">
                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1">Current Tier</label>
                      <select 
                        value={editingBanner.currentTier || 'White'} 
                        onChange={e => updateBanner(editingBanner.id, 'currentTier', e.target.value as Tier)} 
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-xs text-gray-200 outline-none focus:border-purple-500"
                      >
                        <option value="White">White</option>
                        <option value="Blue">Blue</option>
                        <option value="Purple">Purple</option>
                        <option value="Gold">Gold</option>
                        <option value="Red">Red</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1">Stars</label>
                      <select 
                        value={editingBanner.currentStar || 1} 
                        onChange={e => updateBanner(editingBanner.id, 'currentStar', parseInt(e.target.value))} 
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-xs text-gray-200 outline-none focus:border-purple-500"
                      >
                        <option value="1">1★</option>
                        <option value="2">2★</option>
                        <option value="3">3★</option>
                        <option value="4">4★</option>
                        <option value="5">5★</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1">Extra Shards</label>
                      <input 
                        type="number" 
                        min="0"
                        value={editingBanner.extraShards === undefined ? 0 : editingBanner.extraShards} 
                        onChange={e => {
                          const v = e.target.value;
                          if (v === '') updateBanner(editingBanner.id, 'extraShards', 0);
                          else {
                            const n = parseInt(v, 10);
                            if (!isNaN(n)) updateBanner(editingBanner.id, 'extraShards', Math.max(0, n));
                          }
                        }} 
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-xs text-gray-200 outline-none focus:border-purple-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-2 flex justify-between border-t border-gray-800">
                <button onClick={() => handleDeleteBanner(editingBanner.id)} className="px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded transition-colors">Delete Banner</button>
                <button onClick={() => setEditingBannerId(null)} className="px-6 py-2 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors font-bold shadow-lg">Save & Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl relative z-10 bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
        <div className="bg-gray-950/80 p-6 border-b border-gray-700">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent mb-6 text-center">
            DC Dark Legion — Gacha Calculator
          </h1>
          
          {/* ГЛОБАЛЬНАЯ НАСТРОЙКА УДАЧИ ВЫНЕСЕНА НАВЕРХ */}
          <div className="mb-6 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
            <label className="block mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Global Luck Assumption (Anvils per copy)</label>
            <div className="flex gap-2 md:gap-4">
              <button onClick={() => setLuckLevel(50)} className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${luckLevel === 50 ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'border-gray-700 text-gray-500 hover:bg-gray-800 hover:text-gray-300'}`}>Lucky (~50)</button>
              <button onClick={() => setLuckLevel(100)} className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${luckLevel === 100 ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'border-gray-700 text-gray-500 hover:bg-gray-800 hover:text-gray-300'}`}>Average (~100)</button>
              <button onClick={() => setLuckLevel(200)} className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${luckLevel === 200 ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'border-gray-700 text-gray-500 hover:bg-gray-800 hover:text-gray-300'}`}>Pity (200)</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 p-1 bg-gray-800 rounded-lg">
            <button onClick={() => setActiveTab('total')} className={`flex-1 py-3 px-2 text-sm font-bold rounded-md transition-all ${activeTab === 'total' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>Total Cost</button>
            <button onClick={() => setActiveTab('path')} className={`flex-1 py-3 px-2 text-sm font-bold rounded-md transition-all ${activeTab === 'path' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>Path to Target</button>
            <button onClick={() => setActiveTab('schedule')} className={`flex-1 py-3 px-2 text-sm font-bold rounded-md transition-all ${activeTab === 'schedule' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>F2P Schedule</button>
          </div>
        </div>

        <div className="p-6 md:p-8">
          
          {/* ================= ВКЛАДКА 1 ================= */}
          {activeTab === 'total' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-start">
                <div className="flex-1 relative">
                  <label className="block mb-3 text-sm font-semibold text-gray-300 flex justify-between"><span>Anvils</span><span className="text-gray-500 text-xs">Max: {MAX_COPIES * luckLevel}</span></label>
                  <CustomNumberInput value={anvilsStr === '' ? '' : Math.round(cappedAnvils).toString()} onChange={handleTotalAnvilsChange} max={MAX_COPIES * luckLevel} step={1} />
                </div>
                <NeonArrows />
                <div className="flex-1 relative">
                  <label className="block mb-3 text-sm font-semibold text-gray-300 flex justify-between"><span>Copies Total</span><span className="text-gray-500 text-xs">Max: {MAX_COPIES}</span></label>
                  <CustomNumberInput value={anvilsStr === '' ? '' : Number(calculatedCopies.toFixed(2)).toString()} onChange={handleTotalCopiesChange} max={MAX_COPIES} step={0.1} />
                </div>
                <NeonArrows />
                <div className="flex-1 relative">
                  <label className="block mb-3 text-sm font-semibold text-gray-300 flex justify-between"><span>Shards</span><span className="text-gray-500 text-xs">Max: {MAX_SHARDS}</span></label>
                  <CustomNumberInput value={anvilsStr === '' ? '' : Number(calculatedShards.toFixed(1)).toString()} onChange={handleTotalShardsChange} max={MAX_SHARDS} step={1} />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-gray-300">Target Star Tier</label>
                  <span className={`text-lg font-bold px-3 py-1 rounded ${calculatedShards === 0 ? 'text-gray-500' : TIER_COLORS[totalCurrentStar.tier].active}`}>
                    {calculatedShards === 0 ? 'None' : `${totalCurrentStar.tier} ${totalCurrentStar.stars}★`}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {(['White', 'Blue', 'Purple', 'Gold', 'Red'] as Tier[]).map((tier) => {
                    const isActive = expandedTierTotal === tier;
                    const btnClass = isActive ? TIER_COLORS[tier].active : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200';
                    return <button key={tier} onClick={() => setExpandedTierTotal(isActive ? null : tier)} className={`py-3 rounded font-bold text-sm transition-all border ${btnClass}`}>{tier}</button>;
                  })}
                </div>
                {expandedTierTotal && (
                  <div className="grid grid-cols-5 gap-2 pt-2 animate-fade-in">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const target = STAR_DATA.find((s) => s.tier === expandedTierTotal && s.stars === star);
                      const isExceedingMax = target ? target.totalShards > MAX_SHARDS : false;
                      const isSelected = totalCurrentStar.tier === expandedTierTotal && totalCurrentStar.stars === star;
                      const colorClass = isSelected ? TIER_COLORS[expandedTierTotal].active : TIER_COLORS[expandedTierTotal].outline;
                      return (
                        <button key={star} disabled={isExceedingMax} onClick={() => handleTotalStarSelect(expandedTierTotal, star)} className={`py-2 rounded border text-sm transition-all font-bold ${isExceedingMax ? 'bg-gray-900 border-gray-800 text-gray-800 cursor-not-allowed' : colorClass}`}>
                          {star}★
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= ВКЛАДКА 2 ================= */}
          {activeTab === 'path' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <label className="block mb-3 text-sm font-semibold text-gray-300">1. Select your Current Tier & Stars</label>
                <div className="grid grid-cols-5 gap-2">
                  {(['White', 'Blue', 'Purple', 'Gold', 'Red'] as Tier[]).map((tier) => {
                    const isActive = pathCurrentTier === tier;
                    const btnClass = isActive ? TIER_COLORS[tier].active : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200';
                    return <button key={tier} onClick={() => { setPathCurrentTier(tier); setExpandedTierPath(tier); setPathCurrentStar(1); }} className={`py-3 rounded font-bold text-sm transition-all border ${btnClass}`}>{tier}</button>;
                  })}
                </div>
                {expandedTierPath && (
                  <div className="grid grid-cols-5 gap-2 pt-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isSelected = pathCurrentStar === star;
                      const colorClass = isSelected ? TIER_COLORS[expandedTierPath].active : TIER_COLORS[expandedTierPath].outline;
                      return <button key={star} onClick={() => setPathCurrentStar(star)} className={`py-2 rounded border text-sm transition-all font-bold ${colorClass}`}>{star}★</button>;
                    })}
                  </div>
                )}
              </div>

              <div className="w-full">
                <label className="block mb-3 text-sm font-semibold text-gray-300">2. Extra Shards Owned</label>
                <CustomNumberInput value={extraShardsStr} onChange={(val) => {
                    if (val === '') { setExtraShardsStr(''); return; }
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) setExtraShardsStr(Math.max(0, num).toString());
                  }} placeholder="e.g. 49" step={1} />
              </div>

              <div className="pt-6 border-t border-gray-700">
                <label className="block mb-3 text-sm font-semibold text-gray-300">3. Select your Target Tier & Stars</label>
                <div className="grid grid-cols-5 gap-2">
                  {(['White', 'Blue', 'Purple', 'Gold', 'Red'] as Tier[]).map((tier) => {
                    const isActive = pathTargetTier === tier;
                    const btnClass = isActive ? TIER_COLORS[tier].active : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200';
                    return <button key={tier} onClick={() => { setPathTargetTier(tier); setExpandedTargetTierPath(tier); setPathTargetStar(1); }} className={`py-3 rounded font-bold text-sm transition-all border ${btnClass}`}>{tier}</button>;
                  })}
                </div>
                {expandedTargetTierPath && (
                  <div className="grid grid-cols-5 gap-2 pt-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isSelected = pathTargetStar === star;
                      const colorClass = isSelected ? TIER_COLORS[expandedTargetTierPath].active : TIER_COLORS[expandedTargetTierPath].outline;
                      return <button key={star} onClick={() => setPathTargetStar(star)} className={`py-2 rounded border text-sm transition-all font-bold ${colorClass}`}>{star}★</button>;
                    })}
                  </div>
                )}
              </div>

              <div className="bg-gray-950 border border-purple-500/30 rounded-xl p-6 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                <h3 className="text-lg font-bold text-purple-400 mb-4">Remaining to {pathTargetTier} {pathTargetStar}★</h3>
                
                {remainingShards === 0 ? (
                  <div className="text-center text-gray-400 py-2">You have already reached or surpassed this target! 🎉</div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1"><div className="text-sm text-gray-400">Shards</div><div className="text-2xl font-bold text-gray-100">{remainingShards}</div></div>
                    <div className="space-y-1"><div className="text-sm text-gray-400">Copies</div><div className="text-2xl font-bold text-gray-100">{remainingCopies}</div></div>
                    <div className="space-y-1"><div className="text-sm text-gray-400">Anvils</div><div className="text-2xl font-bold text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">{remainingAnvils}</div></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= ВКЛАДКА 3: SCHEDULE PLANNER ================= */}
          {activeTab === 'schedule' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="bg-gray-950/50 rounded-xl p-5 border border-gray-700">
                <h4 className="font-bold text-gray-200 mb-2 flex items-center gap-2">
                  <span className="text-purple-400">ℹ️</span> F2P Tracker Rules
                </h4>
                <ul className="text-sm text-gray-400 space-y-1 ml-6 list-disc mb-4">
                  <li><strong>Strict Minimum:</strong> Calculates strictly F2P daily income (Shop + infiltrate Expeditions) = 7 Anvils/day.</li>
                  <li><strong>Weekly Bonuses:</strong> Automatically adds +4 Anvils (Mondays) and +40 Anvils / 3000 Gems (Sundays).</li>
                  <li><strong>Auto-Chaining:</strong> Leave the banner start date <span className="text-gray-200">empty</span> to automatically connect it to the end of the previous one.</li>
                  <li><strong>Gaps Allowed:</strong> If you input a specific date with a gap, resources will secretly accumulate during that empty period!</li>
                </ul>
              </div>

              {finalResult && (
                <div className="bg-gradient-to-r from-gray-900 to-gray-950 p-6 rounded-xl border border-purple-500/30 shadow-lg text-center">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Final Projected Resources</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Total Gems Accumulated</div>
                      <div className="text-3xl font-bold text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                        {trackingSettings.isCustomIncome ? '~ ' : ''}{finalResult.gemsCost.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Anvils Remaining</div>
                      <div className={`text-3xl font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] ${finalResult.anvilsAfter < 0 ? 'text-red-500' : 'text-purple-400'}`}>
                        {finalResult.anvilsAfter}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* БЛОК НАСТРОЕК С ТУМБЛЕРОМ */}
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-700 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block mb-2 text-sm font-semibold text-gray-300">Tracking Start Date</label>
                    <input type="date" value={trackingSettings.startDate || ''} onChange={e => setTrackingSettings({...trackingSettings, startDate: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm focus:border-purple-500 outline-none transition-colors text-gray-200" />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block mb-2 text-sm font-semibold text-gray-300">Current Anvils Owned</label>
                    <CustomNumberInput 
                      value={String(trackingSettings.anvils || 0)} 
                      onChange={v => { 
                        if (v === '') { setTrackingSettings({...trackingSettings, anvils: 0}); return; }
                        const n = parseInt(v, 10); 
                        if(!isNaN(n)) setTrackingSettings({...trackingSettings, anvils: Math.max(0, n)}); 
                      }} 
                      step={1} 
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2 pt-4 border-t border-gray-800">
                  <label className="flex items-center cursor-pointer gap-2">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={trackingSettings.isCustomIncome}
                        onChange={(e) => setTrackingSettings({...trackingSettings, isCustomIncome: e.target.checked})}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${trackingSettings.isCustomIncome ? 'bg-purple-500' : 'bg-gray-700'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${trackingSettings.isCustomIncome ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-300">Enable Custom Monthly Income</span>
                  </label>
                  
                  <div className={`transition-opacity duration-300 w-full sm:w-auto ${trackingSettings.isCustomIncome ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 whitespace-nowrap">Monthly Anvils:</span>
                      <div className="w-24">
                        <CustomNumberInput 
                          value={String(trackingSettings.customMonthlyAnvils || 0)} 
                          onChange={v => { 
                            if (v === '') { setTrackingSettings({...trackingSettings, customMonthlyAnvils: 0}); return; }
                            const n = parseInt(v, 10); 
                            if(!isNaN(n)) setTrackingSettings({...trackingSettings, customMonthlyAnvils: Math.max(0, n)}); 
                          }} 
                          step={10} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ФИЛЬТРЫ БАННЕРОВ */}
              <div className="flex flex-wrap gap-2 mb-2 border-b border-gray-800 pb-4">
                <button onClick={() => setBannerFilter('All')} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors border ${bannerFilter === 'All' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>All Banners</button>
                <button onClick={() => setBannerFilter('Active')} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors border ${bannerFilter === 'Active' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>Active & Future</button>
                <button onClick={() => setBannerFilter('Pulls')} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors border ${bannerFilter === 'Pulls' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>Pulls Only</button>
              </div>

              {/* СЕТКА БАННЕРОВ */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {placedBanners.filter(b => {
                  const isExpired = b.endDate.getTime() < parseDateString(trackingSettings.startDate).getTime();
                  if (bannerFilter === 'Active' && isExpired) return false;
                  if (bannerFilter === 'Pulls' && b.decision !== 'Pull') return false;
                  return true;
                }).map((banner, index) => {
                  const result = scheduleResults[banner.id];
                  const isRelease = banner.type === 'Release';
                  const isPull = banner.decision === 'Pull';
                  const isExpired = banner.endDate.getTime() < parseDateString(trackingSettings.startDate).getTime();
                  
                  // РАСЧЕТ ПРОГНОЗА
                  const projected = getProjectedStats(banner, luckLevel);
                  
                  return (
                    <div 
                      key={banner.id} 
                      onClick={() => setEditingBannerId(banner.id)}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl group flex flex-col justify-between
                        ${isRelease ? 'border-yellow-600/40 bg-yellow-900/10' : 'border-purple-600/40 bg-purple-900/10'}
                        ${isExpired ? 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0' : (isRelease ? 'hover:border-yellow-500' : 'hover:border-purple-500')}`}
                    >
                      <div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={(e) => { e.stopPropagation(); moveBanner(index, 'up'); }} disabled={index === 0} className="p-1 text-gray-500 hover:text-white disabled:opacity-0 bg-gray-900 rounded">▲</button>
                           <button onClick={(e) => { e.stopPropagation(); moveBanner(index, 'down'); }} disabled={index === placedBanners.length - 1} className="p-1 text-gray-500 hover:text-white disabled:opacity-0 bg-gray-900 rounded">▼</button>
                        </div>

                        <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1 flex justify-between">
                          <span>{formatDate(banner.startDate)} — {formatDate(banner.endDate)}</span>
                          {isExpired && <span className="text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">EXPIRED</span>}
                        </div>
                        
                        <div className={`font-bold text-lg truncate mb-3 ${isRelease ? 'text-yellow-400' : 'text-purple-400'}`}>
                          {banner.name || 'Unnamed Banner'}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end border-t border-gray-800/50 pt-3 mt-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 uppercase">{banner.type}</span>
                          <span className={`text-sm font-bold ${isPull ? 'text-green-400' : 'text-gray-400'} ${isExpired && isPull ? 'line-through opacity-70' : ''}`}>
                            {isPull ? `PULL (${banner.budget})` : 'SKIP'}
                          </span>
                          {/* ЗДЕСЬ ВЫВОДИТСЯ ПРОГНОЗ */}
                          {isPull && projected && (
                             <span className={`text-xs mt-1 font-bold tracking-wide ${projected.color} drop-shadow-md`}>
                               🎲 {projected.text}
                             </span>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 uppercase block">Anvils Left</span>
                          {isExpired ? (
                             <span className="text-lg font-mono font-bold text-gray-600">—</span>
                          ) : result ? (
                             <span className={`text-lg font-mono font-bold ${result.anvilsAfter < 0 ? 'text-red-500' : 'text-gray-200'}`}>
                               {result.anvilsAfter}
                             </span>
                          ) : (
                             <span className="text-lg font-mono font-bold text-gray-600">...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={handleAddBanner} className="w-full py-4 border-2 border-dashed border-gray-700 text-gray-400 hover:border-purple-500 hover:text-purple-400 hover:bg-purple-900/10 rounded-xl transition-all font-bold tracking-wider mb-4">
                + ADD NEW BANNER
              </button>

              {/* КНОПКИ УПРАВЛЕНИЯ БЭКАПАМИ И ОЧИСТКОЙ */}
              <div className="flex flex-wrap justify-center gap-4 mt-8 pt-6 border-t border-gray-800">
                <button onClick={handleExport} className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200 rounded border border-gray-700 hover:border-gray-500 transition-colors shadow-sm">
                  💾 Save Backup
                </button>
                <label className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200 rounded border border-gray-700 hover:border-gray-500 transition-colors shadow-sm cursor-pointer">
                  📂 Load Backup
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
                <button onClick={handleClearAll} className="px-4 py-2 text-sm bg-gray-900 hover:bg-red-900/20 text-red-500 hover:text-red-400 rounded border border-red-900/30 hover:border-red-500/50 transition-colors shadow-sm">
                  🗑️ Clear All
                </button>
              </div>

            </div>
          )}

          {activeTab !== 'schedule' && (
             <div className="bg-gray-950/50 rounded-lg p-4 border-l-4 border-purple-500 mt-8">
               <h4 className="font-semibold text-purple-400 mb-1">💡 Optimization Tip</h4>
               <p className="text-sm text-gray-400 leading-relaxed">
                 The best breakpoints for most characters are the <strong className="text-gray-200">1st star</strong> and <strong className="text-gray-200">3rd star</strong> of their respective tiers.<br />
                 <span className="italic">Note: Excluding White and Red stars. You will need at least 5 White stars to unlock Multiversal Force via AC/DC shards.</span><br />
<span className="text-sm text-gray-400 leading-relaxed">Maximum character pulls allowed: <strong>26</strong> (1 Base Unlock + 25 Upgrade Copies).</span>
               </p>
             </div>
          )}
          
          <div className="text-center text-xs text-gray-500 pt-6 mt-6 border-t border-gray-700/50 flex flex-col items-center gap-4">
                        
            <a 
              href="https://ko-fi.com/E1E31PNEUQ" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 bg-gray-900 border border-gray-800 rounded-lg transition-all opacity-70 hover:opacity-100 hover:text-purple-400 hover:border-purple-500/50 hover:bg-purple-900/10 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
            >
              <span className="text-lg">☕</span> 
              <span className="font-semibold tracking-wide">buy me a coffee</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
