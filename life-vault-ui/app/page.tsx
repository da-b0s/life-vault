// @ts-nocheck
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useReadContracts 
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { 
  Shield, Clock, Plus, LayoutDashboard, 
  RefreshCw, Activity, Search, 
  Download, Share2, Check, Lock, HeartPulse, Zap, Info, AlertTriangle, Copy 
} from 'lucide-react';
import abi from './abi.json';

// --- CONFIG ---
const CONTRACT_ADDRESS = '0xA1C65aae77B7b052B07E473E9dD6F749093d223A'; 

// --- HELPERS ---
const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: true,
  });
};

const formatEthAmount = (wei: bigint) => {
  const eth = formatEther(wei);
  return Number(eth).toLocaleString('en-US', { maximumFractionDigits: 5 });
};

const getCountdown = (seconds: number) => {
  if (seconds <= 0) return "Expired";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
};

// --- MAIN CONTENT COMPONENT ---
function MainContent() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'create' | 'dashboard' | 'claim'>('dashboard');
  
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'claim') setActiveTab('claim');
  }, [searchParams]);

  if (!mounted) return null; 

  // --- RENDER LANDING PAGE IF NOT CONNECTED ---
  if (!isConnected) {
    return <LandingPage />;
  }

  // --- RENDER APP IF CONNECTED ---
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 selection:bg-cyan-500/30 font-sans">
      <header className="fixed top-0 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">LifeVault</h1>
          </div>
          <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
        </div>
      </header>

      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 mb-8 w-fit mx-auto backdrop-blur-sm">
          <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
            <LayoutDashboard size={16} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('create')} className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'create' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
            <Plus size={16} /> Create Vault
          </button>
          <button onClick={() => setActiveTab('claim')} className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'claim' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
            <Download size={16} /> Claim Legacy
          </button>
        </div>

        {activeTab === 'create' && <CreateVaultView onSuccess={() => setActiveTab('dashboard')} />}
        {activeTab === 'dashboard' && <DashboardView onCreateClick={() => setActiveTab('create')} />}
        {activeTab === 'claim' && <ClaimView />}
      </div>
    </main>
  );
}

