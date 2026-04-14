/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Palette, Plus, Trash2, Edit3, Loader2, 
  Upload, X, Check, Folder, Layers, ChevronLeft, ChevronRight, Image as ImageIcon
} from "lucide-react";

interface AdminCreativeTabProps {
  apiUrl: string;
  user: any;
}

export default function AdminCreativeTab({ apiUrl, user }: AdminCreativeTabProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Category Form
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);

  // Folder Form
  const [showFolderForm, setShowFolderForm] = useState<string | null>(null); // Category ID
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingFolder, setSavingFolder] = useState(false);
  
  const [folderForm, setFolderForm] = useState({
    number: "",
    description: "",
    images: [] as string[], // Base64
    existingImages: [] as string[] // URLs
  });
  
  const fileRef = useRef<HTMLInputElement>(null);
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${user?.backendToken}` };

  useEffect(() => { fetchContent(); }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/services/creative/admin/all`, { headers });
      if (res.ok) {
        const d = await res.json();
        setData(d.categories || []);
      } else if (res.status === 401) {
        alert("Session expired. Please log in again.");
      }
    } catch (e) { 
      console.error(e);
      alert("Failed to load content. Check your internet connection.");
    } finally { setLoading(false); }
  };

  const createCategory = async () => {
    if (!catName) return;
    setSavingCat(true);
    try {
      const res = await fetch(`${apiUrl}/services/creative/categories`, {
        method: "POST", headers,
        body: JSON.stringify({ title: catName })
      });
      
      if (res.ok) {
        setCatName("");
        setShowCatForm(false);
        fetchContent();
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || "Failed to create category"}`);
      }
    } catch (e) { 
      console.error(e);
      alert("Network error: Could not connect to server.");
    } finally { setSavingCat(false); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete category and all its folders?")) return;
    await fetch(`${apiUrl}/services/creative/categories/${id}`, { method: "DELETE", headers });
    fetchContent();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setFolderForm(f => ({ ...f, images: [...f.images, reader.result as string] }));
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setFolderForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const removeExistingImage = (url: string) => {
    setFolderForm(f => ({ ...f, existingImages: f.existingImages.filter(u => u !== url) }));
  };

  const saveFolder = async (catId: string) => {
    if (!folderForm.number) return;
    setSavingFolder(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const endpoint = editingId ? `${apiUrl}/services/creative/folders/${editingId}` : `${apiUrl}/services/creative/folders`;
      
      const res = await fetch(endpoint, {
        method, headers,
        body: JSON.stringify({ 
          categoryId: catId, 
          folderNumber: folderForm.number, 
          description: folderForm.description,
          images: [...folderForm.existingImages, ...folderForm.images] 
        })
      });

      if (res.ok) {
        resetFolderForm();
        fetchContent();
      } else {
        const d = await res.json();
        alert(`Save failed: ${d.error || d.message || "Server error"}`);
      }
    } catch (e) {
      console.error(e);
      alert("Network error: Could not save template.");
    } finally { setSavingFolder(false); }
  };

  const deleteFolder = async (id: string) => {
    if (!confirm("Delete this folder?")) return;
    try {
      await fetch(`${apiUrl}/services/creative/folders/${id}`, { method: "DELETE", headers });
      fetchContent();
    } catch (e) { alert("Delete failed"); }
  };

  const handleEdit = (catId: string, f: any) => {
    setEditingId(f.id);
    setFolderForm({
      number: f.folderNumber,
      description: f.description || "",
      images: [],
      existingImages: f.images || []
    });
    setShowFolderForm(catId);
  };

  const resetFolderForm = () => {
    setFolderForm({ number: "", description: "", images: [], existingImages: [] });
    setEditingId(null);
    setShowFolderForm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Palette className="text-[var(--color-gold)]" size={20}/> Design Templates
          </h2>
          <p className="text-zinc-500 text-xs mt-1">Manage luxury categories and image folders.</p>
        </div>
        <button onClick={() => { setCatName(""); setShowCatForm(true); }} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-zinc-700 transition-all border border-zinc-700">
          <Layers size={16}/> New Category
        </button>
      </div>

      {showCatForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 w-full">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block mb-3">Category Name</label>
              <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Minimalism, Classic Luxury..." className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[var(--color-gold)]/50 transition-all text-sm shadow-inner"/>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button onClick={createCategory} disabled={savingCat} className="flex-1 md:flex-none px-8 py-4 bg-[var(--color-gold)] text-zinc-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10 hover:scale-[1.02] transition-all">
                {savingCat ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>} Save
              </button>
              <button onClick={() => setShowCatForm(false)} className="px-6 py-4 bg-zinc-800 text-zinc-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[var(--color-gold)]" size={40}/></div>
      ) : (
        <div className="space-y-8">
          {data.map(cat => (
            <div key={cat.id} className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="bg-zinc-900/40 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-zinc-900/50">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-2xl flex items-center justify-center font-black text-xl border border-[var(--color-gold)]/20 shadow-inner">
                    {cat.title?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">{cat.title}</h3>
                    <p className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.3em] mt-1">{cat.folders?.length || 0} DESIGN TEMPLATES</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => { resetFolderForm(); setShowFolderForm(cat.id); }} className="px-5 py-2.5 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-[var(--color-gold)]/20 hover:bg-[var(--color-gold)]/20 transition-all flex items-center gap-2">
                    <Plus size={14}/> New Template
                  </button>
                  <button onClick={() => deleteCategory(cat.id)} className="p-3 text-zinc-700 hover:text-red-500 transition-colors bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-red-500/30"><Trash2 size={20}/></button>
                </div>
              </div>

              <div className="p-6">
                {showFolderForm === cat.id && (
                  <div className="mb-6 p-8 bg-zinc-900 border border-[var(--color-gold)]/20 rounded-[2.5rem] space-y-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
                      <h3 className="font-black text-white text-lg tracking-tight">{editingId ? "Edit Design Template" : "Create New Project"}</h3>
                      <button onClick={resetFolderForm} className="text-zinc-500 hover:text-white transition-colors"><X size={24}/></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-3">Project Title / Folder Number</label>
                          <input value={folderForm.number} onChange={e => setFolderForm(f => ({...f, number: e.target.value}))} placeholder="e.g. F-101 Premium Design" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[var(--color-gold)]/50 transition-all text-sm shadow-inner"/>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-3">Description</label>
                          <textarea value={folderForm.description} onChange={e => setFolderForm(f => ({...f, description: e.target.value}))} rows={6} placeholder="Describe the design features, tech stack, or style..." className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[var(--color-gold)]/50 transition-all text-sm resize-none shadow-inner"/>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-3">Project Images (Slideshow)</label>
                        
                        <div className="grid grid-cols-3 gap-3">
                          {/* Existing Images */}
                          {folderForm.existingImages.map((url, i) => (
                            <div key={`ex-${i}`} className="relative aspect-square bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 group shadow-lg">
                              <img src={url} className="w-full h-full object-cover opacity-60" alt="existing"/>
                              <button onClick={() => removeExistingImage(url)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                <X size={12}/>
                              </button>
                            </div>
                          ))}
                          {/* New Images */}
                          {folderForm.images.map((img, i) => (
                            <div key={`new-${i}`} className="relative aspect-square bg-zinc-950 rounded-2xl overflow-hidden border border-[var(--color-gold)]/30 group shadow-lg">
                              <img src={img} className="w-full h-full object-cover" alt="preview"/>
                              <button onClick={() => removeNewImage(i)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                <X size={12}/>
                              </button>
                            </div>
                          ))}
                          
                          {/* Large Add Box */}
                          <button onClick={() => fileRef.current?.click()} className="aspect-square border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-600 hover:border-[var(--color-gold)]/40 hover:text-[var(--color-gold)] hover:bg-[var(--color-gold)]/5 transition-all group">
                            <Upload size={24} className="group-hover:scale-110 transition-transform"/>
                            <span className="text-[10px] font-black uppercase tracking-wider">Add Image</span>
                          </button>
                        </div>
                        <input type="file" ref={fileRef} multiple accept="image/*" onChange={handleFileChange} className="hidden"/>
                        <p className="text-[10px] text-zinc-600 italic leading-relaxed">Upload multiple images. They will appear as a luxury slideshow on the platform.</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-zinc-800">
                      <button onClick={() => saveFolder(cat.id)} disabled={savingFolder || !folderForm.number} className="flex-[3] py-4 bg-[var(--color-gold)] text-zinc-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-yellow-500/10 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale">
                        {savingFolder ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>}
                        {editingId ? "Update Project" : "Create Project"}
                      </button>
                      <button onClick={resetFolderForm} className="flex-1 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {cat.folders?.length === 0 ? (
                  <div className="py-10 text-center text-zinc-800 text-xs italic">No folders in this category yet.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {cat.folders.map((folder: any) => (
                      <FolderCard key={folder.id} folder={folder} onEdit={() => handleEdit(cat.id, folder)} onDelete={() => deleteFolder(folder.id)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FolderCard({ folder, onEdit, onDelete }: any) {
  const [currentImg, setCurrentImg] = useState(0);
  const images = folder.images || [];

  return (
    <div className="bg-zinc-900 border border-zinc-850 rounded-2xl overflow-hidden hover:border-[var(--color-gold)]/30 transition-all group flex flex-col">
      <div className="relative aspect-[4/5] bg-zinc-800 overflow-hidden">
        {images.length > 0 ? (
          <>
            <img src={images[currentImg]} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" alt={folder.folderNumber}/>
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => setCurrentImg(prev => (prev > 0 ? prev - 1 : images.length - 1))} className="p-1.5 bg-black/60 text-white rounded-full hover:bg-[var(--color-gold)] hover:text-zinc-900 transition-all"><ChevronLeft size={16}/></button>
                <button onClick={() => setCurrentImg(prev => (prev < images.length - 1 ? prev + 1 : 0))} className="p-1.5 bg-black/60 text-white rounded-full hover:bg-[var(--color-gold)] hover:text-zinc-900 transition-all"><ChevronRight size={16}/></button>
              </div>
            )}
            <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 rounded text-[9px] font-bold text-white tracking-widest">
              {currentImg + 1} / {images.length}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700">
            <ImageIcon size={40}/>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-1">Catalog ID</p>
        <h3 className="font-black text-white text-sm group-hover:text-[var(--color-gold)] transition-colors">{folder.folderNumber}</h3>
        {folder.description && (
          <p className="text-zinc-500 text-[11px] mt-2 line-clamp-2 leading-relaxed italic">{folder.description}</p>
        ) || <div className="mt-2 h-8"></div>}
        
        <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800/50">
          <button onClick={onEdit} className="flex-1 py-2 bg-zinc-800/50 text-zinc-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-[var(--color-gold)] hover:text-zinc-900 transition-all">
            <Edit3 size={12}/> Edit
          </button>
          <button onClick={onDelete} className="p-2 text-red-500/40 hover:text-red-500 transition-colors">
            <Trash2 size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
}
