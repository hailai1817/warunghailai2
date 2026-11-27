// Helper AI Bot CS untuk HaiLai's Bakery
// Menyediakan respon otomatis saat admin sibuk/offline dan saran balasan profesional

export type CsCustomerIntent =
  | "stok"
  | "pembayaran"
  | "pesanan"
  | "komplain"
  | "lokasi_jam"
  | "custom_cake"
  | "salam"
  | "umum";

export interface QuickReplyTemplate {
  id: string;
  label: string;
  category: string;
  iconName: string;
  generateText: (customerName: string, customerMessage?: string) => string;
}

/**
 * Menganalisis niat / topik pesan pelanggan secara cerdas menggunakan keyword matching
 */
export function analyzeCustomerIntent(message: string): CsCustomerIntent {
  const q = message.toLowerCase().trim();

  // Komplain / kendala
  if (
    q.includes("komplain") ||
    q.includes("kecewa") ||
    q.includes("rusak") ||
    q.includes("basi") ||
    q.includes("alot") ||
    q.includes("keras") ||
    q.includes("salah") ||
    q.includes("kurang") ||
    q.includes("tertukar") ||
    q.includes("dingin") ||
    q.includes("gosong")
  ) {
    return "komplain";
  }

  // Stok / Produk / Varian
  if (
    q.includes("stok") ||
    q.includes("roti") ||
    q.includes("cake") ||
    q.includes("kue") ||
    q.includes("croissant") ||
    q.includes("donat") ||
    q.includes("sisa") ||
    q.includes("habis") ||
    q.includes("ready") ||
    q.includes("rasa") ||
    q.includes("varian") ||
    q.includes("etalase") ||
    q.includes("tersedia")
  ) {
    return "stok";
  }

  // Pembayaran / QRIS / Transaksi
  if (
    q.includes("bayar") ||
    q.includes("qris") ||
    q.includes("transfer") ||
    q.includes("tunai") ||
    q.includes("cash") ||
    q.includes("gopay") ||
    q.includes("ovo") ||
    q.includes("dana") ||
    q.includes("shopeepay") ||
    q.includes("bca") ||
    q.includes("kembalian") ||
    q.includes("nota") ||
    q.includes("struk")
  ) {
    return "pembayaran";
  }

  // Pesanan / Ambil / Pickup
  if (
    q.includes("pesanan") ||
    q.includes("order") ||
    q.includes("ambil") ||
    q.includes("pickup") ||
    q.includes("siap") ||
    q.includes("bungkus") ||
    q.includes("titip") ||
    q.includes("kemas")
  ) {
    return "pesanan";
  }

  // Lokasi / Jam Buka / Alamat
  if (
    q.includes("buka") ||
    q.includes("tutup") ||
    q.includes("jam") ||
    q.includes("alamat") ||
    q.includes("lokasi") ||
    q.includes("jalan") ||
    q.includes("cabang") ||
    q.includes("operasional")
  ) {
    return "lokasi_jam";
  }

  // Custom cake / Pre-order / Ultah
  if (
    q.includes("custom") ||
    q.includes("ulang tahun") ||
    q.includes("ultah") ||
    q.includes("hias") ||
    q.includes("lilin") ||
    q.includes("tart") ||
    q.includes("preorder") ||
    q.includes("pre-order") ||
    q.includes("pesan khusus")
  ) {
    return "custom_cake";
  }

  // Salam / Terima kasih
  if (
    q.includes("halo") ||
    q.includes("hai") ||
    q.includes("pagi") ||
    q.includes("siang") ||
    q.includes("sore") ||
    q.includes("malam") ||
    q.includes("terima kasih") ||
    q.includes("makasih") ||
    q.includes("thank")
  ) {
    return "salam";
  }

  return "umum";
}

/**
 * Menghasilkan pesan balasan otomatis (auto-reply) dari Bot ketika admin sedang sibuk atau tidak aktif
 */