// --- LANDING PAGE COMPONENT ---
function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500/30 overflow-x-hidden">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full border-b border-white/5 bg-[#020617]/80 backdrop-blur-lg z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold tracking-tight">LifeVault</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#tech" className="hover:text-white transition-colors">Technology</a>
          </div>
          <ConnectButton label="Launch App" />
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 px-6">
        {/* Background Gradients */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          
          {/* HEADLINE */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 animate-in fade-in slide-in-from-bottom-6 duration-700">
            Secure Your On-Chain Legacy
          </h1>
          
          {/* DESCRIPTION */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Time-locked savings vaults and decentralized inheritance protocols. 
            Prevent early selling or ensure your assets pass to your beneficiaries securely.
          </p>

          {/* BADGE */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-800/30 text-cyan-400 text-xs font-medium mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Live on Arbitrum Sepolia
          </div>
          
          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="scale-110">
              <ConnectButton label="Launch App" />
            </div>
            <a href="#features" className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition-all">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-cyan-500/30 transition-colors group">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Diamond Hands Vault</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                Prevent panic selling by locking your assets for a fixed duration. Breaking the lock early incurs a penalty, enforcing disciplined saving habits.
              </p>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2"><Check size={16} className="text-cyan-500" /> Strict time-locks</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-cyan-500" /> Emergency withdraw (with penalty)</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-purple-500/30 transition-colors group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <HeartPulse className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Legacy Protocol</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                Ensure your crypto isn't lost forever. If you become inactive for a set period, your funds automatically become claimable by your chosen beneficiary.
              </p>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2"><Check size={16} className="text-purple-500" /> Inactivity monitoring</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-purple-500" /> Trustless beneficiary claims</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-6 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center relative">
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent border-t border-dashed border-slate-700" />
            
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-2xl font-bold text-cyan-400 mb-6 shadow-xl shadow-cyan-900/10">1</div>
              <h4 className="text-lg font-semibold mb-2">Create Vault</h4>
              <p className="text-sm text-slate-400">Choose between a Savings Vault or Inheritance Protocol and deposit ETH.</p>
            </div>
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-2xl font-bold text-cyan-400 mb-6 shadow-xl shadow-cyan-900/10">2</div>
              <h4 className="text-lg font-semibold mb-2">Monitor</h4>
              <p className="text-sm text-slate-400">Watch your savings grow or "Ping" the contract periodically to prove you are active.</p>
            </div>
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-2xl font-bold text-cyan-400 mb-6 shadow-xl shadow-cyan-900/10">3</div>
              <h4 className="text-lg font-semibold mb-2">Execute</h4>
              <p className="text-sm text-slate-400">Withdraw funds when mature, or allow beneficiaries to claim if you are gone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <section id="tech" className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 opacity-70">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Zap size={16} /> Powered by 
            <span className="text-white font-medium">Arbitrum Stylus (Rust)</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <span>Non-Custodial</span>
            <span>Open Source</span>
            <span>© 2026 LifeVault</span>
          </div>
        </div>
      </section>
    </div>
  );
}

// --- WRAPPER FOR SUSPENSE ---
export default function Home() {
  return (
    <Suspense fallback={null}>
      <MainContent />
    </Suspense>
  );
}

// ==========================================
//  APP COMPONENTS
// ==========================================

function ClaimView() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [searchAddress, setSearchAddress] = useState(() => {
    if (initialSearch) return initialSearch;
    if (typeof window !== 'undefined') return localStorage.getItem('lastSearch') || '';
    return '';
  });

  const { address: connectedAddress } = useAccount();
  const enabled = searchAddress.startsWith('0x') && searchAddress.length === 42;

  useEffect(() => {
    if (enabled) localStorage.setItem('lastSearch', searchAddress);
  }, [searchAddress, enabled]);

  const { data: vaultsData, isLoading } = useReadContracts({
    contracts: Array.from({ length: 5 }).map((_, id) => ({
      address: CONTRACT_ADDRESS, abi, functionName: 'getVaultData', args: [enabled ? searchAddress : '0x0000000000000000000000000000000000000000', id],
    })),
    query: { enabled: enabled }
  });

  const claimableVaults = vaultsData?.map((result, index) => {
    if (result.status !== 'success') return null;
    const data = result.result;
    if (!data[0]) return null; 
    if (data[5].toLowerCase() !== connectedAddress?.toLowerCase()) return null;
    return { id: index, data, owner: searchAddress };
  }).filter(v => v !== null) || [];

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-8 mb-8">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Search size={20} className="text-cyan-400" /> Find Inheritance
        </h3>
        <p className="text-slate-400 text-sm mb-6">
           Enter the wallet address of the LifeVault owner (or use a shared link) to verify your inheritance.
        </p>
        <input 
          type="text" 
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
          placeholder="Owner Address (0x...)"
        />
      </div>

      {isLoading && enabled && <div className="text-center text-slate-500">Scanning vaults...</div>}

      <div className="space-y-4">
        {claimableVaults.length > 0 ? (
          claimableVaults.map((vault: any) => (
            <VaultCard key={vault.id} id={vault.id} data={vault.data} isClaimMode={true} ownerAddress={vault.owner} />
          ))
        ) : (
           enabled && !isLoading && <div className="text-center text-slate-600 mt-10">No claimable vaults found for this address.</div>
        )}
      </div>
    </div>
  );
}

