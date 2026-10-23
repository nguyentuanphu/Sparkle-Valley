import { register, untilRight, choiceButtons } from "./frame.js";
import { T } from "../i18n.js";
import { pic } from "../art.js";
import { el, wait } from "../util.js";
import { curCode, fmtMinor, spokenMinor } from "../money.js";
import * as M from "./moneylogic.js";

let styled = false;
function style() {
  if (styled) return;
  styled = true;
  document.head.appendChild(el("style", "", `
.mn2-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 12px; width: 100%; max-width: 600px; margin: 0 auto; }
.mn2-row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; align-items: center; }
.mn2-box { background: rgba(255, 255, 255, 0.92); border: 2px solid #5a3d7a; border-radius: 18px; padding: 12px 18px; font-size: clamp(20px, 4vw, 26px); font-weight: 800; color: #3b2054; text-align: center; box-shadow: 0 4px 0 rgba(90, 60, 120, 0.15); }
.mn2-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 130px; min-height: 48px; padding: 8px 16px; border-radius: 16px; border: 2px solid #5a3d7a; background: #ffffff; color: #2d1845; font-size: clamp(16px, 3.5vw, 20px); font-weight: 800; cursor: pointer; box-shadow: 0 4px 0 rgba(90, 60, 120, 0.2); }
.gl.little .mn2-btn { min-width: 150px; min-height: 64px; font-size: 20px; }
.mn2-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 rgba(90, 60, 120, 0.2); }
.mn2-art { display: inline-flex; width: 36px; height: 36px; }
.gl.little .mn2-art { width: 44px; height: 44px; }
.mn2-art svg { width: 100%; height: 100%; }
`));
}

const getCode = () => M.CODES.includes(curCode()) ? curCode() : "AUD";