export function generateBotAutoReply({
  customerName,
  customerMessage,
  adminStatus,
  customBusyMessage,
  customOfflineMessage,
}: {
  customerName: string;
  customerMessage: string;
  adminStatus: "online" | "busy" | "offline";
  customBusyMessage?: string;
  customOfflineMessage?: string;
}): string {
  const cleanName = customerName && customerName !== "Pelanggan" ? `kak ${customerName}` : "kak";
  const intent = analyzeCustomerIntent(customerMessage);

  // Jawaban bantuan kontekstual dari bot sesuai topik
  let contextualHint = "";
  switch (intent) {
    case "stok":
      contextualHint =
        "\n\n🍞 *Info Stok Roti & Kue:* Sebagian besar varian roti kami dipanggang segar (fresh from the oven) setiap pagi dan terus kami restock. Kakak juga dapat melihat daftar menu dan ketersediaan langsung di katalog kasir web kami.";
      break;
    case "pembayaran":
      contextualHint =
        "\n\n💳 *Info Pembayaran:* HaiLai's Bakery menerima pembayaran Tunai dan Nontunai via QRIS (semua e-wallet dan m-banking). Kakak cukup melakukan scan pada barcode QRIS yang tersedia saat checkout.";
      break;
    case "pesanan":
      contextualHint =
        "\n\n📦 *Info Pesanan:* Pesanan kakak otomatis masuk ke sistem kami dan sedang disiapkan dengan higienis oleh tim bakery.";
      break;
    case "lokasi_jam":
      contextualHint =
        "\n\n📍 *Jam Operasional & Alamat:* Toko kami buka setiap hari pukul 07.00 - 21.00 WIB di Jl. Melati Raya No. 88, Bandung. Kami tunggu kedatangan kakak!";
      break;
    case "custom_cake":
      contextualHint =
        "\n\n🎂 *Info Custom Cake:* Untuk pemesanan kue ulang tahun khusus, disarankan melakukan konfirmasi H-1 atau H-2 agar tim pastry kami dapat menyiapkan dekorasi terbaik.";
      break;
    case "komplain":
      contextualHint =
        "\n\n🙏 *Perhatian Prioritas:* Mohon maaf atas kendala yang kakak alami. Kami prioritaskan pesan ini agar segera ditinjau langsung oleh Manajer Toko kami.";
      break;
    default:
      contextualHint = "";
      break;
  }

  if (adminStatus === "busy") {
    if (customBusyMessage?.trim()) {
      return `[Respon Otomatis Bot CS]\n${customBusyMessage.trim()}${contextualHint}`;
    }
    return (
      `Halo ${cleanName}! Terima kasih telah menghubungi CS HaiLai's Bakery.\n\n` +
      `Saat ini Admin toko kami sedang *SIBUK* melayani antrean kasir dan pesanan langsung. ` +
      `Pesan ${cleanName} sudah tercatat di sistem kami dan Admin akan segera membalas begitu luang. Mohon ditunggu sebentar ya kak! 🙏` +
      contextualHint
    );
  }

  if (adminStatus === "offline") {
    if (customOfflineMessage?.trim()) {
      return `[Respon Otomatis Bot CS]\n${customOfflineMessage.trim()}${contextualHint}`;
    }
    return (
      `Halo ${cleanName}! Terima kasih telah menghubungi HaiLai's Bakery.\n\n` +
      `Saat ini Admin CS sedang *TIDAK AKTIF / DI LUAR JAM LAYANAN CHAT*. ` +
      `Jam operasional pelayanan toko kami adalah pukul 07.00 - 21.00 WIB. ` +
      `Pesan ${cleanName} tersimpan aman dan akan kami balas segera setelah toko dan tim admin kembali aktif. Terima kasih atas pengertiannya! ✨` +
      contextualHint
    );
  }

  // Jika admin online tapi bot auto-ack aktif
  return (
    `Halo ${cleanName}! Pesan Anda telah kami terima di sistem CS HaiLai's Bakery. ` +
    `Admin kami sedang membaca pesan Anda dan akan segera merespons secara langsung.` +
    contextualHint
  );
}

/**
 * Menghasilkan draft balasan profesional yang dibuat otomatis oleh Bot untuk digunakan oleh Admin
 */
