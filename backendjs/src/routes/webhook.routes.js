const express = require("express");
const router = express.Router();
const baziCalculator = require("../bazi/calculator");
const openRouterService = require("../services/openrouter.service");
const { formatOutput } = require("../bazi/output");
const { calculateDaiVan } = require("../bazi/dayun");

// ─── Danh sách các client đang kết nối SSE ────────────────────────────────
let sseClients = [];

// ─── SSE Endpoint cho Frontend kết nối ─────────────────────────────────────
router.get("/stream", (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Tắt buffer cho proxy như Nginx
  res.flushHeaders(); // Establish SSE Connection

  // Giữ kết nối bằng cách gửi ping mỗi 30s
  const interval = setInterval(() => {
    res.write(':ping\n\n');
    if (res.flush) res.flush(); // Ép compression middleware nhả data ra ngay
  }, 30000);

  sseClients.push(res);

  req.on('close', () => {
    clearInterval(interval);
    sseClients = sseClients.filter(client => client !== res);
  });
});

// ─── Giờ sinh map (tên giờ → giờ số) ────────────────────────────────────────
const GIO_MAP = {
  tý: 0,
  sửu: 1,
  dần: 3,
  mão: 5,
  thìn: 7,
  tị: 9,
  ngọ: 11,
  mùi: 13,
  thân: 15,
  dậu: 17,
  tuất: 19,
  hợi: 21,
};

