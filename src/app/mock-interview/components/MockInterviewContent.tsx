'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Play, RotateCcw, Trophy, MessageSquare, User, Bot, CheckCircle, Star, Zap, Volume2, VolumeX, AlertCircle, Loader2, ArrowRight, Target } from 'lucide-react';
import { useChat } from '@/lib/hooks/useChat';
import toast from 'react-hot-toast';

type InterviewState = 'setup' | 'active' | 'results';
type RecordingState = 'idle' | 'recording' | 'processing';

interface TranscriptEntry {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
  score?: number;
}

interface QuestionEval {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

const JOB_ROLES = [
  { id: 'frontend', label: 'Frontend Engineer', icon: '⚛️', topics: 'React, TypeScript, CSS, Performance' },
  { id: 'backend', label: 'Backend Engineer', icon: '⚙️', topics: 'APIs, Databases, System Design' },
  { id: 'fullstack', label: 'Full-Stack Engineer', icon: '🔧', topics: 'End-to-end development' },
  { id: 'data-science', label: 'Data Scientist', icon: '📊', topics: 'ML, Statistics, Python' },
  { id: 'devops', label: 'DevOps / SRE', icon: '☁️', topics: 'CI/CD, Kubernetes, Cloud' },
  { id: 'system-design', label: 'System Design', icon: '🏗️', topics: 'Scalability, Architecture' },
];

const DIFFICULTY_LEVELS = [
  { id: 'junior', label: 'Junior (0-2 yrs)', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { id: 'mid', label: 'Mid-level (2-5 yrs)', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { id: 'senior', label: 'Senior (5+ yrs)', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
];

function parseEvaluation(text: string): { score: number; feedback: string; nextQuestion: string; strengths: string[]; improvements: string[] } {
  try {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      return {
        score: parsed.score || 5,
        feedback: parsed.feedback || '',
        nextQuestion: parsed.nextQuestion || parsed.next_question || '',
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
      };
    }
  } catch { /* fallback */ }
  return { score: 5, feedback: text.slice(0, 200), nextQuestion: 'Can you elaborate on your experience?', strengths: [], improvements: [] };
}

function parseFinalReport(text: string): { overallScore: number; summary: string; evaluations: QuestionEval[]; strengths: string[]; improvements: string[] } {
  try {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      return {
        overallScore: parsed.overallScore || parsed.overall_score || 5,
        summary: parsed.summary || '',
        evaluations: parsed.evaluations || [],
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
      };
    }
  } catch { /* fallback */ }
  return { overallScore: 5, summary: text.slice(0, 300), evaluations: [], strengths: [], improvements: [] };
}

export default function MockInterviewContent() {
  const [interviewState, setInterviewState] = useState<InterviewState>('setup');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('mid');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const [questionCount, setQuestionCount] = useState(0);
  const [finalReport, setFinalReport] = useState<ReturnType<typeof parseFinalReport> | null>(null);
  const [textInput, setTextInput] = useState('');
  const [useTextMode, setUseTextMode] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [pendingMode, setPendingMode] = useState<'start' | 'eval' | 'final' | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState('');

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioLevelRef = useRef(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const animFrameRef = useRef<number>(0);

  const { response, isLoading, error, sendMessage } = useChat('OPEN_AI', 'gpt-4o', false);

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Handle AI responses
  useEffect(() => {
    if (!isLoading && response && pendingMode) {
      if (pendingMode === 'start') {
        const firstQ = response.trim();
        setCurrentQuestion(firstQ);
        setTranscript([{ id: 'q-0', role: 'ai', content: firstQ, timestamp: now() }]);
        setInterviewHistory([{ role: 'assistant', content: firstQ }]);
        setQuestionCount(1);
        setInterviewState('active');
        if (speakEnabled) speakText(firstQ);
      } else if (pendingMode === 'eval') {
        const eval_ = parseEvaluation(response);
        setTranscript((prev) => [
          ...prev,
          { id: `feedback-${Date.now()}`, role: 'ai', content: eval_.feedback, timestamp: now(), score: eval_.score },
        ]);
        setInterviewHistory((prev) => [...prev, { role: 'assistant', content: response }]);

        if (questionCount >= 5) {
          // End interview
          setPendingMode('final');
          const allQA = transcript.filter((t) => t.role === 'user').map((t) => t.content).join('\n');
          const finalPrompt = buildFinalReportPrompt(allQA);
          sendMessage(finalPrompt, { max_completion_tokens: 1500 });
        } else {
          const nextQ = eval_.nextQuestion || 'Can you walk me through a challenging technical problem you solved recently?';
          setTimeout(() => {
            setCurrentQuestion(nextQ);
            setTranscript((prev) => [...prev, { id: `q-${questionCount}`, role: 'ai', content: nextQ, timestamp: now() }]);
            setInterviewHistory((prev) => [...prev, { role: 'assistant', content: nextQ }]);
            setQuestionCount((c) => c + 1);
            if (speakEnabled) speakText(nextQ);
          }, 800);
        }
      } else if (pendingMode === 'final') {
        const report = parseFinalReport(response);
        setFinalReport(report);
        setInterviewState('results');
      }
      setPendingMode(null);
    }
  }, [isLoading, response, pendingMode]);

  const now = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    synthRef.current = utt;
    window.speechSynthesis.speak(utt);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const buildSystemPrompt = (role: string, level: string) => {
    const roleLabel = JOB_ROLES.find((r) => r.id === role)?.label || role;
    const levelLabel = DIFFICULTY_LEVELS.find((l) => l.id === level)?.label || level;
    return `You are an expert technical interviewer conducting a mock interview for a ${levelLabel} ${roleLabel} position.
Your role: Ask one focused technical question at a time. Be professional, encouraging, and constructive.
Start with a warm greeting and your first question. Keep questions relevant to the role and experience level.`;
  };

  const buildEvalPrompt = (question: string, answer: string) => [
    {
      role: 'system',
      content: `You are evaluating a candidate's interview answer. Respond ONLY with JSON in this exact format:
\`\`\`json
{
  "score": <1-10>,
  "feedback": "<2-3 sentence constructive feedback>",
  "nextQuestion": "<next interview question to ask>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}
\`\`\``,
    },
    ...interviewHistory,
    { role: 'user', content: `Question asked: "${question}"\n\nCandidate's answer: "${answer}"\n\nEvaluate and provide the next question.` },
  ];

  const buildFinalReportPrompt = (allAnswers: string) => [
    {
      role: 'system',
      content: `Generate a comprehensive interview scorecard. Respond ONLY with JSON:
\`\`\`json
{
  "overallScore": <1-10>,
  "summary": "<3-4 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<area 1>", "<area 2>", "<area 3>"],
  "evaluations": [{"question": "...", "answer": "...", "score": <1-10>, "feedback": "..."}]
}
\`\`\``,
    },
    ...interviewHistory,
    { role: 'user', content: 'Generate the final interview scorecard based on all questions and answers.' },
  ];

  const handleStartInterview = () => {
    if (!selectedRole) { toast.error('Please select a job role'); return; }
    setPendingMode('start');
    const systemPrompt = buildSystemPrompt(selectedRole, selectedLevel);
    sendMessage([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Start the interview. Greet me and ask your first question.' },
    ], { max_completion_tokens: 300 });
  };

  const handleSubmitAnswer = useCallback((answer: string) => {
    if (!answer.trim()) return;
    const userEntry: TranscriptEntry = {
      id: `ans-${Date.now()}`,
      role: 'user',
      content: answer,
      timestamp: now(),
    };
    setTranscript((prev) => [...prev, userEntry]);
    setInterviewHistory((prev) => [...prev, { role: 'user', content: answer }]);
    setLiveTranscript('');
    setTextInput('');
    setPendingAnswer(answer);
    setPendingMode('eval');
    sendMessage(buildEvalPrompt(currentQuestion, answer), { max_completion_tokens: 500 });
  }, [currentQuestion, interviewHistory, sendMessage]);

  const startRecording = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported. Use text input instead.');
      setUseTextMode(true);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setLiveTranscript((prev) => prev + final + interim);
    };
    recognition.onerror = () => {
      setRecordingState('idle');
      toast.error('Microphone error. Try text input.');
    };
    recognition.onend = () => setRecordingState('idle');
    recognitionRef.current = recognition;
    recognition.start();
    setRecordingState('recording');
    stopSpeaking();

    // Fake audio level animation
    let level = 0;
    const animate = () => {
      level = Math.random() * 80 + 10;
      setAudioLevel(level);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
    setAudioLevel(0);
    setRecordingState('idle');
    if (liveTranscript.trim()) {
      handleSubmitAnswer(liveTranscript.trim());
    }
  }, [liveTranscript, handleSubmitAnswer]);

  const handleEndInterview = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    stopSpeaking();
    setPendingMode('final');
    sendMessage(buildFinalReportPrompt(''), { max_completion_tokens: 1500 });
  };