export function generateProfessionalReplySuggestion({
  customerName,
  customerMessage,
  category,
}: {
  customerName: string;
  customerMessage: string;
  category?: string;
}): string {
  const cleanName = customerName && customerName !== "Pelanggan" ? `kak ${customerName}` : "kak";
  const intent = category ? (category as CsCustomerIntent) : analyzeCustomerIntent(customerMessage);

  switch (intent) {
    case "stok":
      return `Halo ${cleanName}, terima kasih sudah menghubungi HaiLai's Bakery! Untuk ketersediaan produk saat ini masih ready dan baru saja selesai dipanggang (fresh from the oven). Apakah ada varian roti atau cake tertentu yang ingin kakak simpan atau siapkan terlebih dahulu?`;

    case "pembayaran":
      return `Baik ${cleanName}, untuk pembayaran di HaiLai's Bakery kami mendukung pembayaran Tunai dan Nontunai melalui QRIS (bisa scan menggunakan semua aplikasi e-wallet seperti GoPay, OVO, Dana, ShopeePay, serta Mobile Banking BCA, Mandiri, dll). Cukup tunjukkan barcode pembayaran ke kasir ya kak.`;

    case "pesanan":
      return `Halo ${cleanName}, pesanan atas nama kakak sudah kami cek di sistem kasir dan saat ini sedang dalam proses penyiapan oleh tim bakery kami dengan higienis. Kami pastikan kualitas dan kemasannya terjaga dengan baik saat kakak ambil ya.`;

    case "komplain":
      return `Halo ${cleanName}, kami memohon maaf yang sebesar-besarnya atas ketidaknyamanan yang kakak alami. Kepuasan dan kenyamanan kakak adalah prioritas utama kami di HaiLai's Bakery. Mohon bantu informasikan nomor pesanan atau foto kendalanya agar tim kami dapat segera memberikan solusi terbaik atau penggantian produk ya kak. 🙏`;

    case "lokasi_jam":
      return `Halo ${cleanName}, HaiLai's Bakery and Cafe buka setiap hari mulai pukul 07.00 hingga 21.00 WIB. Alamat kami berada di Jl. Melati Raya No. 88, Bandung. Kami tunggu kedatangan kakak untuk menikmati aneka roti dan kopi hangat terbaik kami!`;

    case "custom_cake":
      return `Halo ${cleanName}, untuk pemesanan cake khusus (custom cake ulang tahun / perayaan), tim pastry kami siap membantu mewujudkan desain dan tulisan yang kakak inginkan! Mohon informasikan ukuran cake, pilihan rasa (Cokelat, Red Velvet, Matcha, Vanilla), dan tulisan ucapan yang diinginkan ya.`;

    case "salam":
      return `Halo ${cleanName}! Terima kasih banyak sudah berbelanja dan menghubungi HaiLai's Bakery. Semoga hari kakak menyenangkan dan menikmati kelezatan roti kami. Jika ada hal lain yang bisa kami bantu, jangan ragu untuk memberi tahu kami ya! ✨`;

    case "umum":
    default:
      return `Halo ${cleanName}, terima kasih telah menghubungi Customer Service HaiLai's Bakery! Senang sekali bisa membantu kakak hari ini. Ada yang bisa kami bantu lebih lanjut seputar menu roti segar, minuman, atau promo hari ini?`;
  }
}

/**
 * Daftar template saran balasan cepat siap pakai untuk Admin
 */
export const QUICK_SUGGESTION_TEMPLATES: QuickReplyTemplate[] = [
  {
    id: "auto_smart",
    label: "✨ Buat Balasan Otomatis (AI Sesuai Chat)",
    category: "smart",
    iconName: "Sparkles",
    generateText: (name, msg) =>
      generateProfessionalReplySuggestion({
        customerName: name,
        customerMessage: msg || "",
      }),
  },
  {
    id: "stok_fresh",
    label: "🍞 Konfirmasi Stok & Fresh Oven",
    category: "stok",
    iconName: "PackageCheck",
    generateText: (name) =>
      generateProfessionalReplySuggestion({
        customerName: name,
        customerMessage: "stok",
        category: "stok",
      }),
  },
  {
    id: "pembayaran_qris",
    label: "💳 Info Pembayaran & QRIS",
    category: "pembayaran",
    iconName: "CreditCard",
    generateText: (name) =>
      generateProfessionalReplySuggestion({
        customerName: name,
        customerMessage: "bayar",
        category: "pembayaran",
      }),
  },
  {
    id: "konfirmasi_pesanan",
    label: "📦 Konfirmasi & Persiapan Pesanan",
    category: "pesanan",
    iconName: "CheckCircle",
    generateText: (name) =>
      generateProfessionalReplySuggestion({
        customerName: name,
        customerMessage: "pesanan",
        category: "pesanan",
      }),
  },
  {
    id: "maaf_solusi",
    label: "🙏 Solusi Kendala & Maaf Sopan",
    category: "komplain",
    iconName: "HeartHandshake",
    generateText: (name) =>
      generateProfessionalReplySuggestion({
        customerName: name,
        customerMessage: "komplain",
        category: "komplain",
      }),
  },
  {
    id: "jam_alamat",
    label: "📍 Jam Buka & Alamat Toko",
    category: "lokasi_jam",
    iconName: "MapPin",
    generateText: (name) =>
      generateProfessionalReplySuggestion({
        customerName: name,
        customerMessage: "lokasi",
        category: "lokasi_jam",
      }),
  },
  {
    id: "terima_kasih",
    label: "❤️ Penutupan Ramah & Terima Kasih",
    category: "salam",
    iconName: "Smile",
    generateText: (name) =>
      generateProfessionalReplySuggestion({
        customerName: name,
        customerMessage: "terima kasih",
        category: "salam",
      }),
  },
];