function DashboardView({ onCreateClick }: { onCreateClick: () => void }) {
  const { address } = useAccount();
  const { data: vaultsData, isLoading, refetch } = useReadContracts({
    contracts: Array.from({ length: 5 }).map((_, id) => ({
      address: CONTRACT_ADDRESS, abi, functionName: 'getVaultData', args: [address, id],
    })),
  });

  useEffect(() => { refetch(); }, [refetch]);
  if (isLoading) return <div className="text-center py-20 text-slate-500 animate-pulse">Syncing...</div>;

  const activeVaults = vaultsData?.map((result, index) => {
    if (result.status !== 'success' || !result.result[0]) return null;
    return { id: index, data: result.result };
  }).filter((v) => v !== null) || [];

  if (activeVaults.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5 animate-in fade-in zoom-in duration-300">
        <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Active Vaults</h3>
        <button onClick={onCreateClick} className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold mt-4">Create First Vault</button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6 px-2">
        <span className="text-sm font-medium text-slate-400">Your Active Vaults ({activeVaults.length})</span>
        <button onClick={() => refetch()} className="p-2 text-slate-400 hover:text-white"><RefreshCw size={16} /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeVaults.map((vault: any) => (
          <VaultCard key={vault.id} id={vault.id} data={vault.data} />
        ))}
      </div>
    </div>
  );
}

