import { register, untilRight } from "./frame.js";
import { T } from "../i18n.js";
import { pic } from "../art.js";
import { el, wait } from "../util.js";

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el("style", "", ".out-wrap{display:grid;justify-items:center;gap:10px;padding:20px}.out-btn{min-width:120px;padding:10px;border-radius:15px;background:#fff;border:2px solid #3f2b24}"));
}

register({
  id: "hideseek", icon: "🙈",
  name: () => T("Hide and Seek", "Trốn Tìm"),
  async run(api) {
    style();
    api.say("Find friends in hide and seek!", "Tìm bạn đang trốn nhé!");
    const wrap = el("div", "out-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "out-btn");
    btn.innerHTML = pic("🙈") + " " + T("Find", "Tìm");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Found everyone!", "Tìm thấy hết rồi!") });
  }
});

register({
  id: "duckgoose", icon: "🦆",
  name: () => T("Duck, Duck, Goose", "Vịt, Vịt, Ngỗng"),
  async run(api) {
    style();
    api.say("Tap for Duck, Duck, Goose!", "Chơi trò vịt, vịt, ngỗng nào!");
    const wrap = el("div", "out-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "out-btn");
    btn.innerHTML = pic("🦆") + " " + T("Tap", "Chạm");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Goose chased!", "Bắt được ngỗng rồi!") });
  }
});

register({
  id: "redgreen", icon: "🚦",
  name: () => T("Red Light, Green Light", "Đèn Xanh Đèn Đỏ"),
  async run(api) {
    style();
    api.say("Green light: go! Red light: stop!", "Đèn xanh đi, đèn đỏ dừng!");
    const wrap = el("div", "out-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "out-btn");
    btn.innerHTML = pic("🚦") + " " + T("Move", "Đi");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Reached the line!", "Về đích an toàn!") });
  }
});

register({
  id: "simon", icon: "🗣️",
  name: () => T("Simon Says", "Simon Bảo"),
  async run(api) {
    style();
    api.say("Listen carefully: Simon says!", "Nghe kỹ nhé: Simon bảo!");
    const wrap = el("div", "out-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "out-btn");
    btn.innerHTML = pic("🗣️") + " " + T("Listen", "Nghe");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Good listening!", "Lắng nghe rất giỏi!") });
  }
});

register({
  id: "eggspoon", icon: "🥚",
  name: () => T("Egg and Spoon Race", "Chạy Thìa Trứng"),
  async run(api) {
    style();
    api.say("Balance the egg on the spoon!", "Giữ thăng bằng quả trứng trên thìa!");
    const wrap = el("div", "out-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "out-btn");
    btn.innerHTML = pic("🥚") + " " + T("Balance", "Giữ");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Egg balanced!", "Trứng không rơi!") });
  }
});

register({
  id: "chairs", icon: "🪑",
  name: () => T("Musical Chairs", "Ghế Âm Nhạc"),
  async run(api) {
    style();
    api.say("Find a chair when music stops!", "Ngồi xuống ghế khi nhạc dừng nhé!");
    const wrap = el("div", "out-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "out-btn");
    btn.innerHTML = pic("🪑") + " " + T("Sit", "Ngồi");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Got a seat!", "Có ghế rồi!") });
  }
});

register({
  id: "kicktokick", icon: "🏉",
  name: () => T("Kick to Kick", "Đá Bóng Qua Lại"),
  async run(api) {
    style();
    api.say("Kick the footy to a friend!", "Đá bóng qua lại cùng bạn nhé!");
    const wrap = el("div", "out-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "out-btn");
    btn.innerHTML = pic("🏉") + " " + T("Kick", "Đá");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Great kick!", "Cú đá đẹp mắt!") });
  }
});

register({
  id: "nippers", icon: "🏖️",
  name: () => T("Little Nippers", "Bé Tập Cứu Hộ Biển"),
  async run(api) {
    style();
    api.say("Practice surf lifesaving skills!", "Bé tập làm cứu hộ biển!");
    const wrap = el("div", "out-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "out-btn");
    btn.innerHTML = pic("🏖️") + " " + T("Rescue", "Cứu hộ");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Nipper star!", "Dũng sĩ tí hon!") });
  }
});

register({
  id: "hoops", icon: "⭕",
  name: () => T("Rolling Hoops", "Lăn Vòng"),
  async run(api) {
    style();
    api.say("Roll the hoop forward!", "Lăn vòng tròn về phía trước!");
    const wrap = el("div", "out-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "out-btn");
    btn.innerHTML = pic("⭕") + " " + T("Roll", "Lăn");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Hoop rolled!", "Vòng lăn tít!") });
  }
});

register({
  id: "tag", icon: "🏃",
  name: () => T("Tag!", "Đuổi Bắt"),
  async run(api) {
    style();
    api.say("Tag, you are it!", "Đuổi bắt thật vui!");
    const wrap = el("div", "out-wrap");
    api.stage.appendChild(wrap);
    const btn = el("button", "out-btn");
    btn.innerHTML = pic("🏃") + " " + T("Tag", "Bắt");
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T("Tag done!", "Chạy nhanh lắm!") });
  }
});