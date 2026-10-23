import { register, untilRight, choiceButtons } from "./frame.js";
import { T } from "../i18n.js";
import { pic } from "../art.js";
import { el, wait } from "../util.js";
import { settings } from "../state.js";

let styled = false;
function style() {
  if (styled) return;
  styled = true;
  document.head.appendChild(el("style", "", `
.rd2-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 12px; width: 100%; max-width: 600px; margin: 0 auto; }
.rd2-row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; align-items: center; }
.rd2-box { background: rgba(255, 255, 255, 0.92); border: 2px solid #3b2a4f; border-radius: 18px; padding: 12px 18px; font-size: clamp(20px, 4vw, 28px); font-weight: 800; color: #2e1d42; text-align: center; box-shadow: 0 4px 0 rgba(0, 0, 0, 0.15); }
.rd2-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 120px; min-height: 48px; padding: 8px 16px; border-radius: 16px; border: 2px solid #3b2a4f; background: #ffffff; color: #2e1d42; font-size: clamp(16px, 3.5vw, 20px); font-weight: 800; cursor: pointer; box-shadow: 0 4px 0 rgba(0, 0, 0, 0.18); }
.gl.little .rd2-btn { min-width: 140px; min-height: 64px; font-size: 20px; }
.rd2-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 rgba(0, 0, 0, 0.18); }
.rd2-art { display: inline-flex; width: 36px; height: 36px; }
.gl.little .rd2-art { width: 44px; height: 44px; }
.rd2-art svg { width: 100%; height: 100%; }
`));
}

const isVi = () => settings.lang === "vi";

