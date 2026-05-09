'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Brain, ChevronRight, Clock, CheckCircle, XCircle, Trophy, RotateCcw, Sparkles, Target, Zap, ArrowRight, AlertCircle } from 'lucide-react';
import { useChat } from '@/lib/hooks/useChat';
import toast from 'react-hot-toast';

type Difficulty = 'easy' | 'medium' | 'hard';
type QuizState = 'setup' | 'loading' | 'active' | 'results';

interface MCQOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: MCQOption[];
  correctId: string;
  explanation: string;
  topic: string;
}

interface UserAnswer {
  questionId: string;
  selectedId: string | null;
  isCorrect: boolean;
  timeSpent: number;
}

const TOPICS = [
  { id: 'system-design', label: 'System Design', icon: '🏗️', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30' },
  { id: 'algorithms', label: 'Algorithms & DSA', icon: '⚡', color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30' },
  { id: 'databases', label: 'Databases', icon: '🗄️', color: 'from-green-500/20 to-emerald-500/20 border-green-500/30' },
  { id: 'operating-systems', label: 'Operating Systems', icon: '💻', color: 'from-purple-500/20 to-violet-500/20 border-purple-500/30' },
  { id: 'networking', label: 'Networking', icon: '🌐', color: 'from-cyan-500/20 to-teal-500/20 border-cyan-500/30' },
  { id: 'react-frontend', label: 'React & Frontend', icon: '⚛️', color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30' },
  { id: 'machine-learning', label: 'Machine Learning', icon: '🤖', color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30' },
  { id: 'cloud-devops', label: 'Cloud & DevOps', icon: '☁️', color: 'from-sky-500/20 to-blue-500/20 border-sky-500/30' },
];

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; time: number; desc: string }> = {
  easy: { label: 'Easy', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', time: 45, desc: 'Foundational concepts' },
  medium: { label: 'Medium', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', time: 60, desc: 'Applied knowledge' },
  hard: { label: 'Hard', color: 'text-red-400 border-red-500/30 bg-red-500/10', time: 90, desc: 'Expert-level challenges' },
};

function parseQuizFromResponse(text: string): QuizQuestion[] {
  try {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\[[\s\S]*\])/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed)) {
        return parsed.map((q: any, i: number) => ({
          id: `q-${i}`,
          question: q.question || q.q,
          options: (q.options || q.choices || []).map((opt: any, j: number) => ({
            id: String.fromCharCode(65 + j),
            text: typeof opt === 'string' ? opt : opt.text || opt.label,
          })),
          correctId: q.correct || q.answer || q.correctAnswer || 'A',
          explanation: q.explanation || q.rationale || '',
          topic: q.topic || '',
        }));
      }
    }
  } catch {
    // fallback parse
  }
  return [];
}

export default function QuizEngineContent() {
  const [quizState, setQuizState] = useState<QuizState>('setup');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [generatedText, setGeneratedText] = useState('');

  const { response, isLoading, error, sendMessage } = useChat('OPEN_AI', 'gpt-4o', false);

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  useEffect(() => {
    if (response && quizState === 'loading') {
      setGeneratedText(response);
    }
  }, [response, quizState]);

  useEffect(() => {
    if (!isLoading && generatedText && quizState === 'loading') {
      const parsed = parseQuizFromResponse(generatedText);
      if (parsed.length > 0) {
        setQuestions(parsed);
        setCurrentIdx(0);
        setUserAnswers([]);
        setQuizState('active');
        setTimeLeft(DIFFICULTY_CONFIG[difficulty].time);
        setQuestionStartTime(Date.now());
      } else {
        toast.error('Failed to parse quiz. Please try again.');
        setQuizState('setup');
      }
      setGeneratedText('');
    }
  }, [isLoading, generatedText, quizState, difficulty]);

  // Timer
  useEffect(() => {
    if (quizState !== 'active') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [quizState, currentIdx]);

  const handleTimeUp = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!answered) {
      const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
      setUserAnswers((prev) => [...prev, {
        questionId: questions[currentIdx]?.id,
        selectedId: null,
        isCorrect: false,
        timeSpent,
      }]);
      setAnswered(true);
    }
  }, [answered, questions, currentIdx, questionStartTime]);

  const handleGenerateQuiz = () => {
    if (!selectedTopic) {
      toast.error('Please select a topic first');
      return;
    }
    setQuizState('loading');
    const topicLabel = TOPICS.find((t) => t.id === selectedTopic)?.label || selectedTopic;
    const prompt = `Generate exactly ${numQuestions} multiple choice questions about "${topicLabel}" at ${difficulty} difficulty level for a technical interview preparation quiz.

Return ONLY a JSON array with this exact structure:
\`\`\`json
[
  {
    "question": "Question text here?",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correct": "A",
    "explanation": "Brief explanation of why this is correct and others are wrong.",
    "topic": "${topicLabel}"
  }
]
\`\`\`

Requirements:
- Exactly ${numQuestions} questions
- Each question has exactly 4 options (A, B, C, D)
- "correct" field must be exactly "A", "B", "C", or "D"
- Questions should test ${difficulty === 'easy' ? 'basic understanding' : difficulty === 'medium' ? 'applied knowledge and problem-solving' : 'deep expertise and edge cases'}
- Explanations should be educational and concise (2-3 sentences)
- No markdown in question/option text, just plain text`;

    sendMessage([
      { role: 'system', content: 'You are a technical quiz generator. Always respond with valid JSON only, no extra text outside the code block.' },
      { role: 'user', content: prompt },
    ], { max_completion_tokens: 2000 });
  };

  const handleSelectOption = (optId: string) => {
    if (answered) return;
    setSelectedOption(optId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || answered) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    const isCorrect = selectedOption === questions[currentIdx].correctId;
    setUserAnswers((prev) => [...prev, {
      questionId: questions[currentIdx].id,
      selectedId: selectedOption,
      isCorrect,
      timeSpent,
    }]);
    setAnswered(true);
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      setQuizState('results');
      return;
    }
    setCurrentIdx((i) => i + 1);
    setSelectedOption(null);
    setAnswered(false);
    setTimeLeft(DIFFICULTY_CONFIG[difficulty].time);
    setQuestionStartTime(Date.now());
  };

  const handleRestart = () => {
    setQuizState('setup');
    setQuestions([]);
    setCurrentIdx(0);
    setUserAnswers([]);
    setSelectedOption(null);
    setAnswered(false);
  };

  const score = userAnswers.filter((a) => a.isCorrect).length;
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const timerPercent = (timeLeft / DIFFICULTY_CONFIG[difficulty].time) * 100;

  if (quizState === 'setup') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-2">
            <Brain size={13} /> AI-Powered Quiz Engine
          </div>
          <h1 className="font-display font-bold text-3xl text-foreground">Generate Your Quiz</h1>
          <p className="text-muted-foreground">Select a topic and difficulty to get AI-generated MCQs tailored to your level</p>
        </div>

        {/* Topic Selection */}
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-foreground">Choose Topic</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic.id)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 bg-gradient-to-br ${topic.color} ${
                  selectedTopic === topic.id
                    ? 'ring-2 ring-primary scale-[1.02] shadow-glow-sm'
                    : 'hover:scale-[1.01] hover:shadow-md'
                }`}
              >
                <div className="text-2xl mb-2">{topic.icon}</div>
                <p className="text-sm font-medium text-foreground leading-tight">{topic.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-foreground">Difficulty Level</h2>
          <div className="flex gap-3">
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => {
              const cfg = DIFFICULTY_CONFIG[d];
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 p-4 rounded-xl border transition-all duration-200 text-left ${cfg.color} ${
                    difficulty === d ? 'ring-2 ring-offset-1 ring-offset-background ring-current scale-[1.02]' : 'hover:scale-[1.01]'
                  }`}
                >
                  <p className="font-semibold text-sm">{cfg.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{cfg.desc}</p>
                  <p className="text-xs opacity-60 mt-1 flex items-center gap-1"><Clock size={10} /> {cfg.time}s per question</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Number of questions */}
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-lg text-foreground">Number of Questions</h2>
          <div className="flex gap-3">
            {[5, 10, 15].map((n) => (
              <button
                key={n}
                onClick={() => setNumQuestions(n)}
                className={`px-6 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  numQuestions === n
                    ? 'bg-primary/15 border-primary/40 text-primary ring-1 ring-primary/30' :'border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-muted/30'
                }`}
              >
                {n} Questions
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerateQuiz}
          disabled={!selectedTopic}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-sm"
        >
          <Sparkles size={18} />
          Generate Quiz with AI
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  if (quizState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] space-y-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain size={28} className="text-primary" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-display font-bold text-xl text-foreground">Generating Your Quiz</h3>
          <p className="text-muted-foreground text-sm">AI is crafting {numQuestions} questions on {TOPICS.find((t) => t.id === selectedTopic)?.label}…</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (quizState === 'active' && questions[currentIdx]) {
    const q = questions[currentIdx];
    const diffCfg = DIFFICULTY_CONFIG[difficulty];
    const timerColor = timerPercent > 50 ? 'bg-emerald-500' : timerPercent > 25 ? 'bg-amber-500' : 'bg-red-500';

    return (
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Progress header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Question {currentIdx + 1} of {questions.length}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${diffCfg.color}`}>{diffCfg.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className={timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-muted-foreground'} />
            <span className={`font-mono font-bold text-sm ${timeLeft <= 10 ? 'text-red-400' : 'text-foreground'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
              style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
            />
          </div>
          {/* Timer bar */}
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="glass-card rounded-2xl border border-border p-6 space-y-6">
          <div className="space-y-2">
            {q.topic && (
              <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">{q.topic}</span>
            )}
            <h2 className="font-display font-semibold text-lg text-foreground leading-relaxed">{q.question}</h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {q.options.map((opt) => {
              let optClass = 'border-border bg-card/30 hover:border-primary/40 hover:bg-primary/5 text-foreground';
              if (answered) {
                if (opt.id === q.correctId) {
                  optClass = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300';
                } else if (opt.id === selectedOption && opt.id !== q.correctId) {
                  optClass = 'border-red-500/50 bg-red-500/10 text-red-300';
                } else {
                  optClass = 'border-border bg-card/20 text-muted-foreground opacity-60';
                }
              } else if (selectedOption === opt.id) {
                optClass = 'border-primary/60 bg-primary/10 text-primary';
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  disabled={answered}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${optClass} disabled:cursor-default`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    answered && opt.id === q.correctId ? 'bg-emerald-500/20' :
                    answered && opt.id === selectedOption ? 'bg-red-500/20' :
                    selectedOption === opt.id ? 'bg-primary/20' : 'bg-muted/50'
                  }`}>
                    {opt.id}
                  </span>
                  <span className="text-sm leading-relaxed">{opt.text}</span>
                  {answered && opt.id === q.correctId && <CheckCircle size={16} className="ml-auto text-emerald-400 flex-shrink-0" />}
                  {answered && opt.id === selectedOption && opt.id !== q.correctId && <XCircle size={16} className="ml-auto text-red-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {answered && q.explanation && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
              <div className="flex items-start gap-2">
                <Sparkles size={14} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">AI Explanation</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {!answered ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedOption}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Target size={16} />
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
            >
              {currentIdx + 1 >= questions.length ? (
                <><Trophy size={16} /> View Results</>
              ) : (
                <>Next Question <ChevronRight size={16} /></>
              )}
            </button>
          )}
        </div>

        {/* Score tracker */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle size={14} /> {userAnswers.filter((a) => a.isCorrect).length} correct
          </span>
          <span className="flex items-center gap-1.5 text-red-400">
            <XCircle size={14} /> {userAnswers.filter((a) => !a.isCorrect).length} incorrect
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <AlertCircle size={14} /> {questions.length - userAnswers.length - (answered ? 0 : 0)} remaining
          </span>
        </div>
      </div>
    );
  }

  if (quizState === 'results') {
    const topicLabel = TOPICS.find((t) => t.id === selectedTopic)?.label || selectedTopic;
    const avgTime = userAnswers.length > 0 ? Math.round(userAnswers.reduce((s, a) => s + a.timeSpent, 0) / userAnswers.length) : 0;
    const resultTier = percentage >= 80 ? { label: 'Excellent!', color: 'text-emerald-400', icon: '🏆', bg: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30' }
      : percentage >= 60 ? { label: 'Good Job!', color: 'text-amber-400', icon: '⭐', bg: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30' }
      : { label: 'Keep Practicing', color: 'text-red-400', icon: '💪', bg: 'from-red-500/20 to-rose-500/20 border-red-500/30' };

    return (
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Results hero */}
        <div className={`glass-card rounded-2xl border p-8 text-center bg-gradient-to-br ${resultTier.bg} animate-fade-in`}>
          <div className="text-5xl mb-3">{resultTier.icon}</div>
          <h2 className={`font-display font-bold text-3xl mb-1 ${resultTier.color}`}>{resultTier.label}</h2>
          <p className="text-muted-foreground mb-6">{topicLabel} · {DIFFICULTY_CONFIG[difficulty].label}</p>

          {/* Score ring */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
              <circle
                cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                stroke="url(#scoreGrad)"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - percentage / 100)}`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display font-bold text-3xl text-foreground">{percentage}%</span>
              <span className="text-xs text-muted-foreground">{score}/{questions.length}</span>
            </div>
          </div>

          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <p className="font-bold text-foreground text-lg">{score}</p>
              <p className="text-muted-foreground text-xs">Correct</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground text-lg">{questions.length - score}</p>
              <p className="text-muted-foreground text-xs">Incorrect</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground text-lg">{avgTime}s</p>
              <p className="text-muted-foreground text-xs">Avg Time</p>
            </div>
          </div>
        </div>

        {/* Question breakdown */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-lg text-foreground">Question Breakdown</h3>
          {questions.map((q, i) => {
            const ans = userAnswers[i];
            const userOpt = q.options.find((o) => o.id === ans?.selectedId);
            const correctOpt = q.options.find((o) => o.id === q.correctId);
            return (
              <div key={q.id} className={`glass-card rounded-xl border p-4 space-y-3 ${ans?.isCorrect ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${ans?.isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                    {ans?.isCorrect ? <CheckCircle size={13} className="text-emerald-400" /> : <XCircle size={13} className="text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-relaxed">{q.question}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      {!ans?.isCorrect && userOpt && (
                        <p className="text-red-400">Your answer: {userOpt.text}</p>
                      )}
                      {!ans?.selectedId && (
                        <p className="text-amber-400">Time expired — no answer</p>
                      )}
                      <p className="text-emerald-400">Correct: {correctOpt?.text}</p>
                    </div>
                    {q.explanation && (
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed border-t border-border pt-2">{q.explanation}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                    <Clock size={10} /> {ans?.timeSpent ?? 0}s
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleRestart}
            className="flex-1 py-3.5 rounded-xl border border-border text-foreground font-semibold flex items-center justify-center gap-2 hover:bg-muted/30 transition-all"
          >
            <RotateCcw size={16} />
            New Quiz
          </button>
          <button
            onClick={() => { setQuizState('loading'); handleGenerateQuiz(); }}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
          >
            <Zap size={16} />
            Retry Same Topic
          </button>
        </div>
      </div>
    );
  }

  return null;
}
