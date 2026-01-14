// @ts-nocheck
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt, 
  useReadContracts 
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Shield, Clock, AlertTriangle, Plus, LayoutDashboard, User, ExternalLink, RefreshCw, Activity, Search, Download, Share2, Check } from 'lucide-react';
import abi from './abi.json';

// --- CONFIG ---
const CONTRACT_ADDRESS = '0xA1C65aae77B7b052B07E473E9dD6F749093d223A'; 
const EXPLORER_URL = 'https://sepolia.arbiscan.io/tx/';

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
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'create' | 'dashboard' | 'claim'>('dashboard');
  
  // URL Params Hook
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
    // CHECK URL PARAMS ON LOAD
    const tabParam = searchParams.get('tab');
    if (tabParam === 'claim') setActiveTab('claim');
  }, [searchParams]);

  if (!mounted) return null; 

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
        {!isConnected ? (
          <HeroSection />
        ) : (
          <>
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
          </>
        )}
      </div>
    </main>
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

// --- VIEW: HERO (RESTORED TEXT) ---
function HeroSection() {
  return (
    <div className="text-center mt-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 mb-6">
        Secure Your Legacy On-Chain
      </h2>
      {/* RESTORED DESCRIPTION */}
      <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        Inheritance protocols and time-locked savings vaults.
        Prevent early selling or ensure your assets pass to your beneficiaries securely.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-900/50 text-cyan-400 text-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        Live on Arbitrum Sepolia
      </div>
    </div>
  );
}

// --- VIEW: CLAIM ---
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
    <div className="max-w-2xl mx-auto">
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

// --- VIEW: DASHBOARD ---
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
      <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
        <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Active Vaults</h3>
        <button onClick={onCreateClick} className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">Create First Vault</button>
      </div>
    );
  }

  return (
    <div>
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

// --- VIEW: CREATE VAULT ---
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
        if (ts < Math.floor(Date.now()/1000) + 900) return alert("Date too soon");
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
    <div className="max-w-xl mx-auto bg-slate-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
      <h3 className="text-xl font-semibold text-white mb-6">Configure New Vault</h3>
      {isLimitReached && <div className="mb-6 p-4 bg-orange-500/10 text-orange-300 text-sm rounded-lg">Max limit reached.</div>}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div onClick={() => setVaultType(0)} className={`cursor-pointer p-4 rounded-xl border ${vaultType === 0 ? 'border-cyan-500 bg-cyan-950/20' : 'border-white/5'}`}>Diamond Hands</div>
        <div onClick={() => setVaultType(1)} className={`cursor-pointer p-4 rounded-xl border ${vaultType === 1 ? 'border-purple-500 bg-purple-950/20' : 'border-white/5'}`}>Legacy Protocol</div>
      </div>
      <div className="space-y-6">
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="Amount (ETH)" />
        {vaultType === 0 ? (
           <>
             <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white [color-scheme:dark]" />
             <input type="text" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="Beneficiary (Optional)" />
           </>
        ) : (
           <>
             <input type="number" value={inactivity} onChange={(e) => setInactivity(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="Inactivity (Days)" />
             <input type="text" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="Beneficiary Address" />
           </>
        )}
        <button onClick={handleCreate} disabled={isPending || isLimitReached} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-4 rounded-lg mt-4 disabled:opacity-50">Initialize Vault</button>
      </div>
    </div>
  );
}

// --- VIEW: VAULT CARD ---
function VaultCard({ id, data, isClaimMode = false, ownerAddress }: { id: number, data: any, isClaimMode?: boolean, ownerAddress?: string }) {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [active, type, amount, timer, last_seen, beneficiary] = data;
  const [copied, setCopied] = useState(false);

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

  // Share Link Function
  const handleCopyLink = () => {
    const url = `${window.location.origin}/?tab=claim&search=${address}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative bg-slate-900 border border-white/5 rounded-2xl p-6 overflow-hidden hover:border-white/10 transition-all">
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
            <div className="px-1 text-xs flex justify-between items-center text-slate-500">
               <span>Last Ping:</span>
               <span className="text-slate-300 font-mono">{legacyLastPing}</span>
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