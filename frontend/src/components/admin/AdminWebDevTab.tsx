/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Globe, Plus, Trash2, Edit3, Loader2, 
  Upload, X, Check, Image as ImageIcon, ChevronLeft, ChevronRight
} from "lucide-react";

interface AdminWebDevTabProps {
  apiUrl: string;
  user: any;
}

export default function AdminWebDevTab({ apiUrl, user }: AdminWebDevTabProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    images: [] as string[], // Base64 strings for upload
    existingImages: [] as string[], // URLs from backend
    isActive: true
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${user?.backendToken}` };

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/services/webdev`, { headers });
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setForm(f => ({ ...f, images: [...f.images, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const removeExistingImage = (url: string) => {
    setForm(f => ({ ...f, existingImages: f.existingImages.filter(u => u !== url) }));
  };

  const saveProject = async () => {
    if (!form.title || !form.description) return;
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const endpoint = editingId ? `${apiUrl}/services/webdev/${editingId}` : `${apiUrl}/services/webdev`;
      
      const res = await fetch(endpoint, {
        method, headers,
        body: JSON.stringify({
          ...form,
          // If editing, backend might need to know which images to keep
          // Here we just send everything and let the backend replace
          images: [...form.existingImages, ...form.images] 
        })
      });

      if (res.ok) {
        setShowForm(false);
        resetForm();
        fetchProjects();
      } else {
        const d = await res.json();
        alert(d.error || "Save failed");
      }
    } catch (e) {
      alert("Error saving project");
    } finally { setSaving(false); }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await fetch(`${apiUrl}/services/webdev/${id}`, { method: "DELETE", headers });
      fetchProjects();
    } catch (e) { alert("Delete failed"); }
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description,
      price: String(p.price || 0),
      images: [],
      existingImages: p.images || [],
      isActive: p.isActive
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ title: "", description: "", price: "", images: [], existingImages: [], isActive: true });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="text-[var(--color-gold)]" size={20}/> Web Development Projects
          </h2>
          <p className="text-zinc-500 text-xs mt-1">Manage project portfolios and slideshows.</p>
        </div>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-[var(--color-gold)] text-zinc-900 rounded-xl font-black text-xs flex items-center gap-2">
            <Plus size={16}/> New Project
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-zinc-900 border border-[var(--color-gold)]/20 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="font-bold text-white">{editingId ? "Edit Project" : "Create New Project"}</h3>
            <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Project Title</label>
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Luxury E-commerce Site" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)]/50 text-sm"/>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} placeholder="Describe the project features and tech stack..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)]/50 text-sm"/>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Project Price (₹)</label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} placeholder="e.g. 15000" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)]/50 text-sm"/>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Project Images (Slideshow)</label>
              
              <div className="grid grid-cols-3 gap-2">
                {/* Existing Images */}
                {form.existingImages.map((url, i) => (
                  <div key={`ex-${i}`} className="relative aspect-square bg-zinc-800 rounded-lg overflow-hidden group border border-zinc-700">
                    <img src={url} className="w-full h-full object-cover opacity-60" alt="existing"/>
                    <button onClick={() => removeExistingImage(url)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all">
                      <X size={12}/>
                    </button>
                  </div>
                ))}
                
                {/* New Images */}
                {form.images.map((img, i) => (
                  <div key={`new-${i}`} className="relative aspect-square bg-zinc-800 rounded-lg overflow-hidden border border-[var(--color-gold)]/30">
                    <img src={img} className="w-full h-full object-cover" alt="new"/>
                    <button onClick={() => removeNewImage(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md">
                      <X size={12}/>
                    </button>
                  </div>
                ))}

                <button onClick={() => fileRef.current?.click()} className="aspect-square border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center gap-1 text-zinc-500 hover:border-[var(--color-gold)]/40 hover:text-[var(--color-gold)] transition-all">
                  <Upload size={20}/>
                  <span className="text-[10px] font-bold">Add Image</span>
                </button>
              </div>
              <input type="file" ref={fileRef} multiple accept="image/*" onChange={handleFileChange} className="hidden"/>
              <p className="text-[10px] text-zinc-600 italic">Upload multiple images. They will appear as a slideshow on the user page.</p>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-zinc-800">
            <button onClick={saveProject} disabled={saving || !form.title} className="flex-1 py-3 bg-[var(--color-gold)] text-zinc-900 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>}
              {editingId ? "Update Project" : "Create Project"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-3 bg-zinc-800 text-zinc-400 rounded-xl font-black text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 flex justify-center"><Loader2 className="animate-spin text-[var(--color-gold)]" size={32}/></div>
          ) : projects.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
              <ImageIcon className="mx-auto mb-4 text-zinc-800" size={48}/>
              <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">No web projects found</p>
            </div>
          ) : (
            projects.map(p => (
              <ProjectCard key={p.id} project={p} onEdit={() => handleEdit(p)} onDelete={() => deleteProject(p.id)}/>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onEdit, onDelete }: any) {
  const [currentImg, setCurrentImg] = useState(0);
  const images = project.images || [];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-[var(--color-gold)]/30 transition-all group">
      <div className="relative h-48 bg-zinc-800">
        {images.length > 0 ? (
          <>
            <img src={images[currentImg]} className="w-full h-full object-cover opacity-80" alt={project.title}/>
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => setCurrentImg(prev => (prev > 0 ? prev - 1 : images.length - 1))} className="p-1 bg-black/60 text-white rounded-full"><ChevronLeft size={16}/></button>
                <button onClick={() => setCurrentImg(prev => (prev < images.length - 1 ? prev + 1 : 0))} className="p-1 bg-black/60 text-white rounded-full"><ChevronRight size={16}/></button>
              </div>
            )}
            <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 rounded text-[9px] font-bold text-white">
              {currentImg + 1} / {images.length}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700">
            <ImageIcon size={40}/>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-bold text-white group-hover:text-[var(--color-gold)] transition-colors line-clamp-1">{project.title || "Untitled Project"}</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">₹{(project.price || 0).toLocaleString()}</p>
          <p className="text-zinc-400 text-[9px] font-medium">{project.images?.length || 0} Slides</p>
        </div>
        <p className="text-zinc-500 text-xs mt-2 line-clamp-2 h-8">{project.description}</p>
        
        <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800">
          <button onClick={onEdit} className="flex-1 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-zinc-700 transition-all">
            <Edit3 size={12}/> Edit
          </button>
          <button onClick={onDelete} className="px-3 py-2 text-red-500/60 hover:text-red-400 transition-colors border border-red-500/10 hover:border-red-500/30 rounded-lg">
            <Trash2 size={12}/>
          </button>
        </div>
      </div>
    </div>
  );
}