// ─── Parse bình luận TikTok ──────────────────────────────────────────────────
const parseComment = (comment) => {
  const text = String(comment ?? "").trim();
  const lower = text.toLowerCase();

  // ── Ngày tháng năm sinh: hỗ trợ / - . làm dấu phân cách, chấp nhận năm 2 chữ số ──
  const dateMatch = text.match(
    /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/,
  );
  if (!dateMatch) return null;

  const parts = dateMatch[0].split(/[\/\-\.]/);
  let year, month, day;
  if (parts[0].length === 4) {
    [year, month, day] = parts.map(Number);
  } else {
    [day, month, year] = parts.map(Number);
    // Nếu năm chỉ có 2 chữ số (ví dụ: 06, 90)
    if (year < 100) {
      // Cutoff 40: 00-40 -> 2000-2040, 41-99 -> 1941-1999
      year += year <= 40 ? 2000 : 1900;
    }
  }

  // ── Giới tính: tìm bất kỳ đâu trong comment ──────────────────────────────
  const isFemale =
    /\bnu\b|nữ|female|con gái|girl/i.test(lower) && !/nam mệnh/i.test(lower);
  const gender = isFemale ? "Nữ" : "Nam";

  // ── Giờ sinh: TÙY CHỌN — mặc định giờ Ngọ (12) nếu không đề cập ─────────
  let hour = 12; // Giờ Ngọ ~ ban ngày, hợp lý khi không biết giờ
  for (const [name, val] of Object.entries(GIO_MAP)) {
    // Chỉ khớp nếu có từ "giờ" đứng trước, tránh false-positive
    if (
      lower.includes(`giờ ${name}`) ||
      lower.includes(`gio ${name}`) ||
      lower.includes(`g.${name}`) ||
      (new RegExp(`\\b${name}\\b`).test(lower) && lower.includes("giờ"))
    ) {
      hour = val;
      break;
    }
  }

  // ── Trích xuất câu hỏi: loại bỏ các token đã nhận dạng ──────────────────
  let questionText = text
    // Xóa ngày sinh
    .replace(dateMatch[0], "")
    // Xóa "giờ [tên giờ]" hoặc "gio [tên]"
    .replace(/g(?:iờ|io|\.)\s*\w+/gi, "")
    // Xóa giới tính đứng độc lập
    .replace(/\b(nam|nữ|nu|female|male|con gái|con trai)\b/gi, "")
    // Xóa từ đệm đầu câu
    .replace(
      /\b(sinh|hỏi|hoi|cho hỏi|xin hỏi|muốn biết|cho biết|về|ve|ạ|a)\b/gi,
      "",
    )
    // Dọn dấu câu/khoảng trắng thừa
    .replace(/^[\s,\.\-:;]+|[\s,\.\-:;]+$/g, "")
    .replace(/[\s,\.\-:;]{2,}/g, " ")
    .trim();

  // Nếu câu hỏi quá ngắn (< 5 ký tự) → fallback về tổng quát
  if (!questionText || questionText.length < 5) {
    questionText = "Tổng quát lá số Bát Tự của tôi";
  }

  // ── Lấy Tên thật từ bình luận (phần chữ trước ngày sinh) ──
  let parsedName = null;
  if (dateMatch && dateMatch.index > 0) {
      const textPrefix = text.substring(0, dateMatch.index).trim();
      // dọn dẹp các từ dạo đầu
      let prefixClean = textPrefix.replace(/^(xin chào|chào thầy|cho hỏi|xin hỏi|thầy xem giúp|xem giúp|xem giùm|xem hộ|giúp em|bạn ơi|cho e hỏi)\s+/gi, '').trim();
      // xóa đuôi "nam", "nữ"
      prefixClean = prefixClean.replace(/\s+(nam|nữ|nu|male|female)$/gi, '').trim();
      // xóa dấu câu thừa 
      prefixClean = prefixClean.replace(/^[,.\-]+|[,.\-]+$/g, '').trim();
      
      if (prefixClean.length >= 2 && prefixClean.length <= 35) {
          // Chuẩn hoá viết hoa chữ cái đầu
          parsedName = prefixClean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
  }

  return {
    name: parsedName,
    year,
    month,
    day,
    hour,
    gender,
    isFemale,
    questionText,
    original: text,
  };
};

// ─── Làm sạch text cho TTS ──────────────────────────────────────────────────
const cleanForTTS = (text) => {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **bold** → plain
    .replace(/\*([^*]+)\*/g, "$1") // *italic* → plain
    .replace(/#{1,6}\s*/g, "") // headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/^\s*\d+\.\s+/gm, "") // 1. 2. numbered lists
    .replace(/^\s*[-•*]\s+/gm, "") // list bullets
    .replace(/\n{3,}/g, "\n\n")
    .replace(/---+/g, "") // hrules
    .replace(/\s{2,}/g, " ") // dọn khoảng trắng thừa
    .trim();
};

/**
 * Tách đoạn văn thành các phần ngắn hơn nếu cần,
 * trả về mảng string sạch cho TTS.
 */
const splitAndClean = (rawParagraphs) => {
  const results = [];
  for (const para of rawParagraphs) {
    const cleaned = cleanForTTS(String(para ?? ""));
    if (!cleaned) continue;
    
    // Luôn tách thành từng câu tại các dấu ngắt câu để trả về mảng các câu ngắn, 
    // giúp stream/gọi API TTS nhanh hơn thay vì chờ cả một đoạn dài.
    const parts = cleaned.split(/(?<=[.!?…])\s+/);
    for (const p of parts) {
      const pt = p.trim();
      if (pt) results.push(pt);
    }
  }
  return results.filter(Boolean);
};

// ─── POST /api/webhook/tiktok-live ───────────────────────────────────────────
router.post("/tiktok-live", async (req, res) => {
  try {
    const { comment, sessionId, displayname } = req.body;
    const sid = String(sessionId || "unknown").slice(0, 8);
    const userName = displayname || "Mệnh chủ";

    // Log body để debug
    console.log(`[Webhook] [${sid}] Request Body:`, req.body);

    // Ping / test kết nối — trả về greeting nhanh, không cần AI
    if (!comment || !comment.trim()) {
      console.log(`[Webhook] [${sid}] Body trống hoặc không parse được.`);
      const cleanName = userName.replace(/[._]/g, " ");
      return res.json([
        `Chào bạn ${cleanName}, hệ thống Huyền Cơ Bát Tự đã sẵn sàng. Bạn hãy gửi ngày tháng năm sinh để được luận giải nhé!`,
      ]);
    }

    // Parse bình luận
    const parsed = parseComment(comment);
    if (!parsed) {
      console.log(
        `[Webhook] [${sid}] Không parse được ngày sinh từ: "${comment.slice(0, 60)}"`,
      );
      const cleanName = userName.replace(/[._]/g, " ");
      return res.json([
        `Bạn ${cleanName} ơi, Huyền Cơ chưa tìm thấy thông tin ngày sinh trong bình luận của bạn. Vui lòng gửi lại theo dạng: ngày sinh sẹt tháng sinh sẹt năm sinh bạn nhé. (Ví dụ: 19 sẹt 05 sẹt 2003)`,
      ]);
    }

    console.log(
      `[Webhook] [${sid}] Parsed: Tên: ${parsed.name || userName} | ${parsed.day}/${parsed.month}/${parsed.year} | ${parsed.gender} | Câu hỏi: "${parsed.questionText}"`,
    );

    // ── Tính lá số Bát Tự ──
    const calc = new baziCalculator({
      name: parsed.name || userName,
      year: parsed.year,
      month: parsed.month,
      day: parsed.day,
      hour: parsed.hour,
      minute: 0,
      isFemale: parsed.isFemale,
      isSolar: true,
    });

    const ctx = calc.calculate();
    const fullOutput = formatOutput(ctx);
    const daiVanData = calculateDaiVan(ctx);

    // ── Build context cho AI ──
    const baziContext = {
      thong_tin_co_ban: fullOutput.thong_tin_co_ban,
      chi_tiet_tru: fullOutput.chi_tiet_tru,
      phan_tich: fullOutput.phan_tich,
    };
    const luckCyclesData = { dai_van: daiVanData };

    // ── Gọi AI ──
    const answerData = await openRouterService.generateAnswer(
      baziContext,
      luckCyclesData,
      parsed.questionText,
      "huyen_co",
      null,
      userName,
    );

    // ── Format câu trả lời cho TTS ──
    const rawParagraphs = Array.isArray(answerData?.answer)
      ? answerData.answer
      : [String(answerData?.answer ?? answerData ?? "")];
    const texts = splitAndClean(rawParagraphs);

    if (texts.length > 0) {
      const cleanName = userName.replace(/[._]/g, " ");
      // Thêm lời chào và cảm ơn vào đầu danh sách phát TTS
      texts.unshift(`Bạn ${cleanName} ơi, cảm ơn bạn đã xem live của thầy nhé.`);
      // Thêm lời kết thúc vào cuối danh sách phát TTS
      texts.push(`Nếu bạn có thắc mắc gì thêm thì hãy để lại thêm bình luận bên dưới để thầy giải đáp thêm nhé!`);
    }

    console.log(`[Webhook] [${sid}] Trả về ${texts.length} đoạn văn.`);

    // ── Phát sự kiện (SSE) tới Frontend để hiển thị tự động ──
    if (sseClients.length > 0) {
      const uiData = {
        name: parsed.name || userName,
        year: parsed.year,
        month: parsed.month,
        day: parsed.day,
        hour: parsed.hour,
        gender: parsed.gender,
        isFemale: parsed.isFemale,
        question: parsed.questionText,
        answer: rawParagraphs.join('\n\n') // Nguyên bản nội dung AI sinh ra
      };
      sseClients.forEach(client => {
        try {
          client.write(`data: ${JSON.stringify(uiData)}\n\n`);
          // Ép thư viện compression nhả từng chunk ra ngay lập tức
          if (client.flush) {
              client.flush();
          }
        } catch(e) {
           // ignore write error
        }
      });
      console.log(`[Webhook] [${sid}] Đã phát SSE tới ${sseClients.length} clients.`);
    }

    return res.json(texts);
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return res.status(500).json([`Lỗi Server: ${error.message}`]);
  }
});

module.exports = router;
