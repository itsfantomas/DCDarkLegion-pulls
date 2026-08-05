import { useState, useMemo } from 'react';

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

const NeonArrows = () => (
  <div className="hidden md:flex items-center justify-center shrink-0 mx-2 mt-4">
    <span className="text-purple-500 font-bold tracking-widest drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] text-xl">
      &gt;&gt;
    </span>
  </div>
);

// Кастомный инпут для чисел со скрытыми дефолтными стрелками и собственными кнопками
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
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-950 border border-gray-600 rounded p-3 pr-10 text-lg focus:border-purple-500 outline-none transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
      />
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
  const [activeTab, setActiveTab] = useState<'total' | 'path'>('total');
  const [luckLevel, setLuckLevel] = useState<number>(100);

  const [anvilsStr, setAnvilsStr] = useState<string>('2600');
  const [expandedTierTotal, setExpandedTierTotal] = useState<Tier | null>(null);

  const [pathCurrentTier, setPathCurrentTier] = useState<Tier>('Red');
  const [pathCurrentStar, setPathCurrentStar] = useState<number>(1);
  const [extraShardsStr, setExtraShardsStr] = useState<string>('0');
  const [expandedTierPath, setExpandedTierPath] = useState<Tier | null>('Red');

  // ==================== ЛОГИКА ВКЛАДКИ 1: TOTAL ====================
  const validAnvils = isNaN(parseFloat(anvilsStr)) ? 0 : Math.max(0, parseFloat(anvilsStr));
  const cappedAnvils = Math.min(validAnvils, MAX_COPIES * luckLevel);
  const calculatedCopies = Math.min(cappedAnvils / luckLevel, MAX_COPIES);
  const calculatedShards = Math.max(0, Math.min((calculatedCopies - 1) * SHARDS_PER_COPY, MAX_SHARDS));

  const totalCurrentStar = useMemo(() => {
    let current = STAR_DATA[0];
    for (let i = 0; i < STAR_DATA.length; i++) {
      if (calculatedShards >= STAR_DATA[i].totalShards) {
        current = STAR_DATA[i];
      } else { break; }
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
    if (!isNaN(num)) {
      const validNum = Math.max(0, num);
      setAnvilsStr(Math.round(Math.min(validNum, MAX_COPIES) * luckLevel).toString());
    }
  };

  const handleTotalShardsChange = (val: string) => {
    if (val === '') { setAnvilsStr(''); return; }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const validNum = Math.max(0, num);
      const capped = Math.min(validNum, MAX_SHARDS);
      const copies = (capped / SHARDS_PER_COPY) + 1;
      setAnvilsStr(Math.round(copies * luckLevel).toString());
    }
  };

  const handleTotalStarSelect = (tier: Tier, stars: number) => {
    const target = STAR_DATA.find((s) => s.tier === tier && s.stars === stars);
    if (target) {
      const copies = (target.totalShards / SHARDS_PER_COPY) + 1;
      setAnvilsStr(Math.round(copies * luckLevel).toString());
    }
  };

  // ==================== ЛОГИКА ВКЛАДКИ 2: PATH TO MAX ====================
  const pathBaseTarget = STAR_DATA.find(s => s.tier === pathCurrentTier && s.stars === pathCurrentStar);
  const pathBaseShards = pathBaseTarget ? pathBaseTarget.totalShards : 0;
  
  const parsedExtraShards = isNaN(parseFloat(extraShardsStr)) ? 0 : Math.max(0, parseFloat(extraShardsStr));
  const totalOwnedShards = Math.min(pathBaseShards + parsedExtraShards, MAX_SHARDS);
  
  const remainingShards = Math.max(0, MAX_SHARDS - totalOwnedShards);
  const remainingCopies = Math.ceil(remainingShards / SHARDS_PER_COPY);
  const remainingAnvils = Math.round(remainingCopies * luckLevel);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8 font-sans relative overflow-hidden flex flex-col items-center">
      
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle,rgba(168,85,247,0.4)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

      <div className="w-full max-w-4xl relative z-10 bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
        
        <div className="bg-gray-950/80 p-6 border-b border-gray-700">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent mb-6 text-center">
            DC Dark Legion — Pull Calculator
          </h1>
          
          <div className="flex gap-2 p-1 bg-gray-800 rounded-lg">
            <button onClick={() => setActiveTab('total')} className={`flex-1 py-3 text-sm font-bold rounded-md transition-all ${activeTab === 'total' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>Total Cost</button>
            <button onClick={() => setActiveTab('path')} className={`flex-1 py-3 text-sm font-bold rounded-md transition-all ${activeTab === 'path' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>Path to Max</button>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          
          <div className="mb-6">
            <label className="block mb-3 text-sm font-semibold text-gray-300 uppercase tracking-wider">Luck Assumption (Anvils per Mythic+)</label>
            <div className="flex gap-4">
              <button onClick={() => { setLuckLevel(50); setAnvilsStr(Math.round(calculatedCopies * 50).toString()); }} className={`flex-1 py-2 rounded border transition-colors ${luckLevel === 50 ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-gray-600 hover:bg-gray-700'}`}>Lucky (~50)</button>
              <button onClick={() => { setLuckLevel(100); setAnvilsStr(Math.round(calculatedCopies * 100).toString()); }} className={`flex-1 py-2 rounded border transition-colors ${luckLevel === 100 ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-gray-600 hover:bg-gray-700'}`}>Average (~100)</button>
              <button onClick={() => { setLuckLevel(200); setAnvilsStr(Math.round(calculatedCopies * 200).toString()); }} className={`flex-1 py-2 rounded border transition-colors ${luckLevel === 200 ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'border-gray-600 hover:bg-gray-700'}`}>Pity (200)</button>
            </div>
          </div>

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
                <CustomNumberInput 
                  value={extraShardsStr} 
                  onChange={(val) => {
                    if (val === '') { setExtraShardsStr(''); return; }
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) setExtraShardsStr(Math.max(0, num).toString());
                  }} 
                  placeholder="e.g. 49"
                  step={1}
                />
              </div>

              <div className="bg-gray-950 border border-purple-500/30 rounded-xl p-6 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                <h3 className="text-lg font-bold text-purple-400 mb-4">Remaining to Red 5★</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1"><div className="text-sm text-gray-400">Shards</div><div className="text-2xl font-bold text-gray-100">{remainingShards}</div></div>
                  <div className="space-y-1"><div className="text-sm text-gray-400">Copies</div><div className="text-2xl font-bold text-gray-100">{remainingCopies}</div></div>
                  <div className="space-y-1"><div className="text-sm text-gray-400">Anvils</div><div className="text-2xl font-bold text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">{remainingAnvils}</div></div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-950/50 rounded-lg p-4 border-l-4 border-purple-500 mt-8">
            <h4 className="font-semibold text-purple-400 mb-1">💡 Optimization Tip</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              The best breakpoints for most characters are the <strong className="text-gray-200">1st star</strong> and <strong className="text-gray-200">3rd star</strong> of their respective tiers.<br />
              <span className="italic">Note: Excluding White and Red stars. You will need at least 5 White stars to unlock Multiversal Force via AC/DC shards.</span>
            </p>
          </div>
          
          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-700/50">
            Maximum character pulls allowed: <strong>26</strong> (1 Base Unlock + 25 Upgrade Copies).
          </div>
        </div>
      </div>
    </div>
  );
}
