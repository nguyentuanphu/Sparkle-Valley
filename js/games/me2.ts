import { register, untilRight } from "./frame.js";
import { T } from "../i18n.js";
import { pic } from "../art.js";
import { el, wait } from "../util.js";

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el("style", "", ".me2-wrap{display:grid;justify-items:center;gap:10px;padding:20px}.me2-btn{min-width:120px;padding:10px;border-radius:15px;background:#fff;border:2px solid #3f2b24}"));
}

register({
  id: "myday", icon: "🌅",
  name: () => T("My Day", "Một Ngày Của Em"),
  async run(api) {
    style();
    api.say("Put your daily routine in order!", "Sắp xếp lịch trình hàng ngày của em!");
    const wrap = el("div", "me2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "me2-btn");
    btn.innerHTML = pic("🌅") + " " + T("Start", "Bắt đầu");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Done!", "Xong rồi!") });
  }
});

register({
  id: "plate", icon: "🍽️",
  name: () => T("Healthy Plate", "Đĩa Ăn Lành Mạnh"),
  async run(api) {
    style();
    api.say("Build a healthy plate!", "Xây dựng một đĩa ăn lành mạnh!");
    const wrap = el("div", "me2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "me2-btn");
    btn.innerHTML = pic("🍽️") + " " + T("Add", "Thêm");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Healthy!", "Khỏe mạnh!") });
  }
});

register({
  id: "kindchoice", icon: "💝",
  name: () => T("Kind Choices", "Việc Làm Tốt"),
  async run(api) {
    style();
    api.say("Make a kind choice!", "Hãy chọn một việc làm tốt!");
    const wrap = el("div", "me2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "me2-btn");
    btn.innerHTML = pic("💝") + " " + T("Choose", "Chọn");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Kind!", "Tốt bụng!") });
  }
});