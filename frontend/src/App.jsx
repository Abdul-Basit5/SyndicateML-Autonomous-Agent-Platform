import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Database, Wrench, BrainCircuit, Receipt, GitMerge, UploadCloud,
  Terminal, Activity, DollarSign, ShieldAlert, Cpu, Loader2, BarChart2,
  TableProperties, AlertCircle, Download, LogOut, Layout, Activity as Pulse,
  Zap, BarChart as ChartIcon, Search, Settings, ChevronRight, Info
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const agentsBase = [
  { id: 'privacy_shield', name: 'Privacy Shield', icon: Shield, status: 'idle' },
  { id: 'profiler', name: 'Data Profiler', icon: Database, status: 'idle' },
  { id: 'feature_engineer', name: 'Feature Engineer', icon: Wrench, status: 'idle' },
  { id: 'ml_architect', name: 'ML Architect', icon: BrainCircuit, status: 'idle' },
  { id: 'finops_auditor', name: 'FinOps Auditor', icon: Receipt, status: 'idle' },
  { id: 'xai_agent', name: 'XAI Auditor', icon: Activity, status: 'idle' },
  { id: 'mlops_lead', name: 'MLOps Lead', icon: GitMerge, status: 'idle' },
];

export default function App() {
  const [agents, setAgents] = useState(agentsBase);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [totalCost, setTotalCost] = useState(0.0);
  const [privacyActive, setPrivacyActive] = useState(false);
  const [dataProfile, setDataProfile] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [finopsApproved, setFinopsApproved] = useState(false);
  const [xaiReport, setXaiReport] = useState(null);
  const [deploymentStatus, setDeploymentStatus] = useState(false);
  const [targetColumn, setTargetColumn] = useState(null);
  const [showTriage, setShowTriage] = useState(false);
  const [triageData, setTriageData] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [modelBase64, setModelBase64] = useState(null);
  const [threadId, setThreadId] = useState(`session_${Math.random().toString(36).substr(2, 9)}`);

  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState('swarm');
  const [historyData, setHistoryData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState({
    latency: Array.from({ length: 20 }, () => Math.floor(Math.random() * 20) + 30),
    volume: 1240,
    errorRate: 0.02,
    load: 42
  });
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'syndicate2026' });

  const fileInputRef = useRef(null);
  const endOfLogsRef = useRef(null);

  useEffect(() => {
    endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (!token || !isProcessing) {
      if (!isProcessing) {
        setHealthMetrics(prev => ({ ...prev, load: 0 }));
      }
      return;
    }
    const interval = setInterval(() => {
      setHealthMetrics(prev => ({
        ...prev,
        latency: [...prev.latency.slice(1), Math.floor(Math.random() * 20) + 30],
        load: Math.min(100, Math.max(10, prev.load + (Math.random() - 0.5) * 5)),
        volume: prev.volume + Math.floor(Math.random() * 10)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [token, isProcessing]);

  // Fetch history when history tab opens
  useEffect(() => {
    if (activeTab === 'history') {
      setIsLoadingHistory(true);
      authenticatedFetch("http://localhost:8000/api/experiments")
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') setHistoryData(data.history);
          setIsLoadingHistory(false);
        })
        .catch(() => setIsLoadingHistory(false));
    }
  }, [activeTab]);

  const updateAgentStatus = (agentId, logMsg) => {
    setAgents(prev => {
      const activeIdx = prev.findIndex(a => a.id === agentId);
      return prev.map((a, idx) => {
        let status = 'idle';
        if (idx < activeIdx) status = 'completed';
        else if (idx === activeIdx) status = 'active';

        // Extract stats from log if active
        let stats = a.stats;
        if (idx === activeIdx && logMsg) {
          if (agentId === 'privacy_shield') {
            const match = logMsg.match(/\[(.*?)\]/);
            const num = match ? match[1].split(',').length : 2;
            stats = `${num} PII Masked`;
          } else if (agentId === 'profiler') {
            const match = logMsg.match(/Analyzed (\d+) rows/);
            const num = match ? match[1] : 1000;
            stats = `${num} Rows Cleaned`;
          } else if (agentId === 'feature_engineer') {
            stats = "Features Scaled";
          } else if (agentId === 'ml_architect') {
            stats = "Models Trained";
          } else if (agentId === 'finops_auditor') {
            stats = "Cost Optimized";
          } else if (agentId === 'xai_agent') {
            stats = "Features Audited";
          } else if (agentId === 'mlops_lead') {
            stats = "Ready for Deploy";
          }
        }
        return { ...a, status, stats: stats || a.stats };
      });
    });
  };

  const setAllIdle = () => setAgents(prev => prev.map(a => ({ ...a, status: 'idle', stats: null })));

  const handleLogin = async (username, password) => {
    setIsLoggingIn(true);
    try {
      const resp = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await resp.json();
      if (resp.ok && data.access_token) {
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
      } else {
        const errorMsg = data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : "Authentication Failed.";
        alert(`Access Denied: ${errorMsg}`);
      }
    } catch (err) {
      alert("System unreachable. Security breach suspected.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setFile(null);
    setIsProcessing(false);
    setLogs([]);
    setDataProfile(null);
  };

  const authenticatedFetch = (url, options = {}) => {
    const currentToken = localStorage.getItem('token') || token;
    return fetch(url, {
      ...options,
      headers: { ...options.headers, "Authorization": `Bearer ${currentToken}` }
    });
  };

  const handleDragOver = (e) => e.preventDefault();

  const uploadFile = async (selectedFile) => {
    setFile(selectedFile);
    setIsUploading(true);
    setIsProcessing(true);
    setLogs(["System: Initializing secure pipeline...", `System: Uploading ${selectedFile.name}...`]);
    setAllIdle();

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await authenticatedFetch("http://localhost:8000/api/ingest", {
        method: "POST",
        body: formData,
      });

      if (response.status === 401) {
        setIsUploading(false);
        setIsProcessing(false);
        setLogs(prev => [...prev, "Upload Failed: Unauthorized. Please Login."]);
        alert("Upload Failed: Unauthorized. Please Login.");
        return;
      }

      const data = await response.json();

      if (data.status === "success" && data.file_path) {
        setLogs(prev => [...prev, "System: File uploaded. Opening Real-Time Intelligence Stream..."]);
        const ws = new WebSocket(`ws://localhost:8000/ws/stream?token=${localStorage.getItem('token')}`);

        ws.onopen = () => {
          ws.send(JSON.stringify({
            type: "START_PIPELINE",
            file_path: data.file_path,
            filename: data.filename,
            thread_id: threadId
          }));
        };

        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.type === "AGENT_UPDATE") {
            updateAgentStatus(message.node, message.latest_log);
            setLogs(prev => [...prev, message.latest_log]);
            setTotalCost(message.total_token_cost);
            if (message.data_profile) setDataProfile(message.data_profile);
            if (message.model_metrics) setModelMetrics(message.model_metrics);
            if (message.xai_report) setXaiReport(message.xai_report);
            if (message.target_column) setTargetColumn(message.target_column);
            if (message.model_file_base64) setModelBase64(message.model_file_base64);
            if (message.deployment_status !== undefined) setDeploymentStatus(message.deployment_status);
            if (message.node === 'privacy_shield') setPrivacyActive(true);
          }
          if (message.type === "AWAITING_APPROVAL") {
            setTriageData(message);
            setShowTriage(true);
            setLogs(prev => [...prev, "🚨 STATUS: AWAITING HUMAN APPROVAL. Model accuracy below threshold."]);
            setIsUploading(false);
            setIsProcessing(false);
            setAllIdle();
          }
          if (message.type === "PIPELINE_COMPLETE") {
            setLogs(prev => [...prev, "System: Pipeline execution complete."]);
            setIsUploading(false);
            setIsProcessing(false);
            setAgents(prev => prev.map(a => ({ ...a, status: 'completed' })));
            ws.close();
          }
          if (message.type === "ERROR") {
            setLogs(prev => [...prev, `System Error: ${message.message}`]);
            setIsUploading(false);
            setIsProcessing(false);
            setAllIdle();
          }
        };
      } else {
        setIsUploading(false);
        setIsProcessing(false);
        setLogs(prev => [...prev, `Upload Failed: ${data.detail || "Unknown error"}`]);
      }
    } catch (err) {
      setLogs(prev => [...prev, `Network Error: ${err.message}`]);
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const handleApprove = async (isApproved) => {
    setShowTriage(false);
    try {
      const resp = await authenticatedFetch("http://localhost:8000/api/approve-deployment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: threadId, approved: isApproved })
      });
      const data = await resp.json();
      if (data.status === "success") {
        setLogs(prev => [...prev, "System: Deployment manually approved."]);

        // Update the finalized results pipeline details immediately after triumph 
        if (data.model_metrics) setModelMetrics(data.model_metrics);
        if (data.xai_report) setXaiReport(data.xai_report);
        if (data.total_token_cost) setTotalCost(data.total_token_cost);

        // Ensure deployment is marked active so Playground works
        setDeploymentStatus(true);
        setAllIdle();
        setIsProcessing(false);
        setIsUploading(false);
      } else {
        setLogs(prev => [...prev, `System: Deployment override rejected. ${data.message || ''}`]);
      }
    } catch (err) { }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);
    try {
      const resp = await authenticatedFetch("http://localhost:8000/api/syndicate-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg, thread_id: threadId })
      });
      const data = await resp.json();
      setChatMessages(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', content: `Error: ${err.message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handlePredict = async (formData) => {
    setIsPredicting(true);
    setPredictionResult(null);
    try {
      const resp = await authenticatedFetch("http://localhost:8000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: formData })
      });
      const data = await resp.json();
      setPredictionResult(data);
    } catch (err) {
      setPredictionResult({ error: "Prediction timed out." });
    } finally {
      setIsPredicting(false);
    }
  };

  const downloadModel = () => {
    if (!modelBase64) return;
    const byteCharacters = atob(modelBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'syndicateml_trained_model.pkl';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#020617] mesh-gradient flex items-center justify-center p-4 font-sans text-slate-200">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md glass p-10 rounded-[32px] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-indigo-500 opacity-50" />
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 neon-glow-emerald border border-emerald-500/30">
              <Shield className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">SyndicateML</h1>
            <p className="text-emerald-500/60 text-xs font-bold tracking-[0.3em] uppercase">Private Intelligence Swarm</p>
          </div>
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleLogin(loginForm.username, loginForm.password); }}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Operator ID</label>
              <input name="username" type="text" value={loginForm.username} onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))} required className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/50 transition-all font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Access Key</label>
              <input name="password" type="password" value={loginForm.password} onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))} required className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/50 transition-all font-mono text-sm" />
            </div>
            <button disabled={isLoggingIn} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-3">
              {isLoggingIn ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Zap className="w-5 h-5" /> Initialize Core</>}
            </button>
          </form>
          <div className="mt-10 text-center">
            <p className="text-[9px] font-black tracking-[0.4em] uppercase bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent opacity-80 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse-slow">SECURE DEFENSE PROTOCOL 2026-X | Abdul Basit - ML Engineer</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans mesh-gradient">
      {/* Triage Modal */}
      <AnimatePresence>
        {showTriage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-6">
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} className={`w-full max-w-xl glass p-10 rounded-[40px] shadow-2xl relative overflow-hidden ${triageData?.triage_status === 'AUTO_APPROVED' ? 'border-emerald-500/40 shadow-emerald-900/20' : 'border-rose-500/40 shadow-rose-900/20'}`}>
              <div className={`absolute top-0 left-0 w-full h-1 ${triageData?.triage_status === 'AUTO_APPROVED' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <div className="flex items-center gap-6 mb-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${triageData?.triage_status === 'AUTO_APPROVED' ? 'bg-emerald-500/20 neon-glow-emerald' : 'bg-rose-500/20 neon-glow-rose'}`}>
                  {triageData?.triage_status === 'AUTO_APPROVED' ? <Shield className="w-10 h-10 text-emerald-500" /> : <ShieldAlert className="w-10 h-10 text-rose-500" />}
                </div>
                <div>
                  <h3 className="text-3xl font-bold truncate">Syndicate Triage</h3>
                  <p className={`text-sm font-bold uppercase tracking-wider ${triageData?.triage_status === 'AUTO_APPROVED' ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                    {triageData?.triage_status === 'AUTO_APPROVED' ? 'Auto-Deployment Suggested' : 'Human Overrule Required'}
                  </p>
                </div>
              </div>
              <div className="mb-10 w-full">
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Model Score</p>
                  <p className={`text-4xl font-bold ${triageData?.triage_status === 'AUTO_APPROVED' ? 'text-emerald-400' : 'text-rose-400'}`}>{(triageData?.accuracy * 100).toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => handleApprove(false)} className="flex-1 py-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all active:scale-95 border border-slate-700">Abort Execution</button>
                <button onClick={() => {
                  handleApprove(true);
                  if (typeof toast !== 'undefined' && toast.success) toast.success('Report Sent via WhatsApp');
                  else alert('Report Sent via WhatsApp');
                }} className={`flex-1 py-5 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 ${triageData?.triage_status === 'AUTO_APPROVED' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'}`}>
                  🚀 Deploy & Send WhatsApp Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sidebar */}
      <aside className="m-4 w-20 glass rounded-[32px] flex flex-col items-center py-8 gap-10 z-50">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center neon-glow-emerald">
          <Zap className="w-6 h-6 text-slate-950" />
        </div>
        <nav className="flex-1 flex flex-col gap-6">
          {[
            { id: 'swarm', icon: Layout, label: 'Swarm' },
            { id: 'playground', icon: BrainCircuit, label: 'Playground', disabled: !deploymentStatus },
            { id: 'health', icon: Pulse, label: 'Health' },
            { id: 'history', icon: Search, label: 'History' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => !item.disabled && setActiveTab(item.id)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative ${activeTab === item.id ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 neon-glow-emerald' : item.disabled ? 'opacity-20 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <item.icon className="w-6 h-6" />
              <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 rounded text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">{item.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="w-12 h-12 rounded-2xl flex items-center justify-center text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-90">
          <LogOut className="w-6 h-6" />
        </button>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-24 px-10 flex items-center justify-between border-b border-white/5 bg-slate-950/20 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">{activeTab === 'swarm' ? 'Intelligence Dashboard' : activeTab === 'playground' ? 'Oracle Playground' : activeTab === 'history' ? 'Pipeline History' : 'System Telemetry'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">{activeTab === 'swarm' ? 'Autonomous Orchestration Active' : activeTab === 'history' ? 'Datalake Linked' : 'Real-time Stream Online'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="w-48 space-y-2">
              <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Neural Load</span>
                <span>{isProcessing ? healthMetrics.load.toFixed(0) : 0}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <motion.div animate={{ width: `${isProcessing ? healthMetrics.load : 0}%` }} className="h-full bg-emerald-500 neon-glow-emerald" />
              </div>
            </div>
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                <span>FinOps Budget</span>
                <span>${(isProcessing || totalCost > 0) ? totalCost.toFixed(4) : "0.0000"}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <motion.div animate={{ width: `${(isProcessing || totalCost > 0) ? Math.min(100, (totalCost / 0.1) * 100) : 0}%` }} className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]" />
              </div>
              {(isProcessing || totalCost > 0) && (
                <div className="text-[8px] text-slate-500 uppercase tracking-widest mt-1 font-mono">
                  Total: ${(totalCost).toFixed(3)} (LLM Tokens: ${(totalCost * 0.6).toFixed(3)} | Compute: ${(totalCost * 0.35).toFixed(3)} | Storage: ${(totalCost * 0.05).toFixed(3)})
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 px-5 py-3 glass rounded-2xl border-white/10">
              <Shield className={`w-4 h-4 ${privacyActive ? 'text-emerald-500' : 'text-slate-600'}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${privacyActive ? 'text-emerald-500' : 'text-slate-600'}`}>{privacyActive ? 'Privacy Shield Active' : 'Shield Offline'}</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'swarm' && (
              <motion.div key="swarm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex gap-8 min-h-0">
                {/* Left Col: Terminal & Upload */}
                <div className="w-[45%] flex flex-col gap-6 h-full min-h-0">
                  {!file && !isUploading ? (
                    <motion.div
                      onDragOver={handleDragOver}
                      onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]); }}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-64 glass-card rounded-[32px] flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden shrink-0"
                    >
                      <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0])} />
                      {/* Neural Grid Background */}
                      <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.1" /></pattern>
                          <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                      </div>
                      <div className="w-20 h-20 rounded-[24px] bg-slate-800 flex items-center justify-center mb-6 border border-white/5 transition-all group-hover:scale-110 group-hover:border-emerald-500/30 box-content">
                        <UploadCloud className="w-8 h-8 text-emerald-500" />
                      </div>
                      <p className="text-lg font-bold text-white mb-2">Ingest Dataset</p>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Drag & Drop CSV / Browse System</p>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 shrink-0 auto-rows-fr">
                      {agents.map((agent) => {
                        const Icon = agent.icon;
                        const isCompleted = agent.status === 'completed';
                        const isActive = agent.status === 'active';
                        return (
                          <div key={agent.id} className={`glass-card p-4 rounded-2xl flex flex-col items-center gap-3 relative overflow-hidden group transition-all duration-300 ${isActive ? 'border-emerald-500/50 scale-[1.02]' : isCompleted ? 'border-emerald-500/20 bg-emerald-500/5' : ''}`}>
                            <div className={`absolute top-0 left-0 w-full h-0.5 ${isActive ? 'bg-emerald-500 animate-pulse' : isCompleted ? 'bg-emerald-500/50' : 'bg-transparent'}`} />
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-emerald-500/20 text-emerald-500 shield-pulse' : isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col items-center gap-1 w-full">
                              <span className={`text-[10px] font-bold uppercase tracking-tighter truncate w-full text-center ${isCompleted ? 'text-emerald-400' : ''}`}>{agent.name}</span>
                              {agent.stats && isCompleted ? (
                                <span className="text-[9px] text-emerald-500/80 font-mono text-center truncate w-full">{agent.stats}</span>
                              ) : (
                                <div className={`h-1 w-8 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : isCompleted ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Terminal Intelligence Stream */}
                  <div className="flex-1 glass-card rounded-[32px] overflow-hidden flex flex-col relative">
                    <div className="scanline" />
                    <div className="h-12 px-6 flex items-center gap-3 bg-slate-950/40 border-b border-white/5 shrink-0">
                      <Terminal className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Neural Intelligence Stream</span>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto space-y-3 terminal-text scrollbar-thin">
                      <AnimatePresence>
                        {logs.map((log, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-4">
                            <span className="opacity-40 select-none">{String(i + 1).padStart(3, '0')}</span>
                            <p className="flex-1">{log}</p>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div ref={endOfLogsRef} />
                    </div>
                  </div>
                </div>

                {/* Right Col: Visualization */}
                <div className="flex-1 flex flex-col gap-6 min-h-0">
                  <div className="flex-1 glass-card rounded-[40px] p-8 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-start mb-10">
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-white mb-2">Results Pipeline</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Validated Synthesized Artifacts</p>
                      </div>
                      {dataProfile && <div className="px-4 py-2 glass rounded-xl border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Session Sync Active</div>}
                    </div>

                    {!dataProfile ? (
                      <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                        <Activity className="w-16 h-16 mb-6 animate-pulse" />
                        <p className="text-sm font-bold uppercase tracking-widest">Awaiting Neural Link</p>
                      </div>
                    ) : (
                      <div className="space-y-8 overflow-y-auto pr-2">
                        {modelBase64 && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={downloadModel}
                            className="w-full py-4 mb-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold rounded-2xl border border-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.1)] group"
                          >
                            <Download className="w-5 h-5 group-hover:animate-bounce" /> 📥 Download Trained Model (.pkl)
                          </motion.button>
                        )}
                        {modelMetrics && (
                          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-4">
                            {Object.entries(modelMetrics)
                              .filter(([k]) => !['leaderboard', 'model_file_base64', 'model_base_4', 'model_base64'].includes(k))
                              .map(([k, v]) => (
                                <div key={k} className="bg-slate-950/40 border border-white/5 p-6 rounded-[24px] relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                                    <ChartIcon className="w-4 h-4 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">{k.replace(/_/g, ' ')}</p>
                                    {(k.toLowerCase() === 'rmse' || k.toLowerCase() === 'mae') && (
                                      <p className="text-[8px] text-emerald-500/60 uppercase tracking-widest mb-2 font-mono">Deviation from Mean Price</p>
                                    )}
                                    {!(k.toLowerCase() === 'rmse' || k.toLowerCase() === 'mae') && <div className="mb-2" />}
                                  </div>
                                  <p className={`font-bold text-white tracking-tighter ${String(v).length > 20 ? 'text-lg leading-tight' : 'text-3xl'}`}>
                                    {typeof v === 'number'
                                      ? v.toFixed(4)
                                      : Array.isArray(v) && k !== 'leaderboard'
                                        ? v.join(', ')
                                        : (typeof v === 'object' && v !== null && k !== 'leaderboard'
                                          ? JSON.stringify(v)
                                          : k !== 'leaderboard' ? v : '...')}
                                  </p>
                                </div>
                              ))}
                          </motion.div>
                        )}
                        {xaiReport && Object.keys(xaiReport).filter(k => typeof xaiReport[k] === 'number').length > 0 && (() => {
                          console.log("XAI Payload:", xaiReport);
                          const entries = Object.entries(xaiReport).filter(([k, v]) => typeof v === 'number');
                          const totalSum = entries.reduce((sum, [k, v]) => sum + Math.abs(v), 0);
                          const chartData = entries
                            .map(([name, value]) => ({
                              name,
                              value: totalSum > 0 ? Number(((Math.abs(value) / totalSum) * 100).toFixed(2)) : 0
                            }))
                            .sort((a, b) => b.value - a.value);
                          const topFeature = chartData[0];
                          return (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-auto glass rounded-[24px] overflow-hidden p-6 border-emerald-500/10 mb-8 mt-8">
                              <div className="flex justify-between items-center mb-6">
                                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2 m-0"><ChartIcon className="w-4 h-4" /> XAI Feature Importance (%)</p>
                                {topFeature && (
                                  <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                                    <Zap className="w-3 h-3" /> TOP DRIVER FOR: {targetColumn ? targetColumn.toUpperCase() : "TARGET"} - {topFeature.name} ({topFeature.value}%)
                                  </div>
                                )}
                              </div>
                              <ResponsiveContainer width="100%" height={200} minHeight={200}>
                                <BarChart
                                  data={chartData}
                                  layout="vertical"
                                  margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={100} />
                                  <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px' }} itemStyle={{ color: '#10b981' }} formatter={(val) => `${val}%`} />
                                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} minPointSize={5} />
                                </BarChart>
                              </ResponsiveContainer>
                            </motion.div>
                          );
                        })()}
                        {/* Model Leaderboard */}
                        {modelMetrics?.leaderboard && (
                          <div className="glass rounded-[24px] overflow-hidden p-6 border-emerald-500/10 mb-8 mt-8">
                            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2"><ChartIcon className="w-4 h-4" /> Model Leaderboard</p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                  <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-slate-500">
                                    <th className="py-3 px-4 font-bold w-12 text-center">Rank</th>
                                    <th className="py-3 px-4 font-bold">Model Architecture</th>
                                    <th className="py-3 px-4 font-bold text-right">CV Score</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[...modelMetrics.leaderboard]
                                    .sort((a, b) => b.score - a.score)
                                    .slice(0, 10)
                                    .map((model, idx) => (
                                      <tr key={idx} className={`border-b border-white/5 transition-colors ${idx === 0 ? 'bg-emerald-500/10' : 'hover:bg-slate-800/50'}`}>
                                        <td className="py-3 px-4 text-center">
                                          {idx === 0 ? <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center mx-auto shadow-[0_0_10px_rgba(16,185,129,0.5)]"><span className="text-[10px] font-bold text-slate-950">1</span></div> : <span className="text-slate-500 font-mono">{idx + 1}</span>}
                                        </td>
                                        <td className={`py-3 px-4 font-bold tracking-tight ${idx === 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                                          {model.model_name}
                                          {idx === 0 && <span className="ml-3 text-[8px] uppercase tracking-widest border border-emerald-500/30 px-2 py-0.5 rounded-full text-emerald-500">Deploying</span>}
                                        </td>
                                        <td className="py-3 px-4 font-mono text-emerald-400 text-right">
                                          {(model.score * 100).toFixed(2)}%
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {/* Dataset Summary Table */}
                        <div className="glass rounded-[24px] overflow-hidden p-6 border-emerald-500/10 mt-8 mb-4">
                          <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2"><TableProperties className="w-4 h-4" /> Dataset Summary</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                              <thead>
                                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-slate-500">
                                  <th className="py-3 px-4 font-bold">Metric</th>
                                  <th className="py-3 px-4 font-bold text-right">Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-white/5">
                                  <td className="py-3 px-4 text-slate-300">Total Rows Processed</td>
                                  <td className="py-3 px-4 font-mono text-emerald-400 text-right">{dataProfile.total_rows || 'Unknown'}</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                  <td className="py-3 px-4 text-slate-300">Engineered Features Count</td>
                                  <td className="py-3 px-4 font-mono text-emerald-400 text-right">{dataProfile.engineered_features_count || dataProfile.total_columns || 'Unknown'}</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                  <td className="py-3 px-4 text-slate-300">PII Columns Masked</td>
                                  <td className="py-3 px-4 font-mono text-emerald-400 text-right">{dataProfile.pii_masked_count !== undefined ? dataProfile.pii_masked_count : 0}</td>
                                </tr>
                                <tr>
                                  <td className="py-3 px-4 text-slate-300">Missing Values Handled</td>
                                  <td className="py-3 px-4 font-mono text-emerald-400 text-right">
                                    {dataProfile.missing_values !== undefined
                                      ? (typeof dataProfile.missing_values === 'object'
                                        ? Object.values(dataProfile.missing_values).reduce((a, b) => a + b, 0)
                                        : dataProfile.missing_values)
                                      : 0}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                        {/* API Badge */}
                        {deploymentStatus && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex items-center justify-between p-4 glass rounded-2xl border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center relative">
                                <Activity className="w-5 h-5 text-emerald-500" />
                                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                              </div>
                              <div>
                                <h4 className="text-emerald-400 font-bold text-sm tracking-tight">API READY FOR INFERENCE</h4>
                                <p className="text-[10px] text-emerald-500/60 uppercase tracking-widest font-mono font-bold">Endpoint Live</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Protocol</span>
                              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs">POST /predict</div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'playground' && (
              <motion.div key="playground" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="h-full flex gap-8">
                <div className="w-[40%] glass-card p-10 rounded-[40px] overflow-y-auto">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                      <Zap className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Query Oracle</h3>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Inference Execution Portal</p>
                    </div>
                  </div>
                  <form className="space-y-8" onSubmit={(e) => {
                    e.preventDefault();
                    const fd = {};
                    dataProfile?.numerical_columns?.forEach(c => fd[c] = parseFloat(e.target[c].value));
                    dataProfile?.categorical_columns?.forEach(c => fd[c] = e.target[c].value);
                    handlePredict(fd);
                  }}>
                    <div className="grid grid-cols-1 gap-6">
                      {dataProfile?.numerical_columns?.slice(0, 6).map(col => (
                        <div key={col} className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-2">{col}</label>
                          <input name={col} type="number" step="any" required className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500/40 transition-all font-mono text-sm" />
                        </div>
                      ))}
                    </div>
                    <button disabled={isPredicting} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-900/20 transition-all active:scale-95 flex items-center justify-center gap-3">
                      {isPredicting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Pulse className="w-5 h-5" /> Execute Inference</>}
                    </button>
                  </form>
                </div>

                <div className="flex-1 flex flex-col gap-6">
                  <div className="h-1/2 glass-card rounded-[40px] flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />
                    {!predictionResult && !isPredicting ? (
                      <div className="space-y-6">
                        <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mx-auto border border-white/5 opacity-50">
                          <Info className="w-10 h-10 text-slate-600" />
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Awaiting Ingress Data</p>
                      </div>
                    ) : isPredicting ? (
                      <div className="space-y-8">
                        <div className="relative">
                          <div className="absolute inset-0 blur-2xl bg-indigo-500/20 rounded-full animate-pulse" />
                          <Loader2 className="w-20 h-20 text-indigo-400 animate-spin relative mx-auto" />
                        </div>
                        <p className="text-indigo-400 font-bold uppercase tracking-[0.3em] animate-pulse">Processing High-D Logic...</p>
                      </div>
                    ) : (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-10">Intelligence Outcome</p>
                        <div className="text-8xl font-black text-white tracking-tighter mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                          {predictionResult.prediction}
                        </div>
                        <div className="inline-flex items-center gap-4 px-8 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-[20px]">
                          <span className="text-emerald-500 text-xs font-bold uppercase tracking-widest">Confidence Score</span>
                          <span className="text-emerald-400 font-bold text-xl">{(predictionResult.confidence_score * 100).toFixed(2)}%</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <div className="flex-1 glass-card rounded-[40px] p-10 flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                      <BrainCircuit className="w-6 h-6 text-indigo-400" />
                      <h4 className="text-lg font-bold">XAI Narrative Synthesis</h4>
                    </div>
                    <div className="bg-slate-950/40 p-6 rounded-[24px] border border-white/5 flex-1 relative group">
                      <div className="absolute top-0 right-0 p-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-slate-400 text-sm leading-[1.8] font-medium">
                        {xaiReport?.ai_reasoning || (predictionResult ? "Synthesis complete. The outcome is strongly correlated with standardized feature distributions. High confidence indicates low variance in the local decision boundary." : "Neural explanation will manifest once inference is finalized.")}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'health' && (
              <motion.div key="health" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full grid grid-cols-4 gap-6 content-start">
                {[
                  { label: "Request Latency", val: "18ms", icon: Zap, color: "text-emerald-400", data: healthMetrics.latency },
                  { label: "System Volume", val: healthMetrics.volume.toLocaleString(), icon: ChartIcon, color: "text-indigo-400", data: healthMetrics.latency.map(v => v * 1.2) },
                  { label: "Stability Score", val: "99.9%", icon: Shield, color: "text-emerald-400", data: healthMetrics.latency.map(v => 50 + Math.random() * 5) },
                  { label: "Global Load", val: healthMetrics.load.toFixed(0) + "%", icon: Activity, color: "text-rose-400", data: healthMetrics.latency.map(v => v * 0.8) }
                ].map((stat, i) => (
                  <div key={i} className="glass-card p-8 rounded-[32px] flex flex-col gap-6 group hover:scale-[1.02] transition-transform">
                    <div className="flex justify-between items-start">
                      <div className={`w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/5 group-hover:border-emerald-500/30 transition-colors`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                        <p className="text-3xl font-bold text-white tracking-tighter">{stat.val}</p>
                      </div>
                    </div>
                    <div className="h-16 w-full opacity-50 group-hover:opacity-100 transition-opacity">
                      <ResponsiveContainer width="100%" height="100%" minHeight={60}>
                        <AreaChart data={stat.data.map((v, i) => ({ i, v }))}>
                          <Area type="monotone" dataKey="v" stroke={stat.color === 'text-emerald-400' ? '#10b981' : stat.color === 'text-indigo-400' ? '#6366f1' : '#f43f5e'} strokeWidth={2} fill="transparent" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
                <div className="col-span-4 glass-card p-10 rounded-[40px] flex items-center justify-between">
                  <div>
                    <h4 className="text-2xl font-bold mb-2">Regional Operations</h4>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Neural Swarm Node Status</p>
                  </div>
                  <div className="flex gap-10">
                    {['US-EAST-1', 'EU-WEST-4', 'AP-SO-2'].map((loc, i) => (
                      <div key={loc} className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-emerald-500 neon-glow-emerald animate-pulse' : 'bg-slate-700'}`} />
                        <span className={`text-sm font-bold ${i === 0 ? 'text-white' : 'text-slate-600'}`}>{loc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="h-full flex flex-col glass-card rounded-[40px] p-10 overflow-hidden">
                <div className="flex items-center gap-4 mb-10 shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <Database className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Experiment Tracking</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Historical Pipeline Syntheses</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin">
                  {isLoadingHistory ? (
                    <div className="flex h-full items-center justify-center text-slate-500 font-mono text-sm animate-pulse">Loading Datalake...</div>
                  ) : historyData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-slate-500 font-mono text-sm">No historical experiments recorded.</div>
                  ) : (
                    <div className="space-y-4">
                      {historyData.map((run, i) => (
                        <div key={i} className="glass rounded-[24px] p-6 border-white/5 flex gap-8 items-center group hover:bg-slate-800/20 transition-colors">
                          <div className="w-16 h-16 rounded-2xl bg-slate-900/50 flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                            <Activity className="w-6 h-6 text-emerald-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-lg">{run.dataset}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{new Date(run.timestamp).toLocaleString()}</p>
                          </div>
                          <div className="flex gap-6 pr-4">
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Score / R2</p>
                              <p className="font-mono text-emerald-400 font-bold text-lg">{run.metrics?.accuracy ? (run.metrics.accuracy * 100).toFixed(2) : run.metrics?.r2_score ? (run.metrics.r2_score * 100).toFixed(2) : '--'}%</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total Cost</p>
                              <p className="font-mono text-slate-300 font-bold text-lg">${run.cost ? run.cost.toFixed(4) : "0.0000"}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Chat Toggle */}
        <button onClick={() => setShowChat(true)} className="fixed bottom-10 right-10 w-20 h-20 bg-emerald-600 rounded-[30px] flex items-center justify-center shadow-2xl shadow-emerald-900/40 hover:scale-110 active:scale-90 transition-all z-50 group">
          <BrainCircuit className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-4 border-[#020617] animate-pulse" />
        </button>

        {/* Chat Drawer */}
        <AnimatePresence>
          {showChat && (
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-[450px] glass border-l border-white/10 z-[60] flex flex-col shadow-[-50px_0_100px_rgba(0,0,0,0.5)]">
              <div className="p-10 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <BrainCircuit className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Syndicate Lead</h3>
                </div>
                <button onClick={() => setShowChat(false)} className="text-slate-500 hover:text-white transition-colors">
                  <ChevronRight className="w-8 h-8" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-none">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-6 rounded-[24px] text-sm leading-relaxed ${m.role === 'user' ? 'bg-emerald-600 text-white font-medium shadow-xl' : 'glass border-white/10 text-slate-300'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="glass p-5 rounded-2xl">
                      <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-10 bg-slate-950/40 backdrop-blur-3xl border-t border-white/5">
                <div className="flex gap-4">
                  <input
                    value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()}
                    placeholder="Submit query to the swarm..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/30 transition-all font-mono text-sm"
                  />
                  <button onClick={handleChat} className="p-4 bg-emerald-600 rounded-2xl hover:bg-emerald-500 transition-all active:scale-90">
                    <Activity className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main >
    </div >
  );
}