register({
  id: "savegoal",
  icon: "🎯",
  name: () => T("Saving Goal", "Mục Tiêu Tiết Kiệm"),
  async run(api) {
    style();
    const code = getCode();
    const target = code === "VND" ? 30000 : 300;
    const stepVal = code === "VND" ? 10000 : 100;
    const stepsNeeded = 3;
    let saved = 0;

    api.dots(stepsNeeded, 0);
    api.say(
      `Save up for the goal! Reach ${spokenMinor(target, "en", code)}.`,
      `Cùng tiết kiệm đạt mục tiêu ${spokenMinor(target, "vi", code)} nhé!`
    );

    const wrap = el("div", "mn2-wrap");
    api.stage.appendChild(wrap);

    const board = el("div", "mn2-box", `${pic("🎯")} ${fmtMinor(saved, code)} / ${fmtMinor(target, code)}`);
    wrap.appendChild(board);

    const shelf = el("div", "mn2-row");
    wrap.appendChild(shelf);

    for (let r = 0; r < stepsNeeded; r++) {
      if (api.closed) return;
      shelf.innerHTML = "";
      const addBtn = el("button", "mn2-btn", `<span class="mn2-art">${pic("🪙")}</span> +${fmtMinor(stepVal, code)}`);
      shelf.appendChild(addBtn);

      await untilRight(api, [addBtn], () => true);
      if (api.closed) return;
      saved += stepVal;
      board.innerHTML = `${pic("🎯")} ${fmtMinor(saved, code)} / ${fmtMinor(target, code)}`;
      api.sfx.coin();
      api.dots(stepsNeeded, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Goal reached!", "Đã đạt mục tiêu!") });
  }
});

register({
  id: "pocketweek",
  icon: "📅",
  name: () => T("Pocket Money Week", "Tiền Tiêu Vặt Trong Tuần"),
  async run(api) {
    style();
    const code = getCode();
    const days = [
      T("Monday", "Thứ Hai"),
      T("Wednesday", "Thứ Tư"),
      T("Friday", "Thứ Sáu"),
      T("Sunday", "Chủ Nhật")
    ];
    const allowance = code === "VND" ? 10000 : 100;
    const rounds = 4;
    api.dots(rounds, 0);

    api.say(
      "Collect pocket money through the week!",
      "Nhận tiền tiêu vặt từng ngày trong tuần nhé!"
    );

    const wrap = el("div", "mn2-wrap");
    api.stage.appendChild(wrap);
    const dayBox = el("div", "mn2-box");
    wrap.appendChild(dayBox);
    const shelf = el("div", "mn2-row");
    wrap.appendChild(shelf);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      dayBox.innerHTML = `${pic("📅")} ${days[r]}: ${fmtMinor(allowance, code)}`;
      shelf.innerHTML = "";
      const btn = el("button", "mn2-btn", `<span class="mn2-art">${pic("💰")}</span> ${T("Collect", "Nhận")}`);
      shelf.appendChild(btn);

      await untilRight(api, [btn], () => true);
      if (api.closed) return;
      api.sfx.coin();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Week complete!", "Đủ cả tuần rồi!") });
  }
});

register({
  id: "pricetags",
  icon: "🏷️",
  name: () => T("Price Tags", "Gắn Giá"),
  async run(api) {
    style();
    const code = getCode();
    const rounds = 3;
    api.dots(rounds, 0);

    api.say(
      "Match the price tag to the item!",
      "Gắn đúng thẻ giá cho từng món hàng!"
    );

    const wrap = el("div", "mn2-wrap");
    api.stage.appendChild(wrap);

    const items = [
      { name: T("Apple", "Quả Táo"), art: "🍎", price: code === "VND" ? 5000 : 100 },
      { name: T("Book", "Quyển Sách"), art: "📖", price: code === "VND" ? 20000 : 400 },
      { name: T("Toy Bus", "Xe Buýt Đồ Chơi"), art: "🚌", price: code === "VND" ? 50000 : 1000 }
    ];

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const item = items[r];
      const itemBox = el("div", "mn2-box", `<span class="mn2-art">${pic(item.art)}</span> ${item.name}`);
      wrap.appendChild(itemBox);

      const wrongPrice = item.price * 2;
      const choices = [
        { label: fmtMinor(item.price, code), correct: true },
        { label: fmtMinor(wrongPrice, code), correct: false }
      ];

      const row = el("div", "mn2-row");
      wrap.appendChild(row);
      const btns = choiceButtons(api, choices, c => `<span class="mn2-art">${pic("🏷️")}</span> ${c.label}`, "mn2-btn");
      btns.forEach(b => row.appendChild(b));

      await untilRight(api, btns, b => b._v.correct);
      if (api.closed) return;
      api.sfx.pop();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("All tagged!", "Đã gắn xong giá!") });
  }
});