  if (interviewState === 'setup') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-2">
            <Mic size={13} /> AI Mock Interview
          </div>
          <h1 className="font-display font-bold text-3xl text-foreground">Start Your Mock Interview</h1>
          <p className="text-muted-foreground">Practice with an AI interviewer. Speak your answers or type them.</p>
        </div>

        <div className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-foreground">Select Job Role</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {JOB_ROLES.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                  selectedRole === role.id
                    ? 'border-primary/50 bg-primary/10 ring-2 ring-primary/30 scale-[1.02]'
                    : 'border-border bg-card/30 hover:border-primary/30 hover:bg-primary/5'
                }`}
              >
                <div className="text-2xl mb-2">{role.icon}</div>
                <p className="text-sm font-semibold text-foreground">{role.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{role.topics}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-foreground">Experience Level</h2>
          <div className="flex gap-3">
            {DIFFICULTY_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${level.color} ${
                  selectedLevel === level.id ? 'ring-2 ring-offset-1 ring-offset-background ring-current scale-[1.02]' : 'hover:scale-[1.01]'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl border border-border p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">How it works:</span> The AI will ask you 5 technical questions. You can answer by speaking (microphone) or typing. After each answer, you'll get instant feedback and a follow-up question.
          </div>
        </div>

        <button
          onClick={handleStartInterview}
          disabled={!selectedRole || isLoading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glow-sm"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
          {isLoading ? 'Starting Interview…' : 'Start Interview'}
          {!isLoading && <ArrowRight size={18} />}
        </button>
      </div>
    );
  }

  if (interviewState === 'active') {
    return (
      <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border glass-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AI Interviewer</p>
              <p className="text-xs text-muted-foreground">{JOB_ROLES.find((r) => r.id === selectedRole)?.label} · Question {questionCount}/5</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSpeakEnabled((p) => !p); if (isSpeaking) stopSpeaking(); }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label={speakEnabled ? 'Mute AI voice' : 'Enable AI voice'}
            >
              {speakEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={handleEndInterview}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              End Interview
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-muted flex-shrink-0">
          <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${(questionCount / 5) * 100}%` }} />
        </div>

        {/* Current AI question display */}
        {currentQuestion && (
          <div className="px-6 py-4 border-b border-border bg-primary/5 flex-shrink-0">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 ${isSpeaking ? 'animate-pulse' : ''}`}>
                <Bot size={14} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-primary mb-1">Current Question</p>
                <p className="text-sm text-foreground leading-relaxed">{currentQuestion}</p>
              </div>
              {isSpeaking && (
                <button onClick={stopSpeaking} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                  <Square size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {transcript.map((entry) => (
            <div key={entry.id} className={`flex gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                entry.role === 'ai' ? 'bg-gradient-to-br from-primary to-accent' : 'bg-muted'
              }`}>
                {entry.role === 'ai' ? <Bot size={13} className="text-white" /> : <User size={13} className="text-muted-foreground" />}
              </div>
              <div className={`max-w-[75%] space-y-1 ${entry.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  entry.role === 'ai' ?'bg-card/50 border border-border text-foreground rounded-tl-sm' :'bg-primary/15 border border-primary/25 text-foreground rounded-tr-sm'
                }`}>
                  {entry.content}
                  {entry.score !== undefined && (
                    <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1.5">
                      <Star size={11} className="text-amber-400" />
                      <span className="text-xs text-amber-400 font-medium">Score: {entry.score}/10</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground px-1">{entry.timestamp}</span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot size={13} className="text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-card/50 border border-border rounded-tl-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-border space-y-3">
          {/* Live transcript preview */}
          {recordingState === 'recording' && (
            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-400 font-medium">Recording…</span>
                {/* Audio level bars */}
                <div className="flex items-end gap-0.5 h-4 ml-auto">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-red-400 rounded-full transition-all duration-100"
                      style={{ height: `${Math.random() * audioLevel * 0.6 + 10}%` }}
                    />
                  ))}
                </div>
              </div>
              {liveTranscript && (
                <p className="text-sm text-foreground leading-relaxed">{liveTranscript}</p>
              )}
            </div>
          )}

          {useTextMode ? (
            <div className="flex gap-2">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your answer here…"
                rows={2}
                disabled={isLoading}
                className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 resize-none disabled:opacity-60"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitAnswer(textInput); }
                }}
              />
              <button
                onClick={() => handleSubmitAnswer(textInput)}
                disabled={!textInput.trim() || isLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium text-sm hover:opacity-90 disabled:opacity-40 transition-all"
              >
                Send
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setUseTextMode(true)}
                className="px-3 py-2.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                <MessageSquare size={14} />
              </button>
              <div className="flex-1 flex items-center justify-center">
                {recordingState === 'idle' ? (
                  <button
                    onClick={startRecording}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 disabled:opacity-40 transition-all shadow-glow-sm"
                  >
                    <Mic size={18} />
                    Hold to Speak
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all animate-pulse"
                  >
                    <Square size={18} />
                    Stop Recording
                  </button>
                )}
              </div>
              <div className="w-10" />
            </div>
          )}
          <p className="text-[11px] text-muted-foreground/60 text-center">
            {useTextMode ? 'Press Enter to submit · Shift+Enter for new line' : 'Click mic to start recording your answer'}
          </p>
        </div>
      </div>
    );
  }

  if (interviewState === 'results' && finalReport) {
    const scoreColor = finalReport.overallScore >= 8 ? 'text-emerald-400' : finalReport.overallScore >= 6 ? 'text-amber-400' : 'text-red-400';
    const scoreBg = finalReport.overallScore >= 8 ? 'from-emerald-500/20 to-green-500/20 border-emerald-500/30' : finalReport.overallScore >= 6 ? 'from-amber-500/20 to-yellow-500/20 border-amber-500/30' : 'from-red-500/20 to-rose-500/20 border-red-500/30';

    return (
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Score card */}
        <div className={`glass-card rounded-2xl border p-8 text-center bg-gradient-to-br ${scoreBg} animate-fade-in`}>
          <Trophy size={40} className={`mx-auto mb-3 ${scoreColor}`} />
          <h2 className="font-display font-bold text-2xl text-foreground mb-1">Interview Complete!</h2>
          <p className="text-muted-foreground mb-6">{JOB_ROLES.find((r) => r.id === selectedRole)?.label} · {DIFFICULTY_LEVELS.find((l) => l.id === selectedLevel)?.label}</p>

          {/* Score gauge */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
              <circle
                cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                stroke="url(#interviewGrad)"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - finalReport.overallScore / 10)}`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="interviewGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-display font-bold text-3xl ${scoreColor}`}>{finalReport.overallScore}</span>
              <span className="text-xs text-muted-foreground">/10</span>
            </div>
          </div>

          {finalReport.summary && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">{finalReport.summary}</p>
          )}
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card rounded-xl border border-emerald-500/20 p-4 space-y-2">
            <h3 className="font-semibold text-sm text-emerald-400 flex items-center gap-2"><CheckCircle size={14} /> Strengths</h3>
            {finalReport.strengths.map((s, i) => (
              <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span> {s}
              </p>
            ))}
          </div>
          <div className="glass-card rounded-xl border border-amber-500/20 p-4 space-y-2">
            <h3 className="font-semibold text-sm text-amber-400 flex items-center gap-2"><Target size={14} /> Areas to Improve</h3>
            {finalReport.improvements.map((s, i) => (
              <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span> {s}
              </p>
            ))}
          </div>
        </div>

        {/* Q&A breakdown */}
        {finalReport.evaluations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-display font-semibold text-lg text-foreground">Question Breakdown</h3>
            {finalReport.evaluations.map((ev, i) => (
              <div key={i} className="glass-card rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{ev.question}</p>
                  <span className={`text-xs font-bold flex-shrink-0 px-2 py-0.5 rounded-full ${ev.score >= 7 ? 'bg-emerald-500/10 text-emerald-400' : ev.score >= 5 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                    {ev.score}/10
                  </span>
                </div>
                {ev.answer && <p className="text-xs text-muted-foreground italic">"{ev.answer.slice(0, 120)}{ev.answer.length > 120 ? '…' : ''}"</p>}
                {ev.feedback && <p className="text-xs text-muted-foreground border-t border-border pt-2">{ev.feedback}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Transcript */}
        <div className="space-y-2">
          <h3 className="font-display font-semibold text-lg text-foreground">Full Transcript</h3>
          <div className="glass-card rounded-xl border border-border divide-y divide-border max-h-64 overflow-y-auto">
            {transcript.map((entry) => (
              <div key={entry.id} className="px-4 py-3 flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${entry.role === 'ai' ? 'bg-primary/20' : 'bg-muted'}`}>
                  {entry.role === 'ai' ? <Bot size={11} className="text-primary" /> : <User size={11} className="text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{entry.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setInterviewState('setup'); setTranscript([]); setQuestionCount(0); setFinalReport(null); setInterviewHistory([]); }}
            className="flex-1 py-3.5 rounded-xl border border-border text-foreground font-semibold flex items-center justify-center gap-2 hover:bg-muted/30 transition-all"
          >
            <RotateCcw size={16} /> New Interview
          </button>
          <button
            onClick={handleStartInterview}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
          >
            <Zap size={16} /> Retry Same Role
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );
}
