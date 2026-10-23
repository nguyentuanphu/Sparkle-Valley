import { register, untilRight } from "./frame.js";
import { T } from "../i18n.js";
import { pic } from "../art.js";
import { el, wait } from "../util.js";

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el("style", "", ".sh2-wrap{display:grid;justify-items:center;gap:10px;padding:20px}.sh2-btn{min-width:120px;padding:10px;border-radius:15px;background:#fff;border:2px solid #3f2b24}"));
}

register({
  id: "solids", icon: "⚽",
  name: () => T("Ball, Box, Can", "Khối Cầu, Hộp, Trụ"),
  async run(api) {
    style();
    api.say("Sort the 3D solids!", "Phân loại khối cầu, hộp, trụ nhé!");
    const wrap = el("div", "sh2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "sh2-btn");
    btn.innerHTML = pic("⚽") + " " + T("Sort", "Xếp");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("All sorted!", "Phân loại xong!") });
  }
});

register({
  id: "townshapes", icon: "🏘️",
  name: () => T("Shape Hunt in Town", "Tìm Hình Trong Phố"),
  async run(api) {
    style();
    api.say("Find shapes in the town!", "Tìm hình trong phố nào!");
    const wrap = el("div", "sh2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "sh2-btn");
    btn.innerHTML = pic("🏘️") + " " + T("Find", "Tìm");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Found them all!", "Đã tìm thấy hết!") });
  }
});

register({
  id: "tiles", icon: "🟦",
  name: () => T("Tile the Floor", "Lát Sàn"),
  async run(api) {
    style();
    api.say("Tile the floor with patterns!", "Lát sàn bằng hoa văn nào!");
    const wrap = el("div", "sh2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "sh2-btn");
    btn.innerHTML = pic("🟦") + " " + T("Tile", "Lát");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Floor tiled!", "Sàn nhà thật đẹp!") });
  }
});

register({
  id: "turnit", icon: "🔄",
  name: () => T("Turn It Round", "Xoay Hình"),
  async run(api) {
    style();
    api.say("Turn the shape to fit!", "Xoay hình cho vừa khít!");
    const wrap = el("div", "sh2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "sh2-btn");
    btn.innerHTML = pic("🔄") + " " + T("Turn", "Xoay");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Fits perfectly!", "Vừa khít rồi!") });
  }
});

register({
  id: "shapetrain", icon: "🚂",
  name: () => T("Shape Train", "Tàu Hình Khối"),
  async run(api) {
    style();
    api.say("Load the shapes onto the train!", "Xếp hình khối lên tàu hỏa!");
    const wrap = el("div", "sh2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "sh2-btn");
    btn.innerHTML = pic("🚂") + " " + T("Load", "Xếp");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Train loaded!", "Tàu đã đầy hàng!") });
  }
});

register({
  id: "linescurves", icon: "〰️",
  name: () => T("Lines and Curves", "Nét Thẳng Nét Cong"),
  async run(api) {
    style();
    api.say("Trace the lines and curves!", "Vẽ nét thẳng và nét cong!");
    const wrap = el("div", "sh2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "sh2-btn");
    btn.innerHTML = pic("〰️") + " " + T("Trace", "Vẽ");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Traced smoothly!", "Nét vẽ uyển chuyển!") });
  }
});

register({
  id: "foldbox", icon: "📦",
  name: () => T("Fold the Box", "Gấp Hộp"),
  async run(api) {
    style();
    api.say("Fold the box together!", "Gấp hộp lại với nhau!");
    const wrap = el("div", "sh2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "sh2-btn");
    btn.innerHTML = pic("📦") + " " + T("Fold", "Gấp");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Box folded!", "Hộp đã gấp xong!") });
  }
});