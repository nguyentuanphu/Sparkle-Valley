import { register, untilRight } from "./frame.js";
import { T } from "../i18n.js";
import { pic } from "../art.js";
import { el, wait } from "../util.js";

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el("style", "", ".nm2-wrap{display:grid;justify-items:center;gap:10px;padding:20px}.nm2-btn{min-width:120px;padding:10px;border-radius:15px;background:#fff;border:2px solid #3f2b24}"));
}

register({
  id: "numline", icon: "🔢",
  name: () => T("Hop the Number Line", "Nhảy Trên Tia Số"),
  async run(api) {
    style();
    api.say("Hop along the number line!", "Nhảy theo tia số nào!");
    const wrap = el("div", "nm2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "nm2-btn");
    btn.innerHTML = pic("🔢") + " " + T("Hop", "Nhảy");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Counted!", "Đếm xong rồi!") });
  }
});

register({
  id: "tenframe", icon: "🔟",
  name: () => T("Ten Frame", "Khung Mười"),
  async run(api) {
    style();
    api.say("Fill the ten frame!", "Điền đầy khung mười nhé!");
    const wrap = el("div", "nm2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "nm2-btn");
    btn.innerHTML = pic("🔟") + " " + T("Fill", "Điền");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Ten done!", "Mười rồi!") });
  }
});

register({
  id: "dice", icon: "🎲",
  name: () => T("Dice Count", "Đếm Xúc Xắc"),
  async run(api) {
    style();
    api.say("Count the dice dots!", "Đếm chấm xúc xắc nào!");
    const wrap = el("div", "nm2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "nm2-btn");
    btn.innerHTML = pic("🎲") + " " + T("Count", "Đếm");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("All counted!", "Đếm hết rồi!") });
  }
});

register({
  id: "evenodd", icon: "⚽",
  name: () => T("Pairs or Odd?", "Chẵn Hay Lẻ?"),
  async run(api) {
    style();
    api.say("Is it even or odd?", "Chẵn hay lẻ nhé?");
    const wrap = el("div", "nm2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "nm2-btn");
    btn.innerHTML = pic("⚽") + " " + T("Check", "Xem");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Correct!", "Đúng rồi!") });
  }
});

register({
  id: "measure", icon: "📏",
  name: () => T("Measure with Blocks", "Đo Bằng Khối"),
  async run(api) {
    style();
    api.say("Measure with blocks!", "Đo bằng khối nào!");
    const wrap = el("div", "nm2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "nm2-btn");
    btn.innerHTML = pic("📏") + " " + T("Measure", "Đo");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Measured!", "Đo xong rồi!") });
  }
});

register({
  id: "beforeafter", icon: "🔄",
  name: () => T("Before and After", "Số Trước Số Sau"),
  async run(api) {
    style();
    api.say("What comes before and after?", "Số trước số sau là mấy?");
    const wrap = el("div", "nm2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "nm2-btn");
    btn.innerHTML = pic("🔄") + " " + T("Find", "Tìm");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Got it!", "Biết rồi!") });
  }
});

register({
  id: "halves", icon: "🍕",
  name: () => T("Share in Half", "Chia Đôi"),
  async run(api) {
    style();
    api.say("Share it in half!", "Chia đôi để cùng nhau nhé!");
    const wrap = el("div", "nm2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "nm2-btn");
    btn.innerHTML = pic("🍕") + " " + T("Share", "Chia");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Fair share!", "Chia công bằng!") });
  }
});