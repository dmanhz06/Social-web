const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginPanel = document.getElementById("loginPanel");
const registerPanel = document.getElementById("registerPanel");

function setAuthTab(tab) {
  const login = tab === "login";
  loginTab.classList.toggle("active", login);
  registerTab.classList.toggle("active", !login);
  loginPanel.classList.toggle("hidden", !login);
  registerPanel.classList.toggle("hidden", login);
}
loginTab.onclick = () => setAuthTab("login");
registerTab.onclick = () => setAuthTab("register");

async function postJson(url, body) {
  const res = await fetch(url, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Có lỗi xảy ra.");
  return data;
}

document.getElementById("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  const msg = document.getElementById("registerMsg");
  msg.textContent = "Đang tạo tài khoản...";
  msg.className = "auth-message";
  try {
    await postJson("/api/register", {
      fullname: document.getElementById("regFullname").value,
      email: document.getElementById("regEmail").value,
      username: document.getElementById("regUsername").value,
      password: document.getElementById("regPassword").value
    });
    msg.textContent = "Tạo tài khoản thành công. Bạn có thể đăng nhập ngay!";
    msg.classList.add("success");
    e.target.reset();
    setTimeout(() => setAuthTab("login"), 1000);
  } catch (err) { msg.textContent = err.message; msg.classList.add("error"); }
});

document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const msg = document.getElementById("loginMsg");
  msg.textContent = "Đang đăng nhập...";
  msg.className = "auth-message";
  try {
    const data = await postJson("/api/login", {
      username: document.getElementById("loginUsername").value,
      password: document.getElementById("loginPassword").value
    });
    localStorage.setItem("socialUser", JSON.stringify(data.user));
    location.href = "/app.html#home";
  } catch (err) { msg.textContent = err.message; msg.classList.add("error"); }
});