register({
  id: "rd_blend",
  icon: "🔤",
  name: () => T("Blend the Sounds", "Ghép Âm"),
  async run(api) {
    style();
    const rounds = 3;
    api.dots(rounds, 0);

    api.say(
      "Listen and blend the sounds into a whole word!",
      "Lắng nghe và ghép các âm thành một từ hoàn chỉnh nhé!"
    );

    const pairs = [
      { en: "c - a - t -> cat", vi: "c - a -> ca", art: "🐱" },
      { en: "s - u - n -> sun", vi: "b - a -> ba", art: "☀️" },
      { en: "p - i - g -> pig", vi: "g - a -> gà", art: "🐷" }
    ];

    const wrap = el("div", "rd2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const curr = pairs[r];
      const prompt = isVi() ? curr.vi : curr.en;
      const box = el("div", "rd2-box", `<span class="rd2-art">${pic(curr.art)}</span> ${prompt}`);
      wrap.appendChild(box);

      const row = el("div", "rd2-row");
      wrap.appendChild(row);

      const btn = el("button", "rd2-btn", `<span class="rd2-art">${pic("🔤")}</span> ${T("Blend Word", "Ghép Từ")}`);
      row.appendChild(btn);

      await untilRight(api, [btn], () => true);
      if (api.closed) return;
      api.sfx.pop();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Sounds blended!", "Ghép âm chuẩn xác!") });
  }
});

register({
  id: "rd_hats",
  icon: "🎩",
  name: () => T("Vowel Hats", "Mũ Cho Chữ"),
  async run(api) {
    style();
    const rounds = 3;
    api.dots(rounds, 0);

    api.say(
      "Give the right little hat to each vowel letter!",
      "Đội chiếc mũ xinh cho đúng từng chữ cái nhé!"
    );

    const hats = [
      { base: "a", withHat: "â", label: T("Add hat to make â", "Đội mũ thành chữ â") },
      { base: "e", withHat: "ê", label: T("Add hat to make ê", "Đội mũ thành chữ ê") },
      { base: "o", withHat: "ô", label: T("Add hat to make ô", "Đội mũ thành chữ ô") }
    ];

    const wrap = el("div", "rd2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const curr = hats[r];
      const box = el("div", "rd2-box", `<span class="rd2-art">${pic("🎩")}</span> ${curr.base} ➔ ${curr.withHat}`);
      wrap.appendChild(box);

      const row = el("div", "rd2-row");
      wrap.appendChild(row);

      const btn = el("button", "rd2-btn", `<span class="rd2-art">${pic("🎩")}</span> ${curr.label}`);
      row.appendChild(btn);

      await untilRight(api, [btn], () => true);
      if (api.closed) return;
      api.sfx.pop();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Hats fitted!", "Đội mũ hoàn hảo!") });
  }
});

register({
  id: "rd_endings",
  icon: "🔚",
  name: () => T("Word Endings", "Vần Cuối"),
  async run(api) {
    style();
    const rounds = 3;
    api.dots(rounds, 0);

    api.say(
      "Tap the matching ending to complete the rhyming family!",
      "Chạm vào vần cuối để hoàn thiện từ nhé!"
    );

    const endings = [
      { start: "c", end: "at", word: "cat", art: "🐱" },
      { start: "b", end: "ed", word: "bed", art: "🛏️" },
      { start: "p", end: "ig", word: "pig", art: "🐷" }
    ];

    const wrap = el("div", "rd2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const curr = endings[r];
      const box = el("div", "rd2-box", `<span class="rd2-art">${pic(curr.art)}</span> ${curr.start} + ___ = ${curr.word}`);
      wrap.appendChild(box);

      const row = el("div", "rd2-row");
      wrap.appendChild(row);

      const btn = el("button", "rd2-btn", `<span class="rd2-art">${pic("🔚")}</span> -${curr.end}`);
      row.appendChild(btn);

      await untilRight(api, [btn], () => true);
      if (api.closed) return;
      api.sfx.pop();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Endings found!", "Tìm đúng vần cuối!") });
  }
});

register({
  id: "rd_compound",
  icon: "🧩",
  name: () => T("Two Words Make One", "Ghép Hai Từ"),
  async run(api) {
    style();
    const rounds = 3;
    api.dots(rounds, 0);

    api.say(
      "Join two smaller words together to make a new one!",
      "Ghép hai từ nhỏ thành một từ ghép mới nào!"
    );

    const compounds = [
      { part1: "sun", part2: "flower", full: "sunflower", art: "🌻", vi: "hoa + hướng dương" },
      { part1: "rain", part2: "bow", full: "rainbow", art: "🌈", vi: "cầu + vồng" },
      { part1: "star", part2: "fish", full: "starfish", art: "⭐", vi: "sao + biển" }
    ];

    const wrap = el("div", "rd2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const curr = compounds[r];
      const label = isVi() ? curr.vi : `${curr.part1} + ${curr.part2} = ${curr.full}`;
      const box = el("div", "rd2-box", `<span class="rd2-art">${pic(curr.art)}</span> ${label}`);
      wrap.appendChild(box);

      const row = el("div", "rd2-row");
      wrap.appendChild(row);

      const btn = el("button", "rd2-btn", `<span class="rd2-art">${pic("🧩")}</span> ${T("Snap Together", "Ghép Lại")}`);
      row.appendChild(btn);

      await untilRight(api, [btn], () => true);
      if (api.closed) return;
      api.sfx.pop();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Compounds made!", "Ghép từ thành công!") });
  }
});

register({
  id: "rd_labels",
  icon: "🏷️",
  name: () => T("Label the Picture", "Gắn Tên Cho Tranh"),
  async run(api) {
    style();
    const rounds = 3;
    api.dots(rounds, 0);

    api.say(
      "Stick the right label onto the picture!",
      "Gắn đúng nhãn chữ vào bức tranh nhé!"
    );

    const labels = [
      { art: "🍎", en: "Apple", vi: "Quả Táo" },
      { art: "🐶", en: "Dog", vi: "Con Chó" },
      { art: "☀️", en: "Sun", vi: "Mặt Trời" }
    ];

    const wrap = el("div", "rd2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const curr = labels[r];
      const box = el("div", "rd2-box", `<span class="rd2-art">${pic(curr.art)}</span> ${T(curr.en, curr.vi)}`);
      wrap.appendChild(box);

      const row = el("div", "rd2-row");
      wrap.appendChild(row);

      const btn = el("button", "rd2-btn", `<span class="rd2-art">${pic("🏷️")}</span> ${T("Stick Label", "Gắn Nhãn")}`);
      row.appendChild(btn);

      await untilRight(api, [btn], () => true);
      if (api.closed) return;
      api.sfx.pop();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("All pictures labeled!", "Đã gắn xong nhãn tranh!") });
  }
});

register({
  id: "rd_signs",
  icon: "🛑",
  name: () => T("Signs in Town", "Biển Báo Trong Phố"),
  async run(api) {
    style();
    const rounds = 3;
    api.dots(rounds, 0);

    api.say(
      "Read the town signs to know what to do!",
      "Đọc biển báo trên đường để biết chỉ dẫn nhé!"
    );

    const signs = [
      { sign: "STOP", vi: "DỪNG LẠI", art: "🛑" },
      { sign: "BUS STOP", vi: "TRẠM XE BUÝT", art: "🚌" },
      { sign: "LIBRARY", vi: "THƯ VIỆN", art: "📖" }
    ];

    const wrap = el("div", "rd2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const curr = signs[r];
      const text = isVi() ? curr.vi : curr.sign;
      const box = el("div", "rd2-box", `<span class="rd2-art">${pic(curr.art)}</span> [ ${text} ]`);
      wrap.appendChild(box);

      const row = el("div", "rd2-row");
      wrap.appendChild(row);

      const btn = el("button", "rd2-btn", `<span class="rd2-art">${pic("🛑")}</span> ${T("Read Sign", "Đọc Biển")}`);
      row.appendChild(btn);

      await untilRight(api, [btn], () => true);
      if (api.closed) return;
      api.sfx.pop();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Signs read safely!", "Đọc biển báo rất chuẩn!") });
  }
});

register({
  id: "rd_questions",
  icon: "❓",
  name: () => T("Who, What, Where", "Ai, Gì, Ở Đâu"),
  async run(api) {
    style();
    const rounds = 3;
    api.dots(rounds, 0);

    api.say(
      "Answer the question words: Who, What, Where!",
      "Trả lời câu hỏi: Ai, Cái gì, Ở đâu nhé!"
    );

    const questions = [
      { q: T("Who is reading? -> The Cat", "Ai đang đọc sách? -> Bạn Mèo"), art: "🐱" },
      { q: T("What is shining? -> The Sun", "Cái gì đang chiếu sáng? -> Mặt Trời"), art: "☀️" },
      { q: T("Where is the nest? -> In the Tree", "Tổ chim ở đâu? -> Trên Cây"), art: "🌳" }
    ];

    const wrap = el("div", "rd2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const curr = questions[r];
      const box = el("div", "rd2-box", `<span class="rd2-art">${pic(curr.art)}</span> ${curr.q}`);
      wrap.appendChild(box);

      const row = el("div", "rd2-row");
      wrap.appendChild(row);

      const btn = el("button", "rd2-btn", `<span class="rd2-art">${pic("❓")}</span> ${T("Answer", "Trả Lời")}`);
      row.appendChild(btn);

      await untilRight(api, [btn], () => true);
      if (api.closed) return;
      api.sfx.pop();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Questions answered!", "Đã trả lời xong các câu hỏi!") });
  }
});

register({
  id: "rd_many",
  icon: "🔢",
  name: () => T("One and Many", "Một và Nhiều"),
  async run(api) {
    style();
    const rounds = 3;
    api.dots(rounds, 0);

    api.say(
      "See the difference between one item and many items!",
      "Nhận biết sự khác biệt giữa một và nhiều nhé!"
    );

    const pairs = [
      { one: T("1 Apple", "1 Quả Táo"), many: T("Many Apples", "Nhiều Quả Táo"), art: "🍎" },
      { one: T("1 Star", "1 Ngôi Sao"), many: T("Many Stars", "Nhiều Ngôi Sao"), art: "⭐" },
      { one: T("1 Fish", "1 Con Cá"), many: T("Many Fish", "Nhiều Con Cá"), art: "🐟" }
    ];

    const wrap = el("div", "rd2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const curr = pairs[r];
      const box = el("div", "rd2-box", `<span class="rd2-art">${pic(curr.art)}</span> ${curr.one} ➔ ${curr.many}`);
      wrap.appendChild(box);

      const row = el("div", "rd2-row");
      wrap.appendChild(row);

      const btn = el("button", "rd2-btn", `<span class="rd2-art">${pic("🔢")}</span> ${T("Count Many", "Đếm Nhiều")}`);
      row.appendChild(btn);

      await untilRight(api, [btn], () => true);
      if (api.closed) return;
      api.sfx.pop();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("One and many sorted!", "Phân biệt một và nhiều thật tài!") });
  }
});

register({
  id: "rd_caps",
  icon: "🔠",
  name: () => T("Big and Small Letters", "Chữ Hoa Chữ Thường"),
  async run(api) {
    style();
    const rounds = 3;
    api.dots(rounds, 0);

    api.say(
      "Match the big capital letter to its small partner!",
      "Ghép chữ cái hoa với chữ cái thường tương ứng!"
    );

    const pairs = [
      { big: "A", small: "a" },
      { big: "B", small: "b" },
      { big: "C", small: "c" }
    ];

    const wrap = el("div", "rd2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const curr = pairs[r];
      const box = el("div", "rd2-box", `<span class="rd2-art">${pic("🔠")}</span> ${curr.big} ➔ ${curr.small}`);
      wrap.appendChild(box);

      const row = el("div", "rd2-row");
      wrap.appendChild(row);

      const btn = el("button", "rd2-btn", `<span class="rd2-art">${pic("🔤")}</span> ${curr.big} & ${curr.small}`);
      row.appendChild(btn);

      await untilRight(api, [btn], () => true);
      if (api.closed) return;
      api.sfx.pop();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Letters paired!", "Ghép chữ hoa chữ thường chuẩn!") });
  }
});

register({
  id: "rd_poem",
  icon: "📜",
  name: () => T("Read a Little Poem", "Đọc Bài Thơ Nhỏ"),
  async run(api) {
    style();
    const lines = [
      T("Twinkle little star above,", "Ngôi sao lấp lánh trên cao,"),
      T("Shining with a heart of love.", "Gửi ngàn tia nắng ngọt ngào cho em.")
    ];
    const rounds = lines.length;
    api.dots(rounds, 0);

    api.say(
      "Listen and read the sweet little rhyme line by line!",
      "Lắng nghe và đọc từng câu thơ êm ái nhé!"
    );

    const wrap = el("div", "rd2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const box = el("div", "rd2-box", `<span class="rd2-art">${pic("📜")}</span> ${lines[r]}`);
      wrap.appendChild(box);

      const row = el("div", "rd2-row");
      wrap.appendChild(row);

      const btn = el("button", "rd2-btn", `<span class="rd2-art">${pic("⭐")}</span> ${T("Read Line", "Đọc Câu Thơ")}`);
      row.appendChild(btn);

      await untilRight(api, [btn], () => true);
      if (api.closed) return;
      api.sfx.pop();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Poem recited!", "Đọc xong bài thơ nhỏ!") });
  }
});

register({
  id: "rd_missing",
  icon: "🈳",
  name: () => T("Missing Letter", "Điền Chữ Còn Thiếu"),
  async run(api) {
    style();
    const rounds = 3;
    api.dots(rounds, 0);

    api.say(
      "Fill in the missing letter to complete the puzzle word!",
      "Điền chữ cái còn thiếu để hoàn thiện từ nhé!"
    );

    const missingItems = [
      { shown: "c _ t", missing: "a", word: "cat", art: "🐱" },
      { shown: "s _ n", missing: "u", word: "sun", art: "☀️" },
      { shown: "b _ d", missing: "e", word: "bed", art: "🛏️" }
    ];

    const wrap = el("div", "rd2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const curr = missingItems[r];
      const box = el("div", "rd2-box", `<span class="rd2-art">${pic(curr.art)}</span> ${curr.shown} ➔ [ ${curr.word} ]`);
      wrap.appendChild(box);

      const row = el("div", "rd2-row");
      wrap.appendChild(row);

      const btn = el("button", "rd2-btn", `<span class="rd2-art">${pic("🈳")}</span> ${T("Insert", "Điền")} '${curr.missing}'`);
      row.appendChild(btn);

      await untilRight(api, [btn], () => true);
      if (api.closed) return;
      api.sfx.pop();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Missing letters filled!", "Điền chữ còn thiếu chuẩn xác!") });
  }
});

register({
  id: "rd_book",
  icon: "📖",
  name: () => T("Make a Little Book", "Làm Sách Nhỏ"),
  async run(api) {
    style();
    const pages = [
      { art: "☀️", text: T("Page 1: The sun rises.", "Trang 1: Mặt trời thức giấc.") },
      { art: "🐱", text: T("Page 2: The kitten plays.", "Trang 2: Chú mèo con vui đùa.") },
      { art: "🌙", text: T("Page 3: Sleep under the moon.", "Trang 3: Bé ngủ ngon dưới trăng.") }
    ];
    const rounds = pages.length;
    api.dots(rounds, 0);

    api.say(
      "Assemble your own little reading book page by page!",
      "Tự tay làm nên cuốn sách nhỏ từng trang một nhé!"
    );

    const wrap = el("div", "rd2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const curr = pages[r];
      const box = el("div", "rd2-box", `<span class="rd2-art">${pic(curr.art)}</span> ${curr.text}`);
      wrap.appendChild(box);

      const row = el("div", "rd2-row");
      wrap.appendChild(row);

      const btn = el("button", "rd2-btn", `<span class="rd2-art">${pic("📖")}</span> ${T("Bind Page", "Đóng Trang")}`);
      row.appendChild(btn);

      await untilRight(api, [btn], () => true);
      if (api.closed) return;
      api.sfx.pop();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Little book complete!", "Cuốn sách nhỏ hoàn thành!") });
  }
});
