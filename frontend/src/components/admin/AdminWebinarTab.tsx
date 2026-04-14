/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { 
  Video, Plus, History, Loader2, 
  ExternalLink, Trash2, Shield, Calendar, Users
} from "lucide-react";

interface AdminWebinarTabProps {
  apiUrl: string;
  user: any;
}

export default function AdminWebinarTab({ apiUrl, user }: AdminWebinarTabProps) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const headers = { 
    "Content-Type": "application/json", 
    Authorization: `Bearer ${user?.backendToken}` 
  };

  useEffect(() => { fetchMeetings(); }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/services/webinars/admin/all`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createInstantMeeting = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${apiUrl}/services/webinars/create`, {
        method: "POST", headers,
        body: JSON.stringify({ title: newTitle || "Admin Instant Session" })
      });
      if (res.ok) {
        const data = await res.json();
        setNewTitle("");
        fetchMeetings();
        window.open(data.meetingLink, "_blank");
      }
    } catch (e) {
      alert("Failed to create meeting");
    } finally { setCreating(false); }
  };

  const endMeeting = async (code: string) => {
    if (!confirm("End this meeting for all participants?")) return;
    try {
      const res = await fetch(`${apiUrl}/services/webinars/${code}/end`, {
        method: "PATCH", headers
      });
      if (res.ok) fetchMeetings();
    } catch (e) { alert("Action failed"); }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Launch Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="p-6 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-3xl border border-[var(--color-gold)]/20 shadow-inner">
            <Video size={48} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black text-white tracking-tight">Launch Zanxa Meet</h2>
            <p className="text-zinc-500 text-sm mt-1">Start an instant session with professional tools.</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <input 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Session Title (Optional)"
              className="bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[var(--color-gold)]/50 transition-all text-sm w-full md:w-64"
            />
            <button 
              onClick={createInstantMeeting}
              disabled={creating}
              className="px-8 py-4 bg-[var(--color-gold)] text-zinc-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10 hover:scale-[1.02] transition-all whitespace-nowrap"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} 
              Launch Now
            </button>
          </div>
        </div>
      </div>

      {/* History / Active Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
            <History size={20} className="text-[var(--color-gold)]" /> Meeting Command Center
          </h3>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{meetings.length} Total Sessions</p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[var(--color-gold)]" size={40} /></div>
        ) : meetings.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-zinc-900 rounded-[2.5rem]">
            <Calendar size={48} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No meeting records found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {meetings.map((m: any) => (
              <div key={m.id} className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-6 hover:border-[var(--color-gold)]/30 transition-all group relative overflow-hidden">
                {m.isActive && (
                  <div className="absolute top-0 right-0 px-4 py-1 bg-green-500 text-[10px] font-black text-white uppercase tracking-widest">
                    LIVE NOW
                  </div>
                )}
                
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h4 className="font-black text-white group-hover:text-[var(--color-gold)] transition-colors text-lg tracking-tight line-clamp-1">{m.title}</h4>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                      <Shield size={10} className="text-[var(--color-gold)]" /> CODE: {m.meetingCode}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {m.isActive ? (
                      <button onClick={() => endMeeting(m.meetingCode)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 transition-all border border-red-500/20">
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <span className="text-[10px] bg-zinc-800 text-zinc-500 px-3 py-1.5 rounded-lg font-black uppercase">Ended</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-zinc-900">
                  <div className="flex flex-col">
                    <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">Attendees</span>
                    <span className="text-white font-bold flex items-center gap-1">
                      <Users size={12} className="text-zinc-500" /> {m._count?.attendees || 0}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">Host</span>
                    <span className="text-zinc-400 font-bold text-sm">{m.host?.name || "Admin"}</span>
                  </div>
                </div>

                {m.isActive && (
                  <button 
                    onClick={() => window.open(`${window.location.origin}/services/webinars/room/${m.meetingCode}`, "_blank")}
                    className="w-full mt-6 py-3 bg-zinc-900 text-[var(--color-gold)] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-[var(--color-gold)]/20 hover:bg-[var(--color-gold)]/10 transition-all flex items-center justify-center gap-2"
                  >
                    Join Room <ExternalLink size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
