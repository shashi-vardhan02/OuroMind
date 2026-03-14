import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, FileText, ChevronLeft, User, Activity, Check, Minus, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sendMessage, generateReport, generateProfileFromText } from '../services/api';
import type { PatientProfile, Message } from '../services/api';
import jsPDF from 'jspdf';

const Dashboard = () => {
  const [patientProfile, setPatientProfile] = useState<PatientProfile>({
    name: 'Alex Thorne',
    age: '28',
    gender: 'Male',
    primarySymptoms: 'Severe social anxiety limiting occupational function.',
    behaviouralPatterns: 'Avoids eye contact, gives short answers, deflects personal questions.',
    resistanceLevel: 7,
    moodLevel: 5,
    communicationStyle: 'Withdrawn',
    triggerTopics: 'Public speaking, performance reviews',
    backgroundContext: 'Software developer, recently promoted to team lead but struggling with new communicative requirements.',
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDescribeModal, setShowDescribeModal] = useState(false);
  const [describeInput, setDescribeInput] = useState('');
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // ── Send Message Handler — calls REAL API with full history ──
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', content: inputMessage.trim() };
    const fullHistory = [...messages, userMsg];

    setMessages(fullHistory);
    setInputMessage('');
    setIsTyping(true);
    setError(null);

    try {
      const reply = await sendMessage(fullHistory, patientProfile);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      setError('API Error: ' + (err.message || 'Failed to get response. Is the server running?'));
      console.error('OuroMind API Error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Generate Report Handler — calls REAL API ──
  const handleGenerateReport = async () => {
    if (messages.length < 2) return;
    setShowReport(true);
    setIsGeneratingReport(true);
    setError(null);
    try {
      const data = await generateReport(messages, patientProfile);
      setReportData(data);
    } catch (err: any) {
      setError('Report Error: ' + (err.message || 'Failed to generate report.'));
      setShowReport(false);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // ── Auto-fill Profile Handler — calls REAL API ──
  const handleGenerateProfile = async () => {
    if (!describeInput.trim()) return;
    setIsGeneratingProfile(true);
    try {
      const profile = await generateProfileFromText(describeInput);
      setPatientProfile(profile);
      setShowDescribeModal(false);
      setDescribeInput('');
    } catch (err: any) {
      setError('Profile Error: ' + (err.message || 'Failed to generate profile.'));
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  // ── Reset session ──
  const handleResetSession = () => {
    setMessages([]);
    setReportData(null);
    setError(null);
  };

  const handleDownloadReport = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    const addLine = (text: string, fontSize = 12, isBold = false, color = [255, 255, 255]) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, margin, y);
      y += (lines.length * fontSize * 0.4) + 4;
    };

    const addGap = (size = 8) => { y += size; };

    // Dark background
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');

    // Header
    doc.setFillColor(255, 85, 0);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('OuroMind — Session Report', margin, 22);
    y = 45;

    // Patient info
    addLine(`Patient: ${patientProfile.name} | Age: ${patientProfile.age} | Gender: ${patientProfile.gender}`, 10, false, [180, 180, 180]);
    addLine(`Generated: ${new Date().toLocaleString()}`, 10, false, [180, 180, 180]);
    addGap();

    // Score
    addLine(`Overall Score: ${reportData.overallScore} / 10`, 16, true, [255, 85, 0]);
    addGap();

    // Summary
    addLine('Session Summary', 14, true, [255, 85, 0]);
    addLine(reportData.sessionSummary, 11, false, [220, 220, 220]);
    addGap();

    // Engagement Arc
    addLine('Patient Engagement Arc', 14, true, [255, 85, 0]);
    addLine(reportData.patientEngagementArc, 11, false, [220, 220, 220]);
    addGap();

    // What Worked
    addLine('What Worked', 14, true, [80, 200, 120]);
    reportData.whatWorked?.forEach((item: any) => {
      if (y > 260) { doc.addPage(); y = 20; doc.setFillColor(10, 10, 10); doc.rect(0, 0, pageWidth, 300, 'F'); }
      addLine(`• ${item.technique}`, 12, true, [255, 255, 255]);
      addLine(`  "${item.example}"`, 10, false, [180, 180, 180]);
      addLine(`  ${item.why}`, 10, false, [200, 200, 200]);
      addGap(4);
    });
    addGap();

    // What Didn't Work
    addLine("What Didn't Work", 14, true, [255, 100, 100]);
    reportData.whatDidntWork?.forEach((item: any) => {
      if (y > 260) { doc.addPage(); y = 20; doc.setFillColor(10, 10, 10); doc.rect(0, 0, pageWidth, 300, 'F'); }
      addLine(`• ${item.technique}`, 12, true, [255, 255, 255]);
      addLine(`  "${item.example}"`, 10, false, [180, 180, 180]);
      addLine(`  ${item.why}`, 10, false, [200, 200, 200]);
      addGap(4);
    });
    addGap();

    // Recommendation
    addLine('Recommended Approach for Real Session', 14, true, [255, 85, 0]);
    addLine(reportData.recommendedApproachForRealSession, 11, false, [220, 220, 220]);
    addGap();

    // Techniques
    addLine('Techniques Detected', 14, true, [255, 85, 0]);
    addLine(reportData.techniquesDetected?.join(', ') || 'None', 11, false, [220, 220, 220]);

    // Save
    doc.save(`OuroMind_Report_${patientProfile.name}_${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#0d0a08] text-white flex flex-col h-screen overflow-hidden relative">
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120vw] h-[120vh] bg-[radial-gradient(circle_at_center,rgba(90,26,0,0.45)_0%,#0d0a08_60%)] -z-20 pointer-events-none"></div>
      <div className="fixed top-0 left-0 w-screen h-screen bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] -z-10 pointer-events-none"></div>
      
      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 max-w-xl"
          >
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-2 text-white/80 hover:text-white">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <header className="h-16 border-b border-[#2a2018] bg-[#0d0a08]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-[#999888] hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2 font-bold text-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff4d00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            OuroMind
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-[#999888]">{messages.length > 0 ? 'Session active' : 'No session'}</div>
          <button 
            onClick={handleGenerateReport}
            disabled={messages.length < 2 || isGeneratingReport}
            className="px-4 py-2 bg-[#ff4d00] hover:bg-[#ff6633] disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-sm font-semibold transition-colors flex items-center gap-2 text-white"
          >
            {isGeneratingReport ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            {isGeneratingReport ? 'Analyzing...' : 'Generate Report'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Panel: Patient Profile */}
        <div className="w-[340px] border-r border-[#2a2018] bg-[#0d0a08]/50 backdrop-blur-sm overflow-y-auto shrink-0 flex flex-col z-10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-[#999888] uppercase tracking-widest">Patient Profile</h2>
              <button 
                onClick={() => setShowDescribeModal(true)}
                className="text-xs bg-transparent border border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.4)] text-white px-3 py-1.5 rounded-full font-medium transition-colors"
              >
                Auto-Fill Info
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#999888] mb-1 block">Patient Name/Alias</label>
                <input 
                  type="text" 
                  value={patientProfile.name}
                  onChange={(e) => setPatientProfile({...patientProfile, name: e.target.value})}
                  className="w-full bg-[#1a1410] border border-[#2a2018] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#ff4d00] transition-colors"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-[#999888] mb-1 block">Age</label>
                  <input 
                    type="text" 
                    value={patientProfile.age}
                    onChange={(e) => setPatientProfile({...patientProfile, age: e.target.value})}
                    className="w-full bg-[#1a1410] border border-[#2a2018] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#ff4d00]"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-[#999888] mb-1 block">Gender</label>
                  <input 
                    type="text" 
                    value={patientProfile.gender}
                    onChange={(e) => setPatientProfile({...patientProfile, gender: e.target.value})}
                    className="w-full bg-[#1a1410] border border-[#2a2018] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#ff4d00]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#999888] mb-1 block">Resistance Level: {patientProfile.resistanceLevel}/10</label>
                <input 
                  type="range" 
                  min={1} max={10}
                  value={patientProfile.resistanceLevel}
                  onChange={(e) => setPatientProfile({...patientProfile, resistanceLevel: Number(e.target.value)})}
                  className="w-full accent-[#ff4d00]"
                />
              </div>

              <div>
                <label className="text-xs text-[#999888] mb-1 block">Mood Level: {patientProfile.moodLevel || 5}/10</label>
                <input 
                  type="range" 
                  min={1} max={10}
                  value={patientProfile.moodLevel || 5}
                  onChange={(e) => setPatientProfile({...patientProfile, moodLevel: Number(e.target.value)})}
                  className="w-full accent-[#ff4d00]"
                />
              </div>

              <div>
                <label className="text-xs text-[#999888] mb-1 block">Communication Style</label>
                <select 
                  value={patientProfile.communicationStyle || 'Withdrawn'}
                  onChange={(e) => setPatientProfile({...patientProfile, communicationStyle: e.target.value})}
                  className="w-full bg-[#1a1410] border border-[#2a2018] rounded-xl px-3 py-2 text-sm focus:outline-none text-[#ff4d00] focus:border-[#ff4d00]"
                >
                  <option value="Withdrawn">Withdrawn (short answers)</option>
                  <option value="Aggressive">Aggressive / Defensive</option>
                  <option value="Passive">Passive-Aggressive</option>
                  <option value="Deflective">Deflective (uses humor)</option>
                  <option value="Cooperative">Cooperative but overwhelmed</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs text-[#999888] mb-1 block">Primary Symptoms</label>
                <textarea 
                  value={patientProfile.primarySymptoms}
                  onChange={(e) => setPatientProfile({...patientProfile, primarySymptoms: e.target.value})}
                  rows={2}
                  className="w-full bg-[#1a1410] border border-[#2a2018] rounded-xl p-3 text-sm focus:outline-none focus:border-[#ff4d00] transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#999888] mb-1 block">Behavioural Patterns</label>
                <textarea 
                  value={patientProfile.behaviouralPatterns}
                  onChange={(e) => setPatientProfile({...patientProfile, behaviouralPatterns: e.target.value})}
                  rows={2}
                  className="w-full bg-[#1a1410] border border-[#2a2018] rounded-xl p-3 text-sm focus:outline-none focus:border-[#ff4d00] transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#999888] mb-1 block">Trigger Topics</label>
                <input 
                  type="text" 
                  value={patientProfile.triggerTopics || ''}
                  onChange={(e) => setPatientProfile({...patientProfile, triggerTopics: e.target.value})}
                  className="w-full bg-[#1a1410] border border-[#2a2018] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#ff4d00]"
                />
              </div>

              <div>
                <label className="text-xs text-[#999888] mb-1 block">Background Context</label>
                <textarea 
                  value={patientProfile.backgroundContext}
                  onChange={(e) => setPatientProfile({...patientProfile, backgroundContext: e.target.value})}
                  rows={2}
                  className="w-full bg-[#1a1410] border border-[#2a2018] rounded-xl p-3 text-sm focus:outline-none focus:border-[#ff4d00] transition-colors resize-none"
                />
              </div>

            </div>
          </div>
          
          <div className="mt-auto p-6 pt-4 border-t border-[#2a2018] bg-[#0d0a08]/80">
            <button 
              onClick={handleResetSession}
              className="w-full py-2.5 bg-transparent border border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.4)] text-white rounded-full text-sm font-semibold transition-all"
            >
              Restart Session
            </button>
          </div>
        </div>

        {/* Right Panel: Chat Interface */}
        <div className="flex-1 flex flex-col bg-transparent relative z-0">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="text-center text-xs text-[#999888] my-4 uppercase tracking-widest font-semibold flex items-center gap-4 before:h-px before:flex-1 before:bg-[#2a2018] after:h-px after:flex-1 after:bg-[#2a2018]">
              {messages.length > 0 ? 'Simulation Active' : 'Type a message to start'}
            </div>

            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${
                  msg.role === 'user' 
                    ? 'bg-[#1a1410] text-[#ff4d00] border-[#2a2018]' 
                    : 'bg-[#1a1410] text-[#999888] border-[#2a2018]'
                }`}>
                  {msg.role === 'user' ? <User size={18} /> : <span className="font-bold text-sm">PT</span>}
                </div>
                <div className={`max-w-[75%] p-4 text-[15px] leading-relaxed shadow-[0_10px_30px_rgba(0,0,0,0.3)] ${
                  msg.role === 'user'
                    ? 'bg-[#1a1410] border border-[#2a2018] rounded-2xl rounded-tr-none text-white'
                    : 'bg-[rgba(255,255,255,0.05)] rounded-2xl rounded-tl-none text-[#e0e0e0]'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-[#1a1410] border border-[#2a2018] flex items-center justify-center shrink-0">
                  <span className="font-bold text-sm text-[#999888]">PT</span>
                </div>
                <div className="bg-transparent text-[#999888] text-sm flex items-center gap-2 p-4">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-[#999888] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-[#999888] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-[#999888] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Inline error banner */}
            {error && (
              <div style={{
                background: '#ff000022',
                border: '1px solid #ff4444',
                color: '#ff6666',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                margin: '8px 0'
              }}>
                ⚠ {error}
              </div>
            )}
            
            <div ref={messagesEndRef} className="pb-4" />
          </div>

          {/* Chat Input */}
          <div className="p-6 bg-[#0d0a08]/80 backdrop-blur-md border-t border-[#2a2018]">
            <div className="max-w-4xl mx-auto relative flex gap-3">
              <input 
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your therapeutic response (e.g., 'How does that make you feel?')..."
                className="w-full h-14 bg-[#1a1410] border border-[#2a2018] rounded-full pl-6 pr-4 text-[15px] focus:outline-none focus:border-[#ff4d00] transition-colors shadow-inner text-white"
                disabled={isTyping}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="w-14 h-14 shrink-0 bg-[#ff4d00] hover:bg-[#ff6633] disabled:bg-[#1a1410] disabled:text-[#999888] text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              >
                <Send size={20} className={inputMessage.trim() && !isTyping ? "ml-1" : ""} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-fill Profile Modal */}
      <AnimatePresence>
        {showDescribeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#1a1410] border border-[#2a2018] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-[#2a2018] flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Auto-fill Patient Profile</h3>
                <button 
                  onClick={() => setShowDescribeModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#999888] transition-colors"
                >✕</button>
              </div>
              <div className="p-5">
                <p className="text-sm text-[#999888] mb-4">Paste clinical notes or a free-text description of the patient, and our AI will automatically structure it into the profile fields.</p>
                <textarea 
                  value={describeInput}
                  onChange={(e) => setDescribeInput(e.target.value)}
                  placeholder="e.g. John is a 45yo divorced male presenting with severe depressive symptoms and extreme resistance to CBT..."
                  className="w-full h-32 bg-[#0d0a08] border border-[#2a2018] rounded-xl p-3 text-sm focus:outline-none focus:border-[#ff4d00] resize-none mb-4 text-white"
                />
                <button 
                  onClick={handleGenerateProfile}
                  disabled={!describeInput.trim() || isGeneratingProfile}
                  className="w-full py-3 bg-[#ff4d00] hover:bg-[#ff6633] disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-bold flex items-center justify-center gap-2 transition-colors text-white"
                >
                  {isGeneratingProfile ? <Loader2 size={18} className="animate-spin" /> : null}
                  {isGeneratingProfile ? "Generating Profile..." : "Analyze & Apply"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showReport && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#1a1410] border border-[#2a2018] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[#2a2018] flex items-center justify-between bg-[rgba(255,77,0,0.05)]">
                <div className="flex items-center gap-3 text-[#ff4d00]">
                  <Activity size={24} />
                  <h3 className="text-xl font-bold text-white">"What Worked" Report</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownloadReport}
                    style={{
                      background: '#ff5500',
                      color: 'white',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    ⬇ Download Report PDF
                  </button>
                  <button 
                    onClick={() => setShowReport(false)}
                    className="w-8 h-8 rounded-full hover:bg-[rgba(255,255,255,0.05)] flex items-center justify-center transition-colors text-[#999888]"
                  >✕</button>
                </div>
              </div>
              
              <div className="p-8 overflow-y-auto w-full text-white">
                {isGeneratingReport ? (
                  <div className="py-20 flex flex-col items-center justify-center text-[#999888] gap-4">
                    <Loader2 size={40} className="animate-spin text-[#ff4d00]" />
                    <p className="font-medium animate-pulse">Analyzing clinical transcript...</p>
                  </div>
                ) : reportData ? (
                  <div className="space-y-8">
                    {/* Header Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[#0d0a08] p-4 rounded-xl border border-[#2a2018] col-span-2">
                        <div className="text-[#999888] text-xs mb-1 font-bold uppercase tracking-wider">Session Summary</div>
                        <div className="text-sm text-[#e0e0e0] leading-relaxed">{reportData.sessionSummary}</div>
                      </div>
                      <div className="bg-[#0d0a08] p-4 rounded-xl border border-[#2a2018] flex flex-col items-center justify-center">
                        <div className="text-[#999888] text-xs mb-1 font-bold uppercase tracking-wider text-center">Efficacy Score</div>
                        <div className="text-3xl font-bold text-[#ff4d00]">{reportData.overallScore}<span className="text-lg text-[#999888]">/10</span></div>
                      </div>
                      <div className="bg-[#0d0a08] p-4 rounded-xl border border-[#2a2018]">
                        <div className="text-[#999888] text-xs mb-2 font-bold uppercase tracking-wider">Techniques Logged</div>
                        <div className="flex flex-wrap gap-2">
                          {reportData.techniquesDetected?.map((t: string, i: number) => (
                            <span key={i} className="text-[10px] px-2 py-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded text-[#e0e0e0]">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* What Worked / Didn't */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-[#ff4d00] uppercase tracking-widest flex items-center gap-2 border-b border-[#2a2018] pb-2">
                          <Check size={16} /> What Worked
                        </h4>
                        {reportData.whatWorked?.map((item: any, i: number) => (
                          <div key={i} className="bg-[#0d0a08] border border-[#2a2018] p-4 rounded-xl">
                            <span className="text-xs font-bold text-[#ff4d00] bg-[rgba(255,77,0,0.1)] px-2 py-1 rounded-full inline-block mb-3 border border-[rgba(255,77,0,0.2)]">{item.technique}</span>
                            <blockquote className="text-sm text-[#e0e0e0] italic border-l-2 border-[#ff4d00] pl-3 mb-3">"{item.example}"</blockquote>
                            <p className="text-xs text-[#999888]">{item.why}</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-[#999888] uppercase tracking-widest flex items-center gap-2 border-b border-[#2a2018] pb-2">
                          <Minus size={16} /> What Didn't Work
                        </h4>
                        {reportData.whatDidntWork?.map((item: any, i: number) => (
                          <div key={i} className="bg-[#0d0a08] border border-[#2a2018] p-4 rounded-xl">
                            <span className="text-xs font-bold text-[#999888] bg-[rgba(255,255,255,0.05)] px-2 py-1 rounded-full inline-block mb-3 border border-[rgba(255,255,255,0.1)]">{item.technique}</span>
                            <blockquote className="text-sm text-[#e0e0e0] italic border-l-2 border-[#2a2018] pl-3 mb-3">"{item.example}"</blockquote>
                            <p className="text-xs text-[#999888]">{item.why}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div>
                      <h4 className="text-sm font-bold text-[#999888] uppercase tracking-widest mb-3">Clinical Recommendation for Real Session</h4>
                      <p className="text-[15px] text-[#e0e0e0] leading-relaxed bg-[rgba(255,77,0,0.05)] p-5 rounded-xl border border-[rgba(255,77,0,0.2)]">
                        {reportData.recommendedApproachForRealSession}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center text-red-500">Failed to load report data.</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
