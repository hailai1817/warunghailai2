"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCheck,
  Headphones,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { STORAGE_KEYS } from "@/lib/constants";

const QUICK_QUESTIONS = [
  "Halo CS, apakah stok roti hari ini masih lengkap?",
  "Bisa tolong bantu konfirmasi pesanan saya?",
  "Berapa jam operasional dan alamat toko saat ini?",
  "Bagaimana cara pembayaran lewat QRIS?",
];

export default function CustomerChatWidget() {
  const { user } = useAuth();
  const {
    csChats,
    sendCsMessage,
    markCsRead,
    customerChatOpen,
    setCustomerChatOpen,
  } = useStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate or retrieve persistent customer thread ID
  const customerName = user?.name || "Pelanggan";
  const [threadId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const cleanName = (user?.name || "Pelanggan").replace(/\s+/g, "_").toLowerCase();
    const storageKey = `${STORAGE_KEYS.customerChatId}_${cleanName}`;
    let saved = localStorage.getItem(storageKey);
    if (!saved) {
      saved = `CS-${cleanName}-${Date.now().toString(36)}`;
      localStorage.setItem(storageKey, saved);
    }
    return saved;
  });

  // Find existing thread from store by threadId or matching customerName
  const activeThread = useMemo(() => {
    if (!threadId) return null;
    return (
      csChats.find((t) => t.id === threadId) ||
      csChats.find((t) => t.customerName.toLowerCase() === customerName.toLowerCase()) ||
      null
    );
  }, [csChats, threadId, customerName]);

  // Check if there are unread messages from admin
  const hasUnreadReply = Boolean(activeThread?.unreadByCustomer);

  // Mark thread read when user opens widget
  useEffect(() => {
    if (customerChatOpen && activeThread && activeThread.unreadByCustomer) {
      markCsRead(activeThread.id, "pelanggan");
    }
  }, [customerChatOpen, activeThread, markCsRead]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (customerChatOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [customerChatOpen, isMinimized, activeThread?.messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !threadId || isSending) return;

    setIsSending(true);
    setInputText("");

    try {
      await sendCsMessage(threadId, text, "pelanggan", customerName, {
        customerName,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // Only show floating widget for customers (or users viewing as pelanggan)
  if (user?.role !== "pelanggan") {
    return null;
  }

  return (
    <div className="no-print fixed bottom-24 left-4 z-40 lg:bottom-6 lg:left-72">
      {/* Floating Trigger Button (Positioned at bottom-left, completely away from cashier/payment panel) */}
      {!customerChatOpen && (
        <button
          onClick={() => {
            setCustomerChatOpen(true);
            setIsMinimized(false);
          }}
          className="group relative flex items-center gap-2 rounded-full border border-amber-300/40 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-800 px-3.5 py-2.5 text-white shadow-xl shadow-stone-900/30 transition-all duration-300 hover:scale-105 hover:border-amber-400 hover:shadow-2xl active:scale-95"
          aria-label="Buka Chat CS"
          title="Butuh bantuan? Chat CS Toko (Admin)"
        >
          <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
            <Headphones className="h-4 w-4 transition-transform group-hover:rotate-12" />
            {hasUnreadReply && (
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-stone-900" />
              </span>
            )}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-300/90 leading-tight">
              Bantuan Toko
            </p>
            <p className="text-xs font-extrabold leading-tight text-white">Chat CS Admin</p>
          </div>
          {hasUnreadReply && (
            <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[9px] font-black text-white shadow-sm animate-pulse">
              1
            </span>
          )}
        </button>
      )}

      {/* Floating Chat Window (Opens on the left, keeping the cashier payment panel completely unobstructed) */}
      {customerChatOpen && (
        <div
          className={`flex flex-col rounded-3xl border border-stone-200/90 bg-white shadow-2xl transition-all duration-300 ${
            isMinimized
              ? "h-16 w-80 sm:w-96"
              : "h-[520px] max-h-[80vh] w-[92vw] max-w-sm sm:w-[370px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-stone-800 via-amber-950 to-stone-900 px-4 py-3 text-white shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/30">
                <Headphones className="h-4.5 w-4.5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-stone-900 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black leading-tight text-white">CS Warung HaiLai</h3>
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                    Admin
                  </span>
                </div>
                <p className="text-[10px] font-medium text-amber-200/80">
                  Respon langsung Admin (Bukan Bot)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized((prev) => !prev)}
                className="rounded-lg p-1.5 text-stone-300 transition hover:bg-white/10 hover:text-white"
                title={isMinimized ? "Perbesar" : "Perkecil"}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setCustomerChatOpen(false)}
                className="rounded-lg p-1.5 text-stone-300 transition hover:bg-white/10 hover:text-white"
                title="Tutup Chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto bg-stone-50/70 p-4 space-y-3">
                {/* Intro Welcome Card */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-amber-900 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-amber-950 mb-1">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <span>Layanan Pelanggan HaiLai</span>
                  </div>
                  <p className="leading-relaxed text-stone-600">
                    Halo <strong>{customerName}</strong>! Ada yang bisa kami bantu terkait menu,
                    ketersediaan stok roti, pembayaran, atau kendala belanja? Tulis pesan Anda di
                    bawah, Admin kami akan segera merespons langsung.
                  </p>
                </div>

                {/* Quick Prompts if conversation is empty */}
                {(!activeThread || activeThread.messages.length === 0) && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Pertanyaan Cepat:
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {QUICK_QUESTIONS.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => void handleSend(q)}
                          className="rounded-xl border border-stone-200 bg-white p-2.5 text-left text-xs font-semibold text-stone-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 active:scale-[0.98]"
                        >
                          💬 {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages List */}
                {activeThread?.messages.map((msg) => {
                  const isMe = msg.senderRole === "pelanggan";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-stone-400">
                        {isMe ? (
                          <>
                            <span>Anda</span>
                            <User className="h-3 w-3" />
                          </>
                        ) : (
                          <>
                            <Headphones className="h-3 w-3 text-amber-600" />
                            <span className="text-amber-800 font-extrabold">Admin HaiLai</span>
                          </>
                        )}
                      </div>
                      <div
                        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                          isMe
                            ? "rounded-tr-none bg-gradient-to-r from-amber-600 to-[var(--color-terracotta)] text-white"
                            : "rounded-tl-none border border-stone-200 bg-white text-stone-800"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[9px] text-stone-400">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMe && <CheckCheck className="h-3 w-3 text-amber-600" />}
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-stone-200 bg-white p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tulis pesan ke Admin CS..."
                    disabled={isSending}
                    className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs font-medium text-stone-800 placeholder-stone-400 transition focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-amber-600 to-[var(--color-terracotta)] text-white shadow-md transition hover:opacity-90 active:scale-95 disabled:opacity-40"
                    title="Kirim Pesan"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                <p className="mt-1.5 text-center text-[10px] text-stone-400">
                  Respon langsung dari Admin • Privasi Anda terjaga
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