register({
  id: "busfare",
  icon: "🚌",
  name: () => T("Pay for the Bus", "Trả Tiền Xe Buýt"),
  async run(api) {
    style();
    const code = getCode();
    const rounds = 3;
    api.dots(rounds, 0);

    const fare = code === "VND" ? 10000 : 200;
    api.say(
      `Pay ${spokenMinor(fare, "en", code)} for the bus ticket!`,
      `Trả ${spokenMinor(fare, "vi", code)} tiền vé xe buýt nhé!`
    );

    const wrap = el("div", "mn2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const info = el("div", "mn2-box", `<span class="mn2-art">${pic("🚌")}</span> ${T("Ticket fare:", "Giá vé:")} ${fmtMinor(fare, code)}`);
      wrap.appendChild(info);

      const row = el("div", "mn2-row");
      wrap.appendChild(row);

      const payBtn = el("button", "mn2-btn", `<span class="mn2-art">${pic("🪙")}</span> ${T("Tap to Pay", "Chạm Trả Tiền")}`);
      row.appendChild(payBtn);

      await untilRight(api, [payBtn], () => true);
      if (api.closed) return;
      api.sfx.coin();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Ready to ride!", "Xe buýt khởi hành!") });
  }
});

register({
  id: "lemonade",
  icon: "🍋",
  name: () => T("Lemonade Stand", "Quầy Nước Chanh"),
  async run(api) {
    style();
    const code = getCode();
    const rounds = 4;
    api.dots(rounds, 0);

    const cupPrice = code === "VND" ? 10000 : 100;
    api.say(
      "Serve lemonade and collect the coins!",
      "Bán nước chanh và thu tiền nào!"
    );

    const wrap = el("div", "mn2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const stand = el("div", "mn2-box", `<span class="mn2-art">${pic("🍋")}</span> ${T("Cup of Lemonade", "Cốc Nước Chanh")}: ${fmtMinor(cupPrice, code)}`);
      wrap.appendChild(stand);

      const row = el("div", "mn2-row");
      wrap.appendChild(row);

      const serveBtn = el("button", "mn2-btn", `<span class="mn2-art">${pic("💰")}</span> ${T("Serve & Collect", "Bán & Thu Tiền")}`);
      row.appendChild(serveBtn);

      await untilRight(api, [serveBtn], () => true);
      if (api.closed) return;
      api.sfx.coin();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Great lemonade day!", "Quầy nước chanh đắt hàng!") });
  }
});

register({
  id: "party",
  icon: "🎈",
  name: () => T("Party on a Budget", "Tiệc Tiết Kiệm"),
  async run(api) {
    style();
    const rounds = 5;
    api.dots(rounds, 0);

    api.say(
      "Pick party supplies within budget!",
      "Chọn đồ dự tiệc vừa vặn ngân sách nhé!"
    );

    const partyItems = [
      { name: T("Balloons", "Bóng Bay"), art: "🎈" },
      { name: T("Apple Juice", "Nước Táo"), art: "🍎" },
      { name: T("Cake", "Bánh Kem"), art: "🎂" },
      { name: T("Party Hat", "Mũ Tiệc"), art: "🎩" },
      { name: T("Sparklers", "Pháo Hoa Nhỏ"), art: "✨" }
    ];

    const wrap = el("div", "mn2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const curr = partyItems[r];
      const box = el("div", "mn2-box", `${T("Step", "Mục")} ${r + 1}: ${curr.name}`);
      wrap.appendChild(box);

      const row = el("div", "mn2-row");
      wrap.appendChild(row);
      const buyBtn = el("button", "mn2-btn", `<span class="mn2-art">${pic(curr.art)}</span> ${T("Add to Party", "Thêm Vào Tiệc")}`);
      row.appendChild(buyBtn);

      await untilRight(api, [buyBtn], () => true);
      if (api.closed) return;
      api.sfx.pop();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Party is ready!", "Bữa tiệc sẵn sàng!") });
  }
});

register({
  id: "recycle",
  icon: "♻️",
  name: () => T("Cans for Coins", "Đổi Lon Lấy Tiền"),
  async run(api) {
    style();
    const code = getCode();
    const rounds = 3;
    api.dots(rounds, 0);

    const earnPerCan = code === "VND" ? 2000 : 10;
    api.say(
      "Recycle empty containers to earn return coins!",
      "Đổi vỏ lon tái chế để nhận tiền thưởng nhé!"
    );

    const wrap = el("div", "mn2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const box = el("div", "mn2-box", `<span class="mn2-art">${pic("♻️")}</span> ${T("Return 1 Can", "Đổi 1 Vỏ Lon")}: +${fmtMinor(earnPerCan, code)}`);
      wrap.appendChild(box);

      const row = el("div", "mn2-row");
      wrap.appendChild(row);

      const binBtn = el("button", "mn2-btn", `<span class="mn2-art">${pic("🪙")}</span> ${T("Feed into Machine", "Cho Vào Máy Đổi")}`);
      row.appendChild(binBtn);

      await untilRight(api, [binBtn], () => true);
      if (api.closed) return;
      api.sfx.coin();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Recycling champion!", "Bé giỏi tái chế!") });
  }
});

register({
  id: "tetmarket",
  icon: "🏮",
  name: () => T("Tết Shopping", "Đi Chợ Tết"),
  async run(api) {
    style();
    const code = getCode();
    const rounds = 3;
    api.dots(rounds, 0);

    api.say(
      "Shop for festive items at the Tết flower market!",
      "Cùng đi sắm đồ đón Tết ở chợ hoa nhé!"
    );

    const items = [
      { name: T("Peach Blossoms", "Cành Đào Tết"), art: "🌸", cost: code === "VND" ? 50000 : 500 },
      { name: T("Square Sticky Cake", "Bánh Chưng"), art: "🏮", cost: code === "VND" ? 30000 : 300 },
      { name: T("Red Envelopes", "Bao Lì Xì Đỏ"), art: "🧧", cost: code === "VND" ? 10000 : 100 }
    ];

    const wrap = el("div", "mn2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const item = items[r];
      const box = el("div", "mn2-box", `<span class="mn2-art">${pic(item.art)}</span> ${item.name} (${fmtMinor(item.cost, code)})`);
      wrap.appendChild(box);

      const row = el("div", "mn2-row");
      wrap.appendChild(row);

      const buyBtn = el("button", "mn2-btn", `<span class="mn2-art">${pic("💰")}</span> ${T("Buy for Tết", "Mua Đón Tết")}`);
      row.appendChild(buyBtn);

      await untilRight(api, [buyBtn], () => true);
      if (api.closed) return;
      api.sfx.coin();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Happy Tết shopping!", "Sắm Tết vui vẻ!") });
  }
});

register({
  id: "bank",
  icon: "🏦",
  name: () => T("At the Bank", "Ở Ngân Hàng"),
  async run(api) {
    style();
    const code = getCode();
    const rounds = 4;
    api.dots(rounds, 0);

    api.say(
      "Deposit and withdraw safely at the bank counter!",
      "Gửi và rút tiền an toàn tại quầy ngân hàng!"
    );

    const ops = [
      { name: T("Deposit Coin", "Gửi Xu"), art: "🪙" },
      { name: T("Deposit Note", "Gửi Tiền Giấy"), art: "💵" },
      { name: T("Check Balance", "Xem Số Dư"), art: "🏦" },
      { name: T("Safe Piggy Savings", "Cất Tiết Kiệm"), art: "💰" }
    ];

    const wrap = el("div", "mn2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const curr = ops[r];
      const box = el("div", "mn2-box", `${pic("🏦")} ${curr.name}`);
      wrap.appendChild(box);

      const row = el("div", "mn2-row");
      wrap.appendChild(row);

      const actionBtn = el("button", "mn2-btn", `<span class="mn2-art">${pic(curr.art)}</span> ${T("Confirm", "Xác Nhận")}`);
      row.appendChild(actionBtn);

      await untilRight(api, [actionBtn], () => true);
      if (api.closed) return;
      api.sfx.coin();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Bank counter clear!", "Giao dịch ngân hàng hoàn tất!") });
  }
});

register({
  id: "sharefair",
  icon: "🤝",
  name: () => T("Share Fairly", "Chia Đều"),
  async run(api) {
    style();
    const rounds = 3;
    api.dots(rounds, 0);

    api.say(
      "Divide the coins equally so everyone gets the same!",
      "Chia đều số xu để bạn nào cũng nhận phần bằng nhau!"
    );

    const wrap = el("div", "mn2-wrap");
    api.stage.appendChild(wrap);

    for (let r = 0; r < rounds; r++) {
      if (api.closed) return;
      wrap.innerHTML = "";
      const totalCoins = (r + 1) * 2;
      const shareEach = totalCoins / 2;
      const box = el("div", "mn2-box", `<span class="mn2-art">${pic("🪙")}</span> ${T("Total coins:", "Tổng số xu:")} ${totalCoins} (${shareEach} ${T("each", "mỗi bạn")})`);
      wrap.appendChild(box);

      const row = el("div", "mn2-row");
      wrap.appendChild(row);

      const shareBtn = el("button", "mn2-btn", `<span class="mn2-art">${pic("🤝")}</span> ${T("Give Fair Share", "Chia Đều Phần")}`);
      row.appendChild(shareBtn);

      await untilRight(api, [shareBtn], () => true);
      if (api.closed) return;
      api.sfx.pop();
      api.dots(rounds, r + 1);
      await wait(300);
    }

    await wait(300);
    return api.win({ title: T("Fairly shared!", "Chia đều thật vui!") });
  }
});