function CreateVaultView({ onSuccess }: { onSuccess: () => void }) {
  const [vaultType, setVaultType] = useState<0 | 1>(0); 
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [inactivity, setInactivity] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const { address } = useAccount();
  const { data: countData } = useReadContract({ address: CONTRACT_ADDRESS, abi, functionName: 'getVaultCount', args: [address] });
  const isLimitReached = Number(countData || 0) >= 5;
  const { writeContract, isPending, isSuccess } = useWriteContract();

  useEffect(() => { if (isSuccess) setTimeout(onSuccess, 4000); }, [isSuccess]);

  const handleCreate = () => {
    if (!amount) return alert("Invalid Amount");
    let configParam = BigInt(0);
    let beneAddr = beneficiary.trim(); 
    try {
      if (vaultType === 0) {
        if (!date) return alert("Select Date");
        const ts = Math.floor(new Date(date).getTime() / 1000);
        
        // --- LOGIC CHECK ---
        const now = Math.floor(Date.now()/1000);
        if (ts < now + 900) return alert("Date must be at least 15 minutes in the future.");

        configParam = BigInt(ts);
        if (!beneAddr) beneAddr = address; 
      } else {
        if (!inactivity) return alert("Enter Inactivity");
        configParam = BigInt(parseInt(inactivity) * 86400); 
        if (!beneAddr) return alert("Beneficiary Required");
      }
      writeContract({ address: CONTRACT_ADDRESS, abi, functionName: 'createVault', args: [vaultType, configParam, beneAddr], value: parseEther(amount) });
    } catch (err) { alert("Input Error"); }
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in duration-300">
      <h3 className="text-xl font-semibold text-white mb-6">Configure New Vault</h3>
      {isLimitReached && <div className="mb-6 p-4 bg-orange-500/10 text-orange-300 text-sm rounded-lg flex items-center gap-2"><Info size={16}/> You have reached the maximum limit of 5 vaults.</div>}
      
      {/* TOGGLE BUTTONS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div onClick={() => setVaultType(0)} className={`cursor-pointer p-4 rounded-xl border transition-all ${vaultType === 0 ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-900/20' : 'border-white/5 hover:border-white/10'}`}>
           <div className="flex items-center gap-2 font-medium text-white mb-1"><Shield size={18} className="text-cyan-400"/> Diamond Hands</div>
           <div className="text-xs text-slate-500">Lock savings for a fixed time.</div>
        </div>
        <div onClick={() => setVaultType(1)} className={`cursor-pointer p-4 rounded-xl border transition-all ${vaultType === 1 ? 'border-purple-500 bg-purple-950/20 shadow-lg shadow-purple-900/20' : 'border-white/5 hover:border-white/10'}`}>
           <div className="flex items-center gap-2 font-medium text-white mb-1"><Activity size={18} className="text-purple-400"/> Legacy Protocol</div>
           <div className="text-xs text-slate-500">Dead man's switch for inheritance.</div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
           <label className="text-xs font-medium text-slate-400 mb-1.5 block">Deposit Amount</label>
           <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="0.00 ETH" />
           <p className="text-xs text-slate-500 mt-2">Amount to lock in the smart contract.</p>
        </div>

        {vaultType === 0 ? (
           <>
             <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Unlock Date</label>
                <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white [color-scheme:dark] focus:outline-none focus:border-cyan-500 transition-colors" />
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><AlertTriangle size={12} className="text-orange-400"/> Early withdrawal penalty: 5% (Initial), 1% (Last 24h).</p>
             </div>
             <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Beneficiary (Optional)</label>
                <input type="text" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="0x..." />
                <p className="text-xs text-slate-500 mt-2">If empty, funds return to you.</p>
             </div>
           </>
        ) : (
           <>
             <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Inactivity Period (Days)</label>
                <input type="number" value={inactivity} onChange={(e) => setInactivity(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="e.g. 180" />
                <p className="text-xs text-slate-500 mt-2">Funds become claimable if you don't "Ping" for this many days.</p>
             </div>
             <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Beneficiary Address</label>
                <input type="text" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="0x..." />
                <p className="text-xs text-slate-500 mt-2">The wallet that can claim the funds after expiry.</p>
             </div>
           </>
        )}
        <button onClick={handleCreate} disabled={isPending || isLimitReached} className={`w-full font-semibold py-4 rounded-lg mt-4 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl ${vaultType === 0 ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20'}`}>
            {isPending ? 'Processing...' : 'Initialize Vault'}
        </button>
      </div>
    </div>
  );
}

function VaultCard({ id, data, isClaimMode = false, ownerAddress }: { id: number, data: any, isClaimMode?: boolean, ownerAddress?: string }) {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [active, type, amount, timer, last_seen, beneficiary] = data;
  const [copied, setCopied] = useState(false);
  const [beneCopied, setBeneCopied] = useState(false);

  const isDiamond = type === 0;
  const now = Math.floor(Date.now() / 1000);
  
  let statusColor = "text-slate-400";
  let statusText = "";
  let subText = "";
  let isLocked = false;
  let penaltyPercent = "";
  let legacyLastPing = "";
  let canClaim = false;

  if (isDiamond) {
    const unlockTime = Number(timer);
    const timeLeft = unlockTime - now;
    isLocked = timeLeft > 0;
    statusColor = isLocked ? "text-orange-400" : "text-green-400";
    statusText = isLocked ? "Locked" : "Unlocked";
    penaltyPercent = timeLeft > 86400 ? "5%" : "1%";
    subText = isLocked ? `Unlocks: ${formatDate(unlockTime)}` : "Ready to withdraw";
  } else {
    const maxInactivity = Number(timer); 
    const lastSeen = Number(last_seen);
    const deadline = lastSeen + maxInactivity;
    const timeToTimeout = deadline - now;
    const isSafe = timeToTimeout > 0;

    if (isSafe) {
        statusColor = "text-purple-400";
        statusText = "Secure";
        subText = `${getCountdown(timeToTimeout)} remaining`;
    } else {
        statusColor = "text-red-500";
        statusText = "Expired"; 
        subText = "Beneficiary hasn't claimed yet. Reset timer?";
    }
    legacyLastPing = formatDate(lastSeen);
    canClaim = !isSafe;
  }

  const handleWithdraw = () => writeContract({ address: CONTRACT_ADDRESS, abi, functionName: 'withdraw', args: [id] });
  const handlePing = () => writeContract({ address: CONTRACT_ADDRESS, abi, functionName: 'ping', args: [id] });
  const handleClaim = () => writeContract({ address: CONTRACT_ADDRESS, abi, functionName: 'claimLegacy', args: [ownerAddress, id] });

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?tab=claim&search=${address}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyBeneficiary = (e: any) => {
    e.stopPropagation();
    if (beneficiary) {
        navigator.clipboard.writeText(beneficiary);
        setBeneCopied(true);
        setTimeout(() => setBeneCopied(false), 2000);
    }
  };

  return (
    <div className="group relative bg-slate-900 border border-white/5 rounded-2xl p-6 overflow-hidden hover:border-white/10 transition-all hover:shadow-2xl hover:shadow-cyan-900/10">
      <div className={`absolute top-0 left-0 w-1 h-full ${isDiamond ? 'bg-cyan-500' : 'bg-purple-500'}`} />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            {isDiamond ? 'Diamond Vault' : 'Legacy Protocol'} #{id + 1}
          </div>
          <div className="text-2xl font-bold text-white flex items-baseline gap-1">
            {formatEthAmount(amount)} <span className="text-sm font-normal text-slate-400">ETH</span>
          </div>
        </div>
        
        {!isDiamond && !isClaimMode ? (
            <button 
                onClick={handleCopyLink} 
                className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                title="Copy Claim Link for Beneficiary"
            >
                {copied ? <Check size={20} /> : <Share2 size={20} />}
            </button>
        ) : (
            <div className={`p-2 rounded-lg ${isDiamond ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'}`}>
                {isDiamond ? <Shield size={20} /> : <Activity size={20} />}
            </div>
        )}
      </div>

      <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 text-sm">
             <div className="flex-1 p-3 bg-black/20 rounded-lg border border-white/5">
               <div className="text-slate-500 mb-1 text-xs">Status</div>
               <div className={`font-medium ${statusColor} flex items-center gap-2`}>
                 {isDiamond ? <Shield size={14}/> : <Clock size={14}/>}
                 {statusText}
               </div>
               <div className="text-xs text-slate-400 mt-1">{subText}</div>
             </div>
          </div>
          
          {!isDiamond && (
            <div className="space-y-2">
                <div className="px-1 text-xs flex justify-between items-center text-slate-500">
                   <span>Last Ping:</span>
                   <span className="text-slate-300 font-mono">{legacyLastPing}</span>
                </div>
                <div className="px-1 text-xs flex justify-between items-center text-slate-500">
                   <span>Beneficiary:</span>
                   {/* COPYABLE BENEFICIARY ADDRESS */}
                   <div 
                     onClick={handleCopyBeneficiary}
                     className="flex items-center gap-1.5 cursor-pointer hover:bg-white/5 px-1.5 py-0.5 rounded transition-colors group/copy"
                     title="Click to copy address"
                   >
                     <span className={`font-mono transition-colors ${beneCopied ? 'text-green-400' : 'text-slate-300 group-hover/copy:text-white'}`}>
                        {beneficiary ? `${beneficiary.slice(0, 6)}...${beneficiary.slice(-4)}` : 'None'}
                     </span>
                     {beneficiary && (
                        beneCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-slate-500 group-hover/copy:text-white" />
                     )}
                   </div>
                </div>
            </div>
          )}
      </div>

      <div className="pt-4 border-t border-white/5">
        {isClaimMode ? (
          <button 
            onClick={handleClaim}
            disabled={!canClaim || isPending}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
              canClaim 
                ? 'bg-green-600 hover:bg-green-500 text-white' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isPending ? 'Claiming...' : canClaim ? 'Claim Inheritance' : 'Not Expired Yet'}
          </button>
        ) : isDiamond ? (
          <button onClick={handleWithdraw} disabled={isPending} className={`w-full py-2.5 rounded-lg text-sm font-medium ${isLocked ? 'bg-orange-500/10 text-orange-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
            {isPending ? 'Processing...' : isLocked ? `Emergency Withdraw (-${penaltyPercent})` : 'Withdraw Funds'}
          </button>
        ) : (
          <button onClick={handlePing} disabled={isPending} className="w-full py-2.5 rounded-lg text-sm font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20">
            {isPending ? 'Pinging...' : canClaim ? 'Emergency Ping (Save Funds!)' : 'Ping (I am alive)'}
          </button>
        )}
      </div>
    </div>
  );
}