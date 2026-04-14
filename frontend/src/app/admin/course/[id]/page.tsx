/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, use } from "react";
import { 
  Plus, Trash2, Layout, Video, HelpCircle, 
  Save, ArrowLeft, Loader2, PlayCircle, Settings,
  CheckCircle2, XCircle, ChevronDown, ChevronUp
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function AdminCourseManagement({ params }: { params: Promise<{ id: string }> }) {
  const { data: session }: any = useSession();
  const { id } = use(params);
  
  const [activeTab, setActiveTab] = useState("curriculum");
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form States
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleOrder, setModuleOrder] = useState("");

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [videoForm, setVideoForm] = useState({ title: "", description: "", videoUrl: "", duration: "", order: "" });

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionForm, setQuestionForm] = useState({ 
    question: "", 
    options: ["", "", "", ""], 
    correctOption: 0 
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.user?.backendToken}`
  };

  useEffect(() => {
    if (session?.user?.backendToken) fetchCourse();
  }, [id, session?.user?.backendToken]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/services/courses/full/${id}`, { headers });
      const data = await res.json();
      if (res.ok) setCourse(data.course);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/services/courses/modules`, {
        method: "POST",
        headers,
        body: JSON.stringify({ courseId: id, title: moduleTitle, order: moduleOrder })
      });
      if (res.ok) {
        setShowModuleModal(false);
        setModuleTitle("");
        fetchCourse();
      }
    } catch (err) {
      alert("Failed to create module");
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/services/courses/videos`, {
        method: "POST",
        headers,
        body: JSON.stringify({ moduleId: selectedModuleId, ...videoForm })
      });
      if (res.ok) {
        setShowVideoModal(false);
        setVideoForm({ title: "", description: "", videoUrl: "", duration: "", order: "" });
        fetchCourse();
      }
    } catch (err) {
      alert("Failed to add video");
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/services/courses/${id}/quiz/questions`, {
        method: "POST",
        headers,
        body: JSON.stringify(questionForm)
      });
      if (res.ok) {
        setShowQuestionModal(false);
        setQuestionForm({ question: "", options: ["", "", "", ""], correctOption: 0 });
        fetchCourse();
      }
    } catch (err) {
      alert("Failed to add question");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-[var(--color-gold)] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 pt-12 pb-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard/admin" className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-[var(--color-gold)] hover:text-black transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">{course?.title}</h1>
              <p className="text-zinc-500 font-medium text-sm">LMS Management • Content Architecture</p>
            </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setShowModuleModal(true)} className="px-6 py-3 bg-[var(--color-gold)] text-zinc-950 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-yellow-500/10">
               New Module
             </button>
             <button onClick={() => { 
               if (!course?.modules?.length) return alert("Create a module first");
               setSelectedModuleId(course.modules[0].id);
               setShowVideoModal(true) 
             }} className="px-6 py-3 bg-zinc-900 dark:bg-zinc-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center gap-2">
               <Video size={16} /> Add Video
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 pt-12">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-zinc-200 dark:bg-zinc-900 p-1.5 rounded-[2.5rem] w-fit mb-12 shadow-inner">
           {[
             { id: 'curriculum', label: 'Curriculum', icon: Layout },
             { id: 'quiz', label: 'Quiz Bank', icon: HelpCircle },
             { id: 'settings', label: 'Settings', icon: Settings }
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex items-center gap-2 px-8 py-3.5 rounded-[2.2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab.id ? 'bg-white dark:bg-zinc-800 text-[var(--color-gold)] shadow-xl' : 'text-zinc-500 hover:text-zinc-700'}`}
             >
               <tab.icon size={16} /> {tab.label}
             </button>
           ))}
        </div>

        {/* Curriculum Content */}
        {activeTab === 'curriculum' && (
           <div className="space-y-10">
              {course?.modules?.length === 0 ? (
                <div className="py-24 text-center bg-white dark:bg-zinc-900/50 rounded-[4rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                   <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">No modules architected yet</p>
                </div>
              ) : course.modules.map((mod: any) => (
                <div key={mod.id} className="bg-white dark:bg-zinc-900 p-10 rounded-[4rem] border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-2 h-full bg-[var(--color-gold)]"></div>
                   
                   <div className="flex justify-between items-center mb-10 pl-4">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center font-black text-[var(--color-gold)]">
                            {mod.order}
                         </div>
                         <h3 className="text-2xl font-bold tracking-tight">{mod.title}</h3>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => { setSelectedModuleId(mod.id); setShowVideoModal(true); }} className="p-3 text-zinc-400 hover:text-[var(--color-gold)] transition-colors"><Plus size={20}/></button>
                         <button className="p-3 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {mod.videos?.map((vid: any) => (
                        <div key={vid.id} className="group bg-zinc-50 dark:bg-black p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 hover:border-[var(--color-gold)] transition-all">
                           <div className="aspect-video bg-zinc-200 dark:bg-zinc-800 rounded-2xl mb-4 relative overflow-hidden">
                              <iframe src={vid.videoUrl} className="w-full h-full" allowFullScreen></iframe>
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><PlayCircle size={40} className="text-white"/></div>
                           </div>
                           <h4 className="font-bold mb-1 line-clamp-1">{vid.title}</h4>
                           <div className="flex justify-between items-center text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                              <span>Order: {vid.order}</span>
                              <button className="text-red-400 hover:text-red-600 transition-colors">Remove</button>
                           </div>
                        </div>
                      ))}
                      <button onClick={() => { setSelectedModuleId(mod.id); setShowVideoModal(true); }} className="aspect-video border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-[var(--color-gold)] hover:bg-zinc-50 transition-all group">
                         <Video size={40} className="group-hover:scale-110 transition-transform" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Add Video Lesson</span>
                      </button>
                   </div>
                </div>
              ))}
           </div>
        )}

        {/* Quiz Content */}
        {activeTab === 'quiz' && (
           <div className="flex flex-col gap-10">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-bold">Comprehensive Quiz Bank</h3>
                 <button onClick={() => setShowQuestionModal(true)} className="px-8 py-3 bg-[var(--color-gold)] text-zinc-950 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                   Add Question
                 </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                 {course?.quiz?.questions?.length === 0 ? (
                   <div className="py-24 text-center bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-zinc-800">
                      <p className="text-zinc-500 font-black uppercase text-sm tracking-widest">Build your 20-question database</p>
                   </div>
                 ) : course.quiz.questions.map((q: any, i: number) => (
                    <div key={q.id} className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-zinc-100 dark:border-zinc-800">
                       <div className="flex justify-between items-start mb-8">
                          <span className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-[var(--color-gold)] text-[10px] font-black uppercase tracking-widest rounded-full">Question {i+1}</span>
                          <button className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                       </div>
                       <h4 className="text-xl font-bold mb-8">{q.question}</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {q.options.map((opt: string, idx: number) => (
                             <div key={idx} className={`p-4 rounded-2xl flex items-center justify-between border ${idx === q.correctOption ? 'bg-green-100/10 border-green-500 text-green-500' : 'bg-zinc-50 dark:bg-black border-zinc-200 dark:border-zinc-800'}`}>
                                <span className="text-xs font-bold">{opt}</span>
                                {idx === q.correctOption && <CheckCircle2 size={16}/>}
                             </div>
                          ))}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </main>

      {/* Modals */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
           <form onSubmit={handleCreateModule} className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[3rem] p-10 border border-white/10 shadow-2xl">
              <h3 className="text-2xl font-bold mb-2">Build New Module</h3>
              <p className="text-zinc-500 text-sm mb-8">Modules act as hierarchical folders for your lessons.</p>
              
              <div className="space-y-4 mb-10">
                 <input type="text" placeholder="Module Title" required value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} className="w-full px-6 py-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl" />
                 <input type="number" placeholder="Order Number (1, 2, 3...)" required value={moduleOrder} onChange={e => setModuleOrder(e.target.value)} className="w-full px-6 py-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl" />
              </div>
              
              <div className="flex gap-4">
                 <button type="button" onClick={() => setShowModuleModal(false)} className="flex-1 py-4 text-zinc-500 font-black uppercase text-xs tracking-widest">Cancel</button>
                 <button type="submit" className="flex-2 py-4 bg-[var(--color-gold)] text-zinc-950 font-black rounded-2xl text-xs uppercase tracking-widest">Construct Module</button>
              </div>
           </form>
        </div>
      )}

      {showVideoModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
           <form onSubmit={handleAddVideo} className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[3rem] p-12 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-2xl font-bold mb-2">Import Lesson Video</h3>
              <p className="text-zinc-500 text-sm mb-8">Map high-quality visual content to your learning modules.</p>
              
              <div className="space-y-4 mb-10">
                 <select value={selectedModuleId} onChange={e => setSelectedModuleId(e.target.value)} className="w-full px-6 py-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl dark:text-white">
                    {course?.modules?.map((m: any) => <option key={m.id} value={m.id}>{m.title}</option>)}
                 </select>
                 <input type="text" placeholder="Video Title" required value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} className="w-full px-6 py-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl" />
                 <input type="text" placeholder="YouTube URL (watch?v=... or youtu.be/...)" required value={videoForm.videoUrl} onChange={e => setVideoForm({...videoForm, videoUrl: e.target.value})} className="w-full px-6 py-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl" />
                 <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Duration (sec)" value={videoForm.duration} onChange={e => setVideoForm({...videoForm, duration: e.target.value})} className="w-full px-6 py-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl" />
                    <input type="number" placeholder="Order" value={videoForm.order} onChange={e => setVideoForm({...videoForm, order: e.target.value})} className="w-full px-6 py-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl" />
                 </div>
              </div>
              
              <div className="flex gap-4">
                 <button type="button" onClick={() => setShowVideoModal(false)} className="flex-1 py-4 text-zinc-500 font-black uppercase text-xs tracking-widest">Abort</button>
                 <button type="submit" className="flex-2 py-4 bg-[var(--color-gold)] text-zinc-950 font-black rounded-2xl text-xs uppercase tracking-widest">Infuse Video</button>
              </div>
           </form>
        </div>
      )}

      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-6">
           <form onSubmit={handleAddQuestion} className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[3rem] p-12 border border-white/10 shadow-2xl overflow-y-auto max-h-[95vh]">
              <h3 className="text-3xl font-bold mb-2 tracking-tight">Engineer Quiz Question</h3>
              <p className="text-zinc-500 text-sm mb-10">Construct rigorous assessments to maintain high certification standards.</p>
              
              <div className="space-y-6 mb-12">
                 <textarea placeholder="The core inquiry / question..." required value={questionForm.question} onChange={e => setQuestionForm({...questionForm, question: e.target.value})} className="w-full px-6 py-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-[2rem] resize-none h-32"></textarea>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {questionForm.options.map((opt, i) => (
                       <div key={i} className={`flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden border-2 ${questionForm.correctOption === i ? 'border-[var(--color-gold)]' : 'border-transparent'}`}>
                          <button type="button" onClick={() => setQuestionForm({...questionForm, correctOption: i})} className={`w-12 h-14 flex items-center justify-center font-black ${questionForm.correctOption === i ? 'bg-[var(--color-gold)] text-zinc-950' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}`}>
                             {String.fromCharCode(65 + i)}
                          </button>
                          <input type="text" placeholder={`Option ${String.fromCharCode(65 + i)}`} required value={opt} onChange={e => {
                             const newOpts = [...questionForm.options];
                             newOpts[i] = e.target.value;
                             setQuestionForm({...questionForm, options: newOpts});
                          }} className="flex-1 px-4 py-4 bg-transparent border-none focus:outline-none" />
                       </div>
                    ))}
                 </div>
              </div>
              
              <div className="flex gap-4">
                 <button type="button" onClick={() => setShowQuestionModal(false)} className="flex-1 py-4 text-zinc-500 font-black uppercase text-xs tracking-widest">Discard</button>
                 <button type="submit" className="flex-2 py-4 bg-[var(--color-gold)] text-zinc-950 font-black rounded-2xl text-xs uppercase tracking-widest">Inject Question</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
}
