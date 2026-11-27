"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import {
  CheckCheck,
  Headphones,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";

const ADMIN_QUICK_REPLIES = [
  "Halo! Terima kasih telah menghubungi CS HaiLai. Ada yang bisa kami bantu?",
  "Baik kak, mohon tunggu sebentar ya, kami cek stoknya terlebih dahulu.",
  "Pesanan kakak sudah kami konfirmasi dan sedang disiapkan dengan baik.",
  "Sama-sama kak, terima kasih banyak sudah berbelanja di HaiLai's Bakery!",
];

export default function AdminChatCsView() {
  const { user } = useAuth();
  const { csChats, sendCsMessage, markCsRead, deleteCsChat } = useStore();

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "resolved">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter threads based on search and tab
  const filteredThreads = useMemo(() => {
    return csChats
      .filter((thread) => {
        // Tab filter
        if (filterTab === "unread" && !thread.unreadByAdmin) return false;
        if (filterTab === "resolved" && thread.status !== "resolved") return false;
        if (filterTab === "all" && thread.status === "resolved") return false;

        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchName = thread.customerName.toLowerCase().includes(q);
        const matchLastMsg = thread.lastMessage.toLowerCase().includes(q);
        return matchName || matchLastMsg;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [csChats, filterTab, searchQuery]);

  // Compute active selected thread id cleanly without calling setState in an effect
  const effectiveSelectedId = selectedThreadId || (filteredThreads[0]?.id ?? null);

  // Get active selected thread
  const activeThread = useMemo(() => {
    if (!effectiveSelectedId) return null;
    return csChats.find((t) => t.id === effectiveSelectedId) || null;
  }, [csChats, effectiveSelectedId]);

  // Mark thread read by admin when selected
  useEffect(() => {
    if (activeThread && activeThread.unreadByAdmin) {
      markCsRead(activeThread.id, "admin");
    }
  }, [activeThread, markCsRead]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  const handleSendReply = async (textToSend?: string) => {
    const text = (textToSend || replyText).trim();
    if (!text || !activeThread || isSending) return;

    setIsSending(true);
    setReplyText("");

    try {
      await sendCsMessage(
        activeThread.id,
        text,
        "admin",
        user?.name || "Admin HaiLai",
        { customerName: activeThread.customerName }
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendReply();
    }
  };

  const handleDelete = (threadId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus riwayat chat pelanggan ini?")) {
      deleteCsChat(threadId);
      if (selectedThreadId === threadId) {
        setSelectedThreadId(null);
      }
    }
  };

  const unreadCount = csChats.filter((t) => t.unreadByAdmin).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Top Banner */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">
              Customer Support Center
            </span>
          </div>
          <h2 className="text-xl font-black text-white sm:text-2xl">
            Pusat Bantuan &amp; Chat CS Pelanggan
          </h2>
          <p className="mt-1 text-xs text-stone-300 max-w-xl">
            Terima, pantau, dan balas pesan bantuan pelanggan secara langsung. Tidak menggunakan bot,
            sehingga respon dipastikan personal dan akurat dari Admin toko.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
            <p className="text-2xl font-black text-amber-300">{csChats.length}</p>
            <p className="text-[11px] font-medium text-stone-300">Total Percakapan</p>
          </div>
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center">
            <p className="text-2xl font-black text-rose-400">{unreadCount}</p>
            <p className="text-[11px] font-medium text-rose-200">Belum Dibalas</p>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm lg:grid-cols-12 lg:h-[650px]">
        {/* Left Sidebar: Threads List */}
        <div className="flex flex-col border-b border-stone-200 lg:col-span-4 lg:border-b-0 lg:border-r">
          {/* Search & Tabs */}
          <div className="border-b border-stone-200 p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pelanggan atau pesan..."
                className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-3.5 text-xs font-medium text-stone-800 placeholder-stone-400 transition focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-bold text-stone-600">
              <button
                onClick={() => setFilterTab("all")}
                className={`flex-1 rounded-lg py-1.5 transition ${
                  filterTab === "all" ? "bg-white text-stone-900 shadow-sm" : "hover:text-stone-900"
                }`}
              >
                Aktif ({csChats.filter((t) => t.status !== "resolved").length})
              </button>
              <button
                onClick={() => setFilterTab("unread")}
                className={`flex-1 rounded-lg py-1.5 transition ${
                  filterTab === "unread" ? "bg-white text-rose-600 shadow-sm" : "hover:text-stone-900"
                }`}
              >
                Perlu Balasan ({unreadCount})
              </button>
            </div>
          </div>

          {/* Threads Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 max-h-[320px] lg:max-h-none">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 text-stone-300" />
                <p className="text-xs font-bold">Tidak ada percakapan</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Chat dari pelanggan akan masuk di sini secara otomatis.
                </p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = thread.id === effectiveSelectedId;
                const isUnread = Boolean(thread.unreadByAdmin);
                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`flex w-full items-start gap-3 p-4 text-left transition ${
                      isSelected
                        ? "bg-amber-50/80 border-l-4 border-amber-600"
                        : isUnread
                          ? "bg-rose-50/50 hover:bg-stone-50"
                          : "hover:bg-stone-50"
                    }`}
                  >
                    {/* Customer Avatar */}
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 font-black text-white shadow-sm">
                      {thread.customerName.charAt(0).toUpperCase()}
                      {isUnread && (
                        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                          <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-rose-600 ring-2 ring-white" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <p
                          className={`truncate text-xs ${
                            isUnread ? "font-black text-stone-900" : "font-extrabold text-stone-800"
                          }`}
                        >
                          {thread.customerName}
                        </p>
                        <span className="text-[10px] text-stone-400 shrink-0 font-medium">
                          {new Date(thread.updatedAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p
                        className={`truncate text-xs leading-relaxed ${
                          isUnread ? "font-bold text-stone-800" : "text-stone-500"
                        }`}
                      >
                        {thread.lastSenderRole === "admin" && (
                          <span className="font-bold text-amber-700">Anda: </span>
                        )}
                        {thread.lastMessage || "Membuka obrolan..."}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        {isUnread && (
                          <span className="rounded-full bg-rose-500 px-2 py-0.2 text-[9px] font-black text-white">
                            Pesan Baru
                          </span>
                        )}
                        {thread.lastSenderRole === "admin" && !isUnread && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                            <CheckCheck className="h-3 w-3" />
                            Terbalas
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Selected Chat Transcript & Reply */}
        <div className="flex flex-col lg:col-span-8 bg-stone-50/50">
          {activeThread ? (
            <>
              {/* Active Header */}
              <div className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 font-black text-white shadow">
                    {activeThread.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-stone-800">
                        {activeThread.customerName}
                      </h3>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Pelanggan Terhubung
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      ID Percakapan: <span className="font-mono">{activeThread.id}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(activeThread.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                    title="Hapus riwayat chat ini"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeThread.messages.map((msg) => {
                  const isAdmin = msg.senderRole === "admin";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-stone-400">
                        {isAdmin ? (
                          <>
                            <span className="text-amber-800 font-extrabold">
                              Anda ({msg.senderName || "Admin"})
                            </span>
                            <Headphones className="h-3 w-3 text-amber-600" />
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 text-stone-500" />
                            <span className="text-stone-700 font-bold">{msg.senderName}</span>
                          </>
                        )}
                      </div>
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                          isAdmin
                            ? "rounded-tr-none bg-gradient-to-r from-stone-800 to-amber-950 text-white"
                            : "rounded-tl-none border border-stone-200 bg-white text-stone-800"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-stone-400">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isAdmin && <CheckCheck className="h-3 w-3 text-emerald-600" />}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Template Replies */}
              <div className="border-t border-stone-200 bg-white px-6 pt-3 pb-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Template Balasan Cepat:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ADMIN_QUICK_REPLIES.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => void handleSendReply(reply)}
                      disabled={isSending}
                      className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-700 transition hover:border-amber-300 hover:bg-amber-50 active:scale-95 disabled:opacity-50"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Box */}
              <div className="bg-white p-6 pt-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSendReply();
                  }}
                  className="flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Tulis balasan langsung ke ${activeThread.customerName}...`}
                    disabled={isSending}
                    className="flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs font-medium text-stone-800 placeholder-stone-400 transition focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSending}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3 text-xs font-black text-white shadow-md transition hover:opacity-90 active:scale-95 disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                    <span>Kirim Balasan</span>
                  </button>
                </form>
                <p className="mt-2 text-[10px] text-stone-400">
                  Tekan <strong>Enter</strong> untuk mengirim balasan • Balasan langsung terkirim secara real-time ke perangkat pelanggan
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-stone-400">
              <Headphones className="mb-3 h-12 w-12 text-stone-300" />
              <h4 className="text-sm font-extrabold text-stone-700">Pilih Percakapan Pelanggan</h4>
              <p className="mt-1 text-xs text-stone-400 max-w-sm">
                Pilih salah satu chat pelanggan dari panel kiri untuk membaca dan membalas pertanyaan atau keluhan mereka.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
