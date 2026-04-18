/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Loader2, Award, CheckCircle2, XCircle, RotateCcw, ArrowRight,
  AlertCircle, Trophy, Clock, Target
} from "lucide-react";

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { user }: any = useAuth();
  const router = useRouter();
  const { id: courseId } = use(params);

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({}); // { questionId: selectedOptionIdx }
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${user?.backendToken}` };

  useEffect(() => {
    if (user?.backendToken) fetchQuiz();
  }, [courseId, user?.backendToken]);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/services/courses/${courseId}/quiz`, { headers });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to load quiz"); return; }
      setQuestions(data.questions || []);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const selectAnswer = (questionId: string, optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const submitQuiz = async () => {
    const unanswered = questions.filter(q => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      alert(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      // Jump to first unanswered
      setCurrentQ(questions.indexOf(unanswered[0]));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/services/courses/${courseId}/quiz/submit`, {
        method: "POST", headers,
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Submission failed"); return; }
      setResult({ score: data.score, passed: data.passed, message: data.message });
    } finally { setSubmitting(false); }
  };

  const retryQuiz = () => {
    setResult(null);
    setAnswers({});
    setCurrentQ(0);
    fetchQuiz(); // Get fresh random 10 questions
  };

  // ─── LOADING ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center space-y-4">
        <Loader2 className="w-14 h-14 text-[var(--color-gold)] animate-spin mx-auto" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Preparing your exam...</p>
      </div>
    </div>
  );

  // ─── ERROR ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <AlertCircle size={64} className="mx-auto text-red-500"/>
        <h2 className="text-2xl font-bold text-white">Cannot Start Exam</h2>
        <p className="text-zinc-400">{error}</p>
        <div className="flex gap-4 justify-center">
          <Link href={`/services/courses/${courseId}`} className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-all">
            Back to Course
          </Link>
          <button onClick={fetchQuiz} className="px-6 py-3 bg-[var(--color-gold)] text-zinc-900 rounded-xl font-bold text-sm hover:opacity-90 transition-all">
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  // ─── RESULT SCREEN ──────────────────────────────────────────────────────────
  if (result) {
    const pct = Math.round((result.score / 10) * 100);
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          {/* Result Card */}
          <div className={`rounded-[3rem] border p-12 text-center space-y-6 relative overflow-hidden ${
            result.passed
              ? "bg-gradient-to-br from-green-900/30 to-zinc-900 border-green-700/30"
              : "bg-gradient-to-br from-red-900/20 to-zinc-900 border-red-800/30"
          }`}>
            {/* Glow */}
            <div className={`absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-20 ${result.passed ? 'bg-green-500' : 'bg-red-500'}`}/>

            {result.passed ? (
              <Trophy size={72} className="mx-auto text-[var(--color-gold)] relative z-10"/>
            ) : (
              <XCircle size={72} className="mx-auto text-red-400 relative z-10"/>
            )}

            <div className="relative z-10">
              <h1 className="text-4xl font-black text-white mb-2">
                {result.passed ? "Exam Passed!" : "Not Quite Yet"}
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed">{result.message}</p>
            </div>

            {/* Score Ring */}
            <div className="relative z-10 flex justify-center">
              <div className={`w-36 h-36 rounded-full border-8 flex flex-col items-center justify-center ${
                result.passed ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'
              }`}>
                <p className="text-4xl font-black text-white">{result.score}/10</p>
                <p className="text-xs font-bold text-zinc-400">{pct}%</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 relative z-10">
              <div className="bg-white/5 rounded-2xl p-4">
                <Target size={16} className="mx-auto mb-1 text-[var(--color-gold)]"/>
                <p className="text-lg font-black text-white">{result.score}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Correct</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <XCircle size={16} className="mx-auto mb-1 text-red-400"/>
                <p className="text-lg font-black text-white">{10 - result.score}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Wrong</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <CheckCircle2 size={16} className="mx-auto mb-1 text-green-400"/>
                <p className="text-lg font-black text-white">7/10</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Pass Mark</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center relative z-10">
              {result.passed ? (
                <Link href={`/services/courses/${courseId}`}
                  className="flex items-center gap-2 px-8 py-3.5 bg-[var(--color-gold)] text-zinc-900 rounded-2xl font-black text-sm hover:opacity-90 transition-all">
                  <Award size={18}/> View Certificate Status
                </Link>
              ) : (
                <>
                  <button onClick={retryQuiz}
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-sm transition-all">
                    <RotateCcw size={16}/> Retry Exam
                  </button>
                  <Link href={`/services/courses/${courseId}`}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-2xl font-black text-sm transition-all">
                    Review Material
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── QUIZ IN PROGRESS ────────────────────────────────────────────────────────
  const q = questions[currentQ];
  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Certification Exam</p>
            <p className="text-white font-black text-lg">Question {currentQ + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-zinc-500 font-bold">{answeredCount}/{questions.length} answered</p>
              <p className="text-[var(--color-gold)] font-black text-sm">Pass: 7/10</p>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-[var(--color-gold)]/30 flex items-center justify-center">
              <span className="text-white font-black text-sm">{progressPct}%</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-zinc-800 mt-4 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-gold)] rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }}/>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-2xl w-full space-y-8">
          {/* Q Nav Pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {questions.map((qn, i) => (
              <button key={qn.id} onClick={() => setCurrentQ(i)}
                className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                  i === currentQ ? 'bg-[var(--color-gold)] text-zinc-900 scale-110' :
                  answers[qn.id] !== undefined ? 'bg-green-900/50 text-green-400 border border-green-700/40' :
                  'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}>
                {i + 1}
              </button>
            ))}
          </div>

          {/* Question Card */}
          {q && (
            <div className="bg-zinc-900 rounded-[2rem] border border-zinc-800 p-8 space-y-6">
              <p className="text-white text-xl font-bold leading-relaxed">{q.question}</p>
              <div className="space-y-3">
                {q.options?.map((opt: string, idx: number) => {
                  const isSelected = answers[q.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => selectAnswer(q.id, idx)}
                      className={`w-full text-left px-6 py-4 rounded-2xl border-2 font-bold text-sm transition-all duration-200 flex items-center gap-4 ${
                        isSelected
                          ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-white'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500 hover:text-white'
                      }`}>
                      <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-xs ${
                        isSelected ? 'bg-[var(--color-gold)] text-zinc-900' : 'bg-zinc-700 text-zinc-400'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button onClick={() => setCurrentQ(i => Math.max(0, i - 1))} disabled={currentQ === 0}
              className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-black text-sm disabled:opacity-30 hover:bg-zinc-700 transition-all">
              ← Previous
            </button>

            {currentQ < questions.length - 1 ? (
              <button onClick={() => setCurrentQ(i => i + 1)}
                className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-zinc-700 transition-all">
                Next <ArrowRight size={16}/>
              </button>
            ) : (
              <button onClick={submitQuiz} disabled={submitting}
                className="px-8 py-3 bg-[var(--color-gold)] text-zinc-900 rounded-xl font-black text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-yellow-500/20">
                {submitting ? <Loader2 size={16} className="animate-spin"/> : <><CheckCircle2 size={16}/> Submit Exam</>}
              </button>
            )}
          </div>

          <p className="text-center text-xs text-zinc-600 font-medium">
            🔒 Answers are verified server-side. Answer all {questions.length} questions before submitting.
          </p>
        </div>
      </div>
    </div>
  );
}
