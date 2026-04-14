/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, IndianRupee, Layers, Eye, EyeOff, Edit3, 
  X, Loader2, GripVertical, PlayCircle, Video, Trash2, 
  Plus, Upload, Check, HelpCircle 
} from "lucide-react";

interface AdminLMSTabProps {
  apiUrl: string;
  user: any;
}

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function CourseCard({ course, onEdit, onTogglePublish, onManage }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-[var(--color-gold)]/30 transition-all">
      <div className="relative h-40 bg-zinc-800">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="text-zinc-600" size={40} />
          </div>
        )}
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          course.isPublished ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-zinc-700 text-zinc-400 border border-zinc-600'
        }`}>
          {course.isPublished ? "Published" : "Draft"}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-white text-lg mb-1 line-clamp-1">{course.title}</h3>
        <p className="text-zinc-500 text-xs mb-3 line-clamp-2">{course.description}</p>
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">
          <span className="flex items-center gap-1"><IndianRupee size={12}/>{course.price.toLocaleString()}</span>
          <span>{course._count?.modules || 0} Modules</span>
          <span>{course._count?.enrollments || 0} Students</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onManage(course)} className="flex-1 py-2 bg-[var(--color-gold)] text-zinc-900 rounded-xl text-xs font-black flex items-center justify-center gap-1">
            <Layers size={14}/> Manage
          </button>
          <button onClick={() => onTogglePublish(course)} className={`px-3 py-2 rounded-xl text-xs font-black border ${
            course.isPublished ? 'border-red-800 text-red-400' : 'border-green-800 text-green-400'
          }`}>
            {course.isPublished ? <EyeOff size={14}/> : <Eye size={14}/>}
          </button>
          <button onClick={() => onEdit(course)} className="px-3 py-2 rounded-xl text-xs font-black border border-zinc-700 text-zinc-400">
            <Edit3 size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
}

function ModuleBuilder({ course, user, apiUrl, onClose }: any) {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModule, setShowAddModule] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", videoType: "YOUTUBE", videoUrl: "" });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${user?.backendToken}` };

  useEffect(() => { fetchModules(); }, []);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/services/courses/${course.id}/full`, { headers });
      const data = await res.json();
      setModules(data.course?.modules || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, videoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const addModule = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/services/courses/modules/create`, {
        method: "POST", headers,
        body: JSON.stringify({ courseId: course.id, ...form, order: modules.length })
      });
      if (res.ok) { setForm({ title: "", description: "", videoType: "YOUTUBE", videoUrl: "" }); setShowAddModule(false); fetchModules(); }
      else { const d = await res.json(); alert(d.error); }
    } finally { setSaving(false); }
  };

  const deleteModule = async (id: string) => {
    if (!confirm("Delete this module?")) return;
    await fetch(`${apiUrl}/services/courses/modules/${id}`, { method: "DELETE", headers });
    fetchModules();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">{course.title}</h3>
          <p className="text-zinc-500 text-sm">{modules.length} modules</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"><X size={20}/></button>
      </div>

      {loading ? <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-[var(--color-gold)]" size={32}/></div> : (
        <div className="space-y-3">
          {modules.map((mod, i) => (
            <div key={mod.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
              <GripVertical className="text-zinc-600" size={18}/>
              <div className="w-8 h-8 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-lg flex items-center justify-center font-black text-sm">{i + 1}</div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">{mod.title}</p>
                <p className="text-zinc-500 text-xs">{mod.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  {mod.videoUrl ? (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      mod.videoType === 'YOUTUBE' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'
                    }`}>
                      {mod.videoType === 'YOUTUBE' ? <PlayCircle size={10}/> : <Video size={10}/>}
                      {mod.videoType}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-600 font-bold">No video yet</span>
                  )}
                </div>
              </div>
              <button onClick={() => deleteModule(mod.id)} className="p-2 text-red-500/60 hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20">
                <Trash2 size={16}/>
              </button>
            </div>
          ))}

          {!showAddModule ? (
            <button onClick={() => setShowAddModule(true)} className="w-full py-4 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:border-[var(--color-gold)]/50 hover:text-[var(--color-gold)] transition-all flex items-center justify-center gap-2 font-bold text-sm">
              <Plus size={18}/> Add Module
            </button>
          ) : (
            <div className="bg-zinc-900 border border-[var(--color-gold)]/30 rounded-xl p-5 space-y-4">
              <p className="font-bold text-white">New Module</p>
              <input value={form.title || ""} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Module Title *" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--color-gold)]/50"/>
              <textarea value={form.description || ""} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Module Description" rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--color-gold)]/50"/>
              
              {/* Video Type Selector */}
              <div className="flex rounded-xl overflow-hidden border border-zinc-700">
                {["YOUTUBE", "CLOUDINARY"].map(type => (
                  <button key={type} onClick={() => setForm(f => ({...f, videoType: type, videoUrl: ""}))}
                    className={`flex-1 py-2.5 text-xs font-black flex items-center justify-center gap-2 transition-all ${
                      form.videoType === type ? 'bg-[var(--color-gold)] text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}>
                    {type === 'YOUTUBE' ? <PlayCircle size={14}/> : <Upload size={14}/>}
                    {type === 'YOUTUBE' ? 'YouTube Link' : 'Upload Video'}
                  </button>
                ))}
              </div>

              {form.videoType === 'YOUTUBE' ? (
                <div className="space-y-2">
                  <input value={form.videoUrl || ""} onChange={e => setForm(f => ({...f, videoUrl: e.target.value}))} placeholder="YouTube URL (e.g. https://youtu.be/xxxxx)" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--color-gold)]/50"/>
                  <p className="text-[10px] text-zinc-500 italic ml-2">Supports any YouTube URL including unlisted videos.</p>
                </div>
              ) : (
                <div>
                  <input type="file" ref={fileRef} accept="video/*" onChange={handleVideoFile} className="hidden"/>
                  <button onClick={() => fileRef.current?.click()} className="w-full py-3 border border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:border-[var(--color-gold)]/40 transition-all text-sm flex items-center justify-center gap-2">
                    <Upload size={16}/> {form.videoUrl ? "Video selected ✓" : "Click to upload video"}
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={addModule} disabled={saving || !form.title} className="flex-1 py-3 bg-[var(--color-gold)] text-zinc-900 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>} Save Module
                </button>
                <button onClick={() => setShowAddModule(false)} className="px-4 py-3 bg-zinc-800 rounded-xl text-zinc-400 font-black text-sm"><X size={16}/></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuizBuilder({ course, user, apiUrl, onClose }: any) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ question: "", options: ["", "", "", ""], correctOption: 0 });
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${user?.backendToken}` };

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/services/courses/${course.id}/quiz/questions`, { headers });
      const data = await res.json();
      setQuestions(data.quiz?.questions || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const addQuestion = async () => {
    if (!form.question || form.options.some(o => !o)) { alert("Fill all fields"); return; }
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/services/courses/${course.id}/quiz/questions`, {
        method: "POST", headers,
        body: JSON.stringify(form)
      });
      if (res.ok) { setForm({ question: "", options: ["", "", "", ""], correctOption: 0 }); setShowAdd(false); fetchQuestions(); }
      else { const d = await res.json(); alert(d.error); }
    } finally { setSaving(false); }
  };

  const deleteQuestion = async (courseId: string, questionId: string) => {
    if (!confirm("Delete question?")) return;
    await fetch(`${apiUrl}/services/courses/${courseId}/quiz/questions/${questionId}`, { method: "DELETE", headers });
    fetchQuestions();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Quiz — {course.title}</h3>
          <p className="text-zinc-500 text-sm">{questions.length}/20 questions</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"><X size={20}/></button>
      </div>

      <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-xl text-blue-400 text-xs font-bold">
        📋 Add up to 20 questions. Users will be shown 10 random questions. Passing score: 7/10 (70%)
      </div>

      {loading ? <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-[var(--color-gold)]" size={28}/></div> : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <p className="font-bold text-white text-sm flex-1 pr-4">Q{i+1}. {q.question}</p>
                <button onClick={() => deleteQuestion(course.id, q.id)} className="text-red-500/60 hover:text-red-400 p-1 rounded"><Trash2 size={14}/></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt: string, idx: number) => (
                  <div key={idx} className={`text-xs px-3 py-2 rounded-lg font-medium ${idx === q.correctOption ? 'bg-green-900/30 text-green-400 border border-green-700/30' : 'bg-zinc-800 text-zinc-400'}`}>
                    {idx === q.correctOption && <Check className="inline mr-1" size={10}/>}{opt}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {questions.length < 20 && !showAdd && (
            <button onClick={() => setShowAdd(true)} className="w-full py-4 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:border-[var(--color-gold)]/50 hover:text-[var(--color-gold)] transition-all flex items-center justify-center gap-2 font-bold text-sm">
              <Plus size={18}/> Add Question ({questions.length}/20)
            </button>
          )}

          {showAdd && (
            <div className="bg-zinc-900 border border-[var(--color-gold)]/30 rounded-xl p-5 space-y-4">
              <p className="font-bold text-white">New Question</p>
              <textarea value={form.question} onChange={e => setForm(f => ({...f, question: e.target.value}))} placeholder="Question *" rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--color-gold)]/50"/>
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Options (click radio to mark correct)</p>
                {form.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <button onClick={() => setForm(f => ({...f, correctOption: idx}))}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        form.correctOption === idx ? 'border-green-500 bg-green-500' : 'border-zinc-600'
                      }`}>
                      {form.correctOption === idx && <div className="w-2 h-2 bg-white rounded-full"/>}
                    </button>
                    <input value={opt} onChange={e => { const arr = [...form.options]; arr[idx] = e.target.value; setForm(f => ({...f, options: arr})); }}
                      placeholder={`Option ${idx + 1} *`} className={`flex-1 bg-zinc-800 border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-all ${
                        form.correctOption === idx ? 'border-green-700/50 focus:border-green-500/60' : 'border-zinc-700 focus:border-[var(--color-gold)]/50'
                      }`}/>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={addQuestion} disabled={saving} className="flex-1 py-3 bg-[var(--color-gold)] text-zinc-900 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>} Add Question
                </button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-3 bg-zinc-800 rounded-xl text-zinc-400"><X size={16}/></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminLMSTab({ apiUrl, user }: AdminLMSTabProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [managedCourse, setManagedCourse] = useState<any>(null);
  const [manageView, setManageView] = useState<"modules" | "quiz">("modules");

  // Course form
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState({ title: "", description: "", price: "", thumbnail: "" });
  const [savingCourse, setSavingCourse] = useState(false);
  const thumbnailRef = useRef<HTMLInputElement>(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${user?.backendToken}` };

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/services/courses/admin/all`, { headers });
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCourseForm(f => ({...f, thumbnail: reader.result as string}));
    reader.readAsDataURL(file);
  };

  const saveCourse = async () => {
    if (!courseForm.title || !courseForm.price) { alert("Title and price required"); return; }
    setSavingCourse(true);
    try {
      if (editCourse) {
        const res = await fetch(`${apiUrl}/services/courses/${editCourse.id}`, { method: "PATCH", headers, body: JSON.stringify(courseForm) });
        if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      } else {
        const res = await fetch(`${apiUrl}/services/courses`, { method: "POST", headers, body: JSON.stringify(courseForm) });
        if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      }
      setCourseForm({ title: "", description: "", price: "", thumbnail: "" });
      setShowCreateCourse(false);
      setEditCourse(null);
      fetchCourses();
    } finally { setSavingCourse(false); }
  };

  const togglePublish = async (course: any) => {
    await fetch(`${apiUrl}/services/courses/${course.id}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ isPublished: !course.isPublished })
    });
    fetchCourses();
  };

  const handleEdit = (course: any) => {
    setEditCourse(course);
    setCourseForm({ title: course.title, description: course.description, price: String(course.price), thumbnail: course.thumbnail || "" });
    setShowCreateCourse(true);
  };

  const handleManage = (course: any) => {
    setManagedCourse(course);
    setManageView("modules");
  };

  // ─── MANAGE VIEW ───────────────────────────────────────────────────────────
  if (managedCourse) {
    return (
      <div className="space-y-6">
        <div className="flex gap-3 bg-zinc-900 rounded-2xl p-1 border border-zinc-800 w-fit">
          {(["modules", "quiz"] as const).map(v => (
            <button key={v} onClick={() => setManageView(v)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                manageView === v ? 'bg-[var(--color-gold)] text-zinc-900' : 'text-zinc-400 hover:text-white'
              }`}>
              {v === "modules" ? <><Layers size={14}/> Modules</> : <><HelpCircle size={14}/> Quiz Bank</>}
            </button>
          ))}
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          {manageView === "modules" ? (
            <ModuleBuilder course={managedCourse} user={user} apiUrl={apiUrl} onClose={() => setManagedCourse(null)}/>
          ) : (
            <QuizBuilder course={managedCourse} user={user} apiUrl={apiUrl} onClose={() => setManagedCourse(null)}/>
          )}
        </div>
      </div>
    );
  }

  // ─── COURSE LIST VIEW ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Course Management</h2>
          <p className="text-zinc-500 text-xs mt-1">{courses.length} courses · {courses.filter(c => c.isPublished).length} published</p>
        </div>
        <button onClick={() => { setEditCourse(null); setCourseForm({ title: "", description: "", price: "", thumbnail: "" }); setShowCreateCourse(true); }}
          className="px-4 py-2 bg-[var(--color-gold)] text-zinc-900 rounded-xl font-black text-xs flex items-center gap-2">
          <Plus size={16}/> New Course
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateCourse && (
        <div className="bg-zinc-900 border border-[var(--color-gold)]/30 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="font-bold text-white text-sm">{editCourse ? "Edit Course" : "Create New Course"}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">Course Title *</label>
              <input value={courseForm.title || ""} onChange={e => setCourseForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Advanced Next.js Development" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)]/50 text-sm"/>
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">Description</label>
              <textarea value={courseForm.description || ""} onChange={e => setCourseForm(f => ({...f, description: e.target.value}))} rows={3} placeholder="Course description..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)]/50 text-sm"/>
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">Price (₹) *</label>
              <input type="number" value={courseForm.price || ""} onChange={e => setCourseForm(f => ({...f, price: e.target.value}))} placeholder="e.g. 4999" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)]/50 text-sm"/>
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">Thumbnail</label>
              <input type="file" ref={thumbnailRef} accept="image/*" onChange={handleThumbnail} className="hidden"/>
              <button onClick={() => thumbnailRef.current?.click()} className="w-full py-3 bg-zinc-800 border border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:border-[var(--color-gold)]/40 transition-all text-sm flex items-center justify-center gap-2">
                <Upload size={16}/> {courseForm.thumbnail ? "Image selected ✓" : "Upload Thumbnail"}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={saveCourse} disabled={savingCourse} className="px-8 py-2.5 bg-[var(--color-gold)] text-zinc-900 rounded-xl font-black text-xs flex items-center gap-2 disabled:opacity-50">
              {savingCourse ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
              {editCourse ? "Update Course" : "Create Course"}
            </button>
            <button onClick={() => { setShowCreateCourse(false); setEditCourse(null); }} className="px-6 py-2.5 bg-zinc-800 text-zinc-400 rounded-xl font-black text-xs">Cancel</button>
          </div>
        </div>
      )}

      {/* Courses Grid */}
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[var(--color-gold)]" size={36}/></div>
      ) : courses.length === 0 ? (
        <div className="py-32 text-center">
          <BookOpen className="mx-auto mb-4 text-zinc-700" size={64}/>
          <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No courses yet</p>
          <p className="text-zinc-700 text-[10px] mt-2 italic">Click "New Course" to begin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} onEdit={handleEdit} onTogglePublish={togglePublish} onManage={handleManage}/>
          ))}
        </div>
      )}
    </div>
  );
}
