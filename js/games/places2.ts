import { register, untilRight } from "./frame.js";
import { T } from "../i18n.js";
import { pic } from "../art.js";
import { el, wait } from "../util.js";

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el("style", "", ".pl2-wrap{display:grid;justify-items:center;gap:10px;padding:20px}.pl2-btn{min-width:120px;padding:10px;border-radius:15px;background:#fff;border:2px solid #3f2b24}"));
}

register({
  id: "cyclo", icon: "🚲",
  name: () => T("Cyclo Ride", "Đi Xích Lô"),
  async run(api) {
    style();
    api.say("Hop on the cyclo!", "Lên xe xích lô dạo phố nào!");
    const wrap = el("div", "pl2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "pl2-btn");
    btn.innerHTML = pic("🚲") + " " + T("Ride", "Đi");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Fun ride!", "Dạo phố thật vui!") });
  }
});

register({
  id: "reunification", icon: "🚂",
  name: () => T("The North–South Train", "Tàu Thống Nhất"),
  async run(api) {
    style();
    api.say("All aboard the North–South train!", "Tàu Thống Nhất khởi hành!");
    const wrap = el("div", "pl2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "pl2-btn");
    btn.innerHTML = pic("🚂") + " " + T("Board", "Lên tàu");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Train journey!", "Chuyến tàu Bắc Nam!") });
  }
});

register({
  id: "lighthouse", icon: "🗼",
  name: () => T("Light the Lighthouse", "Thắp Hải Đăng Vũng Tàu"),
  async run(api) {
    style();
    api.say("Light the lighthouse at Vũng Tàu!", "Thắp sáng ngọn hải đăng Vũng Tàu!");
    const wrap = el("div", "pl2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "pl2-btn");
    btn.innerHTML = pic("🗼") + " " + T("Light", "Thắp");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.chime();
    await wait(400);
    return api.win({ title: T("Lighthouse shining!", "Hải đăng tỏa sáng!") });
  }
});

register({
  id: "operaseats", icon: "🎭",
  name: () => T("Seats at the Opera House", "Xếp Chỗ Nhà Hát"),
  async run(api) {
    style();
    api.say("Find seats at the Sydney Opera House!", "Xếp chỗ ở Nhà hát Opera Sydney!");
    const wrap = el("div", "pl2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "pl2-btn");
    btn.innerHTML = pic("🎭") + " " + T("Seat", "Xếp");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Show starts!", "Buổi biểu diễn bắt đầu!") });
  }
});

register({
  id: "outback", icon: "🦘",
  name: () => T("Outback Road Trip", "Đường Xuyên Úc"),
  async run(api) {
    style();
    api.say("Drive through the Australian Outback!", "Khám phá vùng Outback nước Úc!");
    const wrap = el("div", "pl2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "pl2-btn");
    btn.innerHTML = pic("🦘") + " " + T("Drive", "Lái");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Outback adventure!", "Chuyến đi tuyệt vời!") });
  }
});

register({
  id: "floating", icon: "🚣",
  name: () => T("Floating Market", "Chợ Nổi Cái Răng"),
  async run(api) {
    style();
    api.say("Visit the floating market at Cái Răng!", "Ghé thăm chợ nổi Cái Răng!");
    const wrap = el("div", "pl2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "pl2-btn");
    btn.innerHTML = pic("🚣") + " " + T("Paddle", "Chèo");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Market visited!", "Chợ nổi nhộn nhịp!") });
  }
});

register({
  id: "airport", icon: "✈️",
  name: () => T("Airport Helper", "Ở Sân Bay"),
  async run(api) {
    style();
    api.say("Help travelers at the airport!", "Giúp hành khách ở sân bay nhé!");
    const wrap = el("div", "pl2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "pl2-btn");
    btn.innerHTML = pic("✈️") + " " + T("Help", "Giúp");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Plane takes off!", "Máy bay cất cánh!") });
  }
});

register({
  id: "postcard", icon: "💌",
  name: () => T("Postcards Home", "Gửi Bưu Thiếp"),
  async run(api) {
    style();
    api.say("Send a postcard home!", "Gửi bưu thiếp về nhà cho ông bà!");
    const wrap = el("div", "pl2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "pl2-btn");
    btn.innerHTML = pic("💌") + " " + T("Send", "Gửi");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Postcard sent!", "Bưu thiếp đã gửi đi!") });
  }
});