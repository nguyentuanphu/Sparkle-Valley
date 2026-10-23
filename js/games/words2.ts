import { register, untilRight } from "./frame.js";
import { T } from "../i18n.js";
import { pic } from "../art.js";
import { el, wait } from "../util.js";

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el("style", "", ".wd2-wrap{display:grid;justify-items:center;gap:10px;padding:20px}.wd2-btn{min-width:120px;padding:10px;border-radius:15px;background:#fff;border:2px solid #3f2b24}"));
}

register({
  id: "whichgroup", icon: "🧺",
  name: () => T("Which Group?", "Thuộc Nhóm Nào?"),
  async run(api) {
    style();
    api.say("Which group does it belong to?", "Món đồ này thuộc nhóm nào?");
    const wrap = el("div", "wd2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "wd2-btn");
    btn.innerHTML = pic("🧺") + " " + T("Choose", "Chọn");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Right group!", "Đúng nhóm rồi!") });
  }
});

register({
  id: "storyorder", icon: "📖",
  name: () => T("Story in Order", "Xếp Tranh Kể Chuyện"),
  async run(api) {
    style();
    api.say("Put the story pictures in order!", "Xếp tranh theo thứ tự câu chuyện!");
    const wrap = el("div", "wd2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "wd2-btn");
    btn.innerHTML = pic("📖") + " " + T("Order", "Xếp");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Great storytelling!", "Kể chuyện thật hay!") });
  }
});

register({
  id: "guesswhat", icon: "❓",
  name: () => T("Guess What I Am", "Đoán Xem Tôi Là Gì"),
  async run(api) {
    style();
    api.say("Guess what I am!", "Đoán xem tôi là gì nào!");
    const wrap = el("div", "wd2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "wd2-btn");
    btn.innerHTML = pic("❓") + " " + T("Guess", "Đoán");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("You guessed right!", "Bé đoán đúng rồi!") });
  }
});

register({
  id: "actions", icon: "🏃",
  name: () => T("Action Words", "Từ Chỉ Hoạt Động"),
  async run(api) {
    style();
    api.say("Find the action word!", "Tìm từ chỉ hoạt động nhé!");
    const wrap = el("div", "wd2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "wd2-btn");
    btn.innerHTML = pic("🏃") + " " + T("Action", "Hành động");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Well done!", "Giỏi lắm!") });
  }
});

register({
  id: "position", icon: "📦",
  name: () => T("In, On, Under", "Trong, Trên, Dưới"),
  async run(api) {
    style();
    api.say("Is it in, on, or under?", "Ở trong, ở trên, hay ở dưới?");
    const wrap = el("div", "wd2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "wd2-btn");
    btn.innerHTML = pic("📦") + " " + T("Find", "Tìm");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Correct position!", "Vị trí chính xác!") });
  }
});