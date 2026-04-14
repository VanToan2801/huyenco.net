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
  return { day, month, year };
};

const tests = [
  "19/04/06",
  "19/04/2006",
  "05-12-90",
  "2000.01.01",
  "Sinh 15/08/88 nữ",
  "Hỏi về 02/03/95",
  "01/01/00",
  "01/01/26",
  "01/01/40",
  "01/01/41",
];

tests.forEach(t => {
  console.log(`Input: "${t}" -> Parsed:`, parseComment(t));
});
