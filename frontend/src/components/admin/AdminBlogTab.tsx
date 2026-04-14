/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, Plus, Trash2, Edit3, Eye, Loader2, 
  CheckCircle, Clock, Tag, X, Send, Image as ImageIcon
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

interface AdminBlogTabProps {
  apiUrl: string;
}

export default function AdminBlogTab({ apiUrl }: AdminBlogTabProps) {
  const { user }: any = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    thumbnail: "",
    tags: [] as string[],
    isPublished: false
  });
  const [submitting, setSubmitting] = useState(false);

  const headers = {
    Authorization: `Bearer ${user?.backendToken}`,
    "Content-Type": "application/json"
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/blogs/admin/all`, { headers });
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Blog fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || "",
      thumbnail: post.thumbnail || "",
      tags: post.tags || [],
      isPublished: post.isPublished
    });
    setShowEditor(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingPost ? `${apiUrl}/blogs/${editingPost.id}` : `${apiUrl}/blogs`;
      const method = editingPost ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert(editingPost ? "Post updated!" : "Post created!");
        setShowEditor(false);
        setEditingPost(null);
        fetchPosts();
      }
    } catch (err) {
      alert("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
      const res = await fetch(`${apiUrl}/blogs/${id}`, { method: "DELETE", headers });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      alert("Delete failed");
    }
  };

  if (loading && posts.length === 0) return (
    <div className="flex justify-center p-32">
      <Loader2 className="w-12 h-12 text-[var(--color-gold)] animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Editorial Center</h2>
          <p className="text-zinc-500 text-sm mt-1">Manage ZANXA TECH official publications and thought leadership.</p>
        </div>
        <button 
          onClick={() => { setEditingPost(null); setFormData({ title: "", content: "", excerpt: "", thumbnail: "", tags: [], isPublished: false }); setShowEditor(true); }}
          className="px-6 py-3 bg-[var(--color-gold)] text-zinc-950 rounded-2xl font-bold text-xs uppercase flex items-center gap-2 hover:bg-zinc-800 hover:text-white transition-all shadow-xl shadow-yellow-500/10"
        >
          <Plus size={16} /> New Publication
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between group hover:border-[var(--color-gold)] transition-all shadow-sm">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${post.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {post.isPublished ? 'Published' : 'Draft'}
                </span>
                <div className="flex gap-2">
                   <button onClick={() => handleEdit(post)} className="p-2 text-zinc-400 hover:text-[var(--color-gold)]"><Edit3 size={18} /></button>
                   <button onClick={() => handleDelete(post.id)} className="p-2 text-zinc-400 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 line-clamp-1">{post.title}</h3>
              <p className="text-zinc-500 text-xs line-clamp-2 mb-4 leading-relaxed">{post.excerpt || "No excerpt provided."}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag: string, i: number) => (
                  <span key={i} className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Tag size={10} /> {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-zinc-50 dark:border-zinc-800">
               <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase">
                  <Clock size={14} /> {new Date(post.createdAt).toLocaleDateString()}
               </div>
               <button className="flex items-center gap-2 text-xs font-bold text-[var(--color-gold)] hover:underline">
                  Preview <Eye size={14} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-6">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[3rem] p-12 border border-white/5 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
              <button onClick={() => setShowEditor(false)} className="absolute top-8 right-8 text-zinc-400 hover:text-zinc-100"><X size={32} /></button>
              
              <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8 tracking-tighter">Drafting Luxury Content</h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black uppercase text-zinc-400 mb-2 block">Post Title</label>
                      <input 
                        type="text" 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl p-4 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                        placeholder="Mastering Eternal Elegance..."
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase text-zinc-400 mb-2 block">Excerpt / Summary</label>
                      <textarea 
                        value={formData.excerpt} 
                        onChange={e => setFormData({...formData, excerpt: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl p-4 text-zinc-900 dark:text-white focus:outline-none h-24"
                        placeholder="A brief overview for the listing page..."
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black uppercase text-zinc-400 mb-2 block">Thumbnail Image</label>
                      <div className="space-y-3">
                         <div className="flex gap-2">
                            <input 
                              type="file" 
                              id="blog-thumbnail"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => setFormData({...formData, thumbnail: reader.result as string});
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                            <button 
                              type="button"
                              onClick={() => document.getElementById('blog-thumbnail')?.click()}
                              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 text-zinc-500 hover:border-[var(--color-gold)]/40 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                            >
                               <Upload size={18} /> {formData.thumbnail ? "Image Selected ✓" : "Upload Thumbnail"}
                            </button>
                         </div>
                         {formData.thumbnail && (
                           <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
                             <img src={formData.thumbnail} className="w-full h-full object-cover opacity-80" alt="Preview"/>
                             <button onClick={() => setFormData({...formData, thumbnail: ""})} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-md"><X size={12}/></button>
                           </div>
                         )}
                      </div>
                    </div>
                    <div>
                       <label className="text-xs font-black uppercase text-zinc-400 mb-2 block">Visibility Settings</label>
                       <label className="flex items-center gap-3 cursor-pointer p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                          <input 
                            type="checkbox" 
                            checked={formData.isPublished} 
                            onChange={e => setFormData({...formData, isPublished: e.target.checked})}
                            className="w-5 h-5 accent-[var(--color-gold)]"
                          />
                          <span className="text-sm font-bold dark:text-white">Publish Immediately</span>
                       </label>
                    </div>
                  </div>
                </div>

                <div>
                   <label className="text-xs font-black uppercase text-zinc-400 mb-2 block">Main Content (Markdown/HTML supported)</label>
                   <textarea 
                    value={formData.content} 
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-3xl p-6 text-zinc-900 dark:text-white focus:outline-none min-h-[300px] font-mono text-sm leading-relaxed"
                    required 
                   />
                </div>

                <div className="flex justify-end pt-6">
                   <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-12 py-5 bg-[var(--color-gold)] text-zinc-950 font-black rounded-3xl uppercase text-xs tracking-[0.2em] shadow-2xl shadow-yellow-500/20 flex items-center gap-3 hover:scale-105 transition-all"
                   >
                    {submitting ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Finalize Publication</>}
                   </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
