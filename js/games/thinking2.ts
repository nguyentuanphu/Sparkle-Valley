import { register, untilRight } from "./frame.js";
import { T } from "../i18n.js";
import { pic } from "../art.js";
import { el, wait } from "../util.js";

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el("style", "", ".tk2-wrap{display:grid;justify-items:center;gap:10px;padding:20px}.tk2-btn{min-width:120px;padding:10px;border-radius:15px;background:#fff;border:2px solid #3f2b24}"));
}

register({
  id: "minichess", icon: "♟️",
  name: () => T("Little Chess", "Cờ Vua Nhỏ"),
  async run(api) {
    style();
    api.say("Move the chess piece!", "Di chuyển quân cờ!");
    const wrap = el("div", "tk2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "tk2-btn");
    btn.innerHTML = pic("♟️") + " " + T("Move", "Di chuyển");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Good move!", "Nước đi hay!") });
  }
});

register({
  id: "cotuong", icon: "🀄",
  name: () => T("Chinese Chess Puzzles", "Cờ Tướng Nhỏ"),
  async run(api) {
    style();
    api.say("Solve the puzzle!", "Giải đố nào!");
    const wrap = el("div", "tk2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "tk2-btn");
    btn.innerHTML = pic("🀄") + " " + T("Solve", "Giải");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Solved!", "Giải xong!") });
  }
});

register({
  id: "whosits", icon: "🪑",
  name: () => T("Who Sits Where?", "Ai Ngồi Đâu?"),
  async run(api) {
    style();
    api.say("Who sits here?", "Ai ngồi đây nhé?");
    const wrap = el("div", "tk2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "tk2-btn");
    btn.innerHTML = pic("🪑") + " " + T("Sit", "Ngồi");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Correct!", "Đúng rồi!") });
  }
});

register({
  id: "pipes", icon: "🚰",
  name: () => T("Water Pipes", "Nối Ống Nước"),
  async run(api) {
    style();
    api.say("Connect the pipes!", "Nối ống nước lại!");
    const wrap = el("div", "tk2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "tk2-btn");
    btn.innerHTML = pic("🚰") + " " + T("Connect", "Nối");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Water flows!", "Nước chảy rồi!") });
  }
});