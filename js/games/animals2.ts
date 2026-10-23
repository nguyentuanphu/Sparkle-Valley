import { register, untilRight } from "./frame.js";
import { T } from "../i18n.js";
import { pic } from "../art.js";
import { el, wait } from "../util.js";

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el("style", "", ".an2-wrap{display:grid;justify-items:center;gap:10px;padding:20px}.an2-btn{min-width:120px;padding:10px;border-radius:15px;background:#fff;border:2px solid #3f2b24}"));
}

register({
  id: "crabwalk", icon: "🦀",
  name: () => T("Crab Walk", "Cua Bò Ngang"),
  async run(api) {
    style();
    api.say("Guide the crab sideways to its hole!", "Dẫn cua bò ngang về lỗ nhé!");
    const wrap = el("div", "an2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "an2-btn");
    btn.innerHTML = pic("🦀") + " " + T("Guide", "Dẫn");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Crab home!", "Cua về nhà rồi!") });
  }
});

register({
  id: "whohome", icon: "🏠",
  name: () => T("Who Lives Here?", "Nhà Của Ai?"),
  async run(api) {
    style();
    api.say("Match the animal to its home!", "Ghép con vật với nhà của nó!");
    const wrap = el("div", "an2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "an2-btn");
    btn.innerHTML = pic("🏠") + " " + T("Match", "Ghép");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("All matched!", "Ghép xong hết rồi!") });
  }
});

register({
  id: "mumbaby", icon: "🦘",
  name: () => T("Mums and Babies", "Mẹ Và Con"),
  async run(api) {
    style();
    api.say("Match mums to babies!", "Ghép mẹ với con nhé!");
    const wrap = el("div", "an2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "an2-btn");
    btn.innerHTML = pic("🦘") + " " + T("Match", "Ghép");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Families together!", "Gia đình sum họp!") });
  }
});

register({
  id: "feedzoo", icon: "🍎",
  name: () => T("Feed the Zoo", "Cho Thú Ăn"),
  async run(api) {
    style();
    api.say("Feed the zoo animals!", "Cho thú ở sở thú ăn nhé!");
    const wrap = el("div", "an2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "an2-btn");
    btn.innerHTML = pic("🍎") + " " + T("Feed", "Cho ăn");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("All fed!", "Đã cho ăn xong!") });
  }
});

register({
  id: "buffalo", icon: "🐃",
  name: () => T("Buffalo to the Field", "Dắt Trâu Ra Đồng"),
  async run(api) {
    style();
    api.say("Lead the buffalo to the field!", "Dắt trâu ra đồng nào!");
    const wrap = el("div", "an2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "an2-btn");
    btn.innerHTML = pic("🐃") + " " + T("Lead", "Dắt");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Buffalo grazing!", "Trâu ăn cỏ rồi!") });
  }
});

register({
  id: "reefcount", icon: "🐠",
  name: () => T("Reef Count", "Đếm Cá Rạn San Hô"),
  async run(api) {
    style();
    api.say("Count the reef fish!", "Đếm cá rạn san hô nào!");
    const wrap = el("div", "an2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "an2-btn");
    btn.innerHTML = pic("🐠") + " " + T("Count", "Đếm");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Counted!", "Đếm xong rồi!") });
  }
});

register({
  id: "tracks", icon: "🐾",
  name: () => T("Whose Footprints?", "Dấu Chân Của Ai?"),
  async run(api) {
    style();
    api.say("Whose footprints are these?", "Đây là dấu chân của ai?");
    const wrap = el("div", "an2-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "an2-btn");
    btn.innerHTML = pic("🐾") + " " + T("Match", "Ghép");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Tracks matched!", "Ghép dấu chân xong!") });
  }
});