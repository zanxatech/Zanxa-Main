/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Loader2, Shield, Users, MessageSquare, 
  ArrowLeft, Copy, Check, LogOut 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function MeetingRoom() {
  const { code } = useParams();
  const router = useRouter();
  const { user }: any = useAuth();
  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    fetchMeetingInfo();
    loadJitsiScript();

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, [code]);

  const fetchMeetingInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/services/webinars/${code}`, {
        // Headers are now optional so guests can join
        headers: user?.backendToken ? { Authorization: `Bearer ${user.backendToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setMeeting(data.meeting);
      } else {
        router.push("/services/webinars");
      }
    } catch (e) {
      console.error(e);
      router.push("/services/webinars");
    }
  };

  const executeJitsiCommand = (command: string, options: any = {}) => {
    if (apiRef.current) {
      apiRef.current.executeCommand(command, options);
    }
  };

  const loadJitsiScript = () => {
    if (window.JitsiMeetExternalAPI) {
      setLoading(false);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => setLoading(false);
    document.body.appendChild(script);
  };

  useEffect(() => {
    if (!loading && !apiRef.current && jitsiContainerRef.current) {
      const domain = "meet.jit.si";
      const options = {
        roomName: `ZanxaTech-${code}`,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: user?.name || "Guest Participant"
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
            'security'
          ],
          SET_FILMSTRIP_ENABLED: true,
          DEFAULT_BACKGROUND: '#09090b'
        },
        configOverwrite: {
          disableDeepLinking: true,
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false
        }
      };

      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      apiRef.current.addEventListeners({
        readyToClose: () => router.push("/services/webinars"),
        videoConferenceJoined: () => console.log("Joined conference"),
        videoConferenceLeft: () => router.push("/services/webinars")
      });
    }
  }, [loading, user]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans overflow-hidden">
      {/* Premium Header */}
      <header className="h-20 bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800/50 flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push("/services/webinars")}
            className="p-3 bg-zinc-800/50 text-zinc-400 hover:text-white rounded-2xl transition-all border border-zinc-700/50 hover:border-[var(--color-gold)]/30"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span className="text-[var(--color-gold)]">ZANXA</span> MEET
              {meeting && <span className="text-zinc-500 font-medium px-2 py-0.5 bg-zinc-800 rounded-lg text-xs border border-zinc-700">LIVE: {meeting.title}</span>}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 tracking-widest">
              <Shield size={12} className="text-[var(--color-gold)]" /> Secure Link: 
            </div>
            <span className="text-xs text-zinc-300 font-mono">{code}</span>
            <button onClick={copyLink} className="p-1 px-2 hover:bg-zinc-700 rounded-lg transition-colors">
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-zinc-400" />}
            </button>
          </div>
          
          <button 
            onClick={() => router.push("/services/webinars")}
            className="px-6 py-2.5 bg-red-500/10 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
          >
            Leave <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Main Room Content */}
      <main className="flex-1 relative flex">
        {/* Sidebar for info (collapsible) */}
        <aside className="w-80 border-r border-zinc-900 bg-zinc-950 p-6 hidden xl:block">
           <div className="space-y-8">
              <div className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Meeting Details</h4>
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[var(--color-gold)]/10 text-[var(--color-gold)] flex items-center justify-center font-black">M</div>
                      <div>
                        <p className="text-white text-xs font-bold">{meeting?.title || "Zanxa Session"}</p>
                        <p className="text-zinc-500 text-[10px]">Active Session</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center font-black">H</div>
                      <div>
                        <p className="text-zinc-300 text-xs font-bold">{meeting?.host?.name || "Zanxa Host"}</p>
                        <p className="text-zinc-600 text-[10px]">Session Leader</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] px-2">Collaborate</h4>
                <button 
                  onClick={() => executeJitsiCommand('toggleParticipantsPane')}
                  className="w-full flex items-center gap-3 p-4 bg-zinc-900/30 text-zinc-300 rounded-2xl hover:bg-zinc-900 transition-all border border-zinc-800"
                >
                   <Users size={18} className="text-[var(--color-gold)]" />
                   <span className="text-xs font-bold">Participants</span>
                </button>
                <button 
                  onClick={() => executeJitsiCommand('toggleChat')}
                  className="w-full flex items-center gap-3 p-4 bg-zinc-900/30 text-zinc-300 rounded-2xl hover:bg-zinc-900 transition-all border border-zinc-800"
                >
                   <MessageSquare size={18} className="text-[var(--color-gold)]" />
                   <span className="text-xs font-bold">In-room Chat</span>
                </button>
              </div>
           </div>
        </aside>

        {/* Video Frame */}
        <div className="flex-1 bg-black relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-20">
              <Loader2 className="w-12 h-12 text-[var(--color-gold)] animate-spin mb-4" />
              <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-[10px]">Initializing Zanxa Meet...</p>
            </div>
          )}
          <div ref={jitsiContainerRef} className="w-full h-full" />
        </div>
      </main>

      {/* Styled Jitsi Overrides */}
      <style jsx global>{`
        #jitsiConferenceFrame {
          border: none;
        }
        .jitsi-video-container {
          background-color: #09090b !important;
        }
      `}</style>
    </div>
  );
}
