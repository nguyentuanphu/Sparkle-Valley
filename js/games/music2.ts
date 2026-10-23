import { register, untilRight } from "./frame.js";
import { T } from "../i18n.js";
import { pic } from "../art.js";
import { el, wait } from "../util.js";

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el("style", "", ".mu2-wrap{display:grid;justify-items:center;gap:10px;padding:20px}.mu2-btn{min-width:120px;padding:10px;border-radius:15px;background:#fff;border:2px solid #3f2b24}"));
}

register({
  id: "dantranh", icon: "🎻",
  name: () => T("Zither Strings", "Đàn Tranh"),
  async run(api) {
    style();
    api.say("Pluck the zither strings!", "Gảy dây đàn tranh nào!");
    const wrap = el("div", "mu2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "mu2-btn");
    btn.innerHTML = pic("🎻") + " " + T("Pluck", "Gảy");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Beautiful melody!", "Tiếng đàn thánh thót!") });
  }
});

register({
  id: "bushband", icon: "🪕",
  name: () => T("Bush Band", "Ban Nhạc Đồng Quê"),
  async run(api) {
    style();
    api.say("Play along with the bush band!", "Hòa tấu cùng ban nhạc đồng quê!");
    const wrap = el("div", "mu2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "mu2-btn");
    btn.innerHTML = pic("🪕") + " " + T("Play", "Chơi");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Great rhythm!", "Nhịp điệu rộn ràng!") });
  }
});

register({
  id: "drumecho", icon: "🥁",
  name: () => T("Drum Echo", "Trống Đáp"),
  async run(api) {
    style();
    api.say("Copy the drum rhythm!", "Đánh trống theo nhịp nhé!");
    const wrap = el("div", "mu2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "mu2-btn");
    btn.innerHTML = pic("🥁") + " " + T("Beat", "Đánh");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop(4);
    await wait(400);
    return api.win({ title: T("Perfect echo!", "Trống đáp nhịp nhàng!") });
  }
});

register({
  id: "loudquiet", icon: "📢",
  name: () => T("Loud and Quiet", "To Và Nhỏ"),
  async run(api) {
    style();
    api.say("Listen: is it loud or quiet?", "Lắng nghe xem âm thanh to hay nhỏ nhé!");
    const wrap = el("div", "mu2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "mu2-btn");
    btn.innerHTML = pic("📢") + " " + T("Listen", "Nghe");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Well heard!", "Tai bé thật thính!") });
  }
});

register({
  id: "songsteps", icon: "🎶",
  name: () => T("Song Steps", "Xếp Câu Hát"),
  async run(api) {
    style();
    api.say("Put the song lines in order!", "Xếp các câu hát theo thứ tự nhé!");
    const wrap = el("div", "mu2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "mu2-btn");
    btn.innerHTML = pic("🎶") + " " + T("Order", "Xếp");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.chime();
    await wait(400);
    return api.win({ title: T("Song complete!", "Hát thật hay!") });
  }
});