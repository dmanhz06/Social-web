const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const currentUser = JSON.parse(localStorage.getItem("socialUser") || "null");
if (!currentUser) location.href = "/login.html";

let activePage = "home";
let activeChatUser = null;
let currentSearchTab = "all";
let allSearchData = { users: [], posts: [] };

const api = {
  async get(url) { const r=await fetch(url); const d=await r.json(); if(!r.ok) throw Error(d.message||"Request failed"); return d; },
  async send(url, method, body) { const r=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}); const d=await r.json(); if(!r.ok) throw Error(d.message||"Request failed"); return d; }
};

function initials(name="U") { return name.split(/\s+/).filter(Boolean).slice(-2).map(x=>x[0]).join("").toUpperCase(); }
function avatarHtml(user, size="md") {
  if (!user) return `<span class="avatar avatar-${size}">?</span>`;
  return `<span class="avatar avatar-${size}" style="${user.avatar ? `background-image:url('${user.avatar}')` : ""}">${user.avatar ? "" : initials(user.fullname)}</span>`;
}
function timeAgo(date) {
  const sec=Math.floor((Date.now()-new Date(date))/1000);
  if(sec<60) return "vừa xong"; if(sec<3600) return `${Math.floor(sec/60)} phút trước`;
  if(sec<86400) return `${Math.floor(sec/3600)} giờ trước`; if(sec<604800) return `${Math.floor(sec/86400)} ngày trước`;
  return new Date(date).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"});
}
function toast(message, type="success") {
  const el=document.createElement("div"); el.className=`toast ${type}`; el.innerHTML=`<span>${type==="error"?"!":"✓"}</span>${message}`;
  $("#toastContainer").appendChild(el); setTimeout(()=>el.classList.add("show"),10); setTimeout(()=>{el.classList.remove("show");setTimeout(()=>el.remove(),250)},3000);
}
function setPage(page) {
  activePage=page;
  $$(".page").forEach(p=>p.classList.toggle("hidden",p.id!==`page-${page}`));
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  history.replaceState(null,"",`#${page}`);
  if(page==="home") loadFeed(); if(page==="messages") loadConversations(); if(page==="notifications") loadNotifications(); if(page==="search") loadSearch($("#searchInput")?.value||"");
}
function setUserUI(user) {
  currentUser.fullname=user.fullname; currentUser.username=user.username; currentUser.avatar=user.avatar; currentUser.bio=user.bio;
  localStorage.setItem("socialUser",JSON.stringify(currentUser));
  $("#sideAvatar").outerHTML=avatarHtml(user,"sm").replace("avatar-sm","avatar-sm\" id=\"sideAvatar");
  $("#topAvatar").outerHTML=avatarHtml(user,"xs").replace("avatar-xs","avatar-xs\" id=\"topAvatar");
  $("#composerAvatar").outerHTML=avatarHtml(user,"md").replace("avatar-md","avatar-md\" id=\"composerAvatar");
  $("#profileCardAvatar").outerHTML=avatarHtml(user,"xl").replace("avatar-xl","avatar-xl profile-card-avatar\" id=\"profileCardAvatar");
  $("#modalAvatar").outerHTML=avatarHtml(user,"md").replace("avatar-md","avatar-md\" id=\"modalAvatar");
  $("#sideName").textContent=user.fullname; $("#sideUsername").textContent=`@${user.username}`;
  $("#topName").textContent=user.fullname; $("#composerName").textContent=user.fullname;
  $("#profileCardName").textContent=user.fullname; $("#profileCardUsername").textContent=`@${user.username}`; $("#profileCardBio").textContent=user.bio||"Chưa có giới thiệu.";
}
async function loadProfile() {
  const d=await api.get(`/api/users/${currentUser.id}`); setUserUI(d.user);
}
function postCard(post) {
  const menu = post.author.id===currentUser.id ? `<button class="post-menu-btn" data-action="menu" data-id="${post.id}">•••</button>` : "";
  const comments=post.comments.slice(-3).map(c=>`<div class="comment"><div>${avatarHtml(c.author,"xs")}</div><div class="comment-bubble"><b>${esc(c.author.fullname)}</b><span>${esc(c.text)}</span><small>${timeAgo(c.createdAt)}</small></div></div>`).join("");
  return `<article class="post-card card" data-post="${post.id}">
    <header class="post-head">${avatarHtml(post.author,"md")}<div class="post-author"><b>${esc(post.author.fullname)}</b><span>@${esc(post.author.username)} · ${timeAgo(post.createdAt)}</span></div>${menu}</header>
    <div class="post-content">${post.content ? `<p>${esc(post.content).replace(/\n/g,"<br>")}</p>`:""}${post.image?`<img class="post-image" src="${escAttr(post.image)}" alt="Hình ảnh bài viết" onerror="this.style.display='none'">`:""}</div>
    <div class="post-stats"><span>${post.likeCount?`♥ ${post.likeCount}`:""} </span><span>${post.commentCount?`${post.commentCount} bình luận`:""} </span></div>
    <div class="post-actions"><button class="${post.likedByMe?"liked":""}" data-action="like" data-id="${post.id}">♥ <span>Thích</span></button><button data-action="focus-comment" data-id="${post.id}">○ <span>Bình luận</span></button><button data-action="share" data-id="${post.id}">↗ <span>Chia sẻ</span></button></div>
    <div class="comments">${comments}<form class="comment-form" data-id="${post.id}">${avatarHtml(currentUser,"xs")}<input name="text" placeholder="Viết bình luận..." autocomplete="off"><button>Gửi</button></form></div>
  </article>`;
}
async function loadFeed() {
  const d=await api.get(`/api/posts?userId=${encodeURIComponent(currentUser.id)}`);
  $("#feedList").innerHTML=d.posts.length?d.posts.map(postCard).join(""):`<div class="empty-feed card"><div>✦</div><h3>Feed đang chờ bài viết đầu tiên</h3><p>Hãy là người đầu tiên chia sẻ điều gì đó.</p></div>`;
  $("#statPosts").textContent=d.posts.filter(p=>p.author.id===currentUser.id).length;
}
async function createPost() {
  const content=$("#postContent").value.trim(), image=$("#postImage").value.trim();
  if(!content && !image) return toast("Hãy nhập nội dung hoặc hình ảnh.","error");
  await api.send("/api/posts","POST",{userId:currentUser.id,content,image});
  closeModal("composerModal"); $("#postContent").value=""; $("#postImage").value=""; $("#charCount").textContent="0 / 1000";
  toast("Đã đăng bài viết."); loadFeed();
}
async function likePost(id) { await api.send(`/api/posts/${id}/like`,"POST",{userId:currentUser.id}); loadFeed(); }
async function commentPost(id, text) { await api.send(`/api/posts/${id}/comments`,"POST",{userId:currentUser.id,text}); loadFeed(); toast("Đã thêm bình luận."); }
function openModal(id){$("#"+id).classList.remove("hidden"); setTimeout(()=>$("#"+id).classList.add("visible"),10)}
function closeModal(id){const e=$("#"+id); e.classList.remove("visible"); setTimeout(()=>e.classList.add("hidden"),180)}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function escAttr(s=""){return esc(s).replace(/`/g,"&#096;")}

async function loadConversations(filter="") {
  const d=await api.get(`/api/conversations?userId=${currentUser.id}`);
  const list=d.conversations.filter(c=>!filter||c.user.fullname.toLowerCase().includes(filter.toLowerCase())||c.user.username.toLowerCase().includes(filter.toLowerCase()));
  $("#conversationList").innerHTML=list.length?list.map(c=>`<button class="conversation ${activeChatUser?.id===c.user.id?"active":""}" data-chat-user="${c.user.id}">${avatarHtml(c.user,"md")}<span class="conversation-info"><b>${esc(c.user.fullname)}</b><small>${esc(c.lastMessage)}</small></span><span class="conversation-meta">${timeAgo(c.createdAt)}${c.unread?`<i>${c.unread}</i>`:""}</span></button>`).join(""):`<div class="small-empty">Chưa có cuộc trò chuyện.<br>Hãy bắt đầu một chat mới.</div>`;
}
async function openChat(user) {
  activeChatUser=user; $("#emptyChat").classList.add("hidden"); $("#activeChat").classList.remove("hidden");
  $("#chatAvatar").outerHTML=avatarHtml(user,"md").replace("avatar-md","avatar-md\" id=\"chatAvatar");
  $("#chatName").textContent=user.fullname; $("#chatStatus").textContent=user.online?"● Đang hoạt động":"○ Ngoại tuyến";
  const d=await api.get(`/api/messages/${user.id}?me=${currentUser.id}`);
  $("#chatMessages").innerHTML=d.messages.map(m=>`<div class="message-row ${m.senderId===currentUser.id?"mine":"theirs"}"><div class="bubble">${esc(m.text)}</div><small>${new Date(m.createdAt).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})}</small></div>`).join("");
  $("#chatMessages").scrollTop=$("#chatMessages").scrollHeight; loadConversations(); updateBadges();
}
async function sendMessage(e) {
  e.preventDefault(); const input=$("#chatText"), text=input.value.trim(); if(!text||!activeChatUser)return;
  await api.send("/api/messages","POST",{senderId:currentUser.id,receiverId:activeChatUser.id,text}); input.value=""; openChat(activeChatUser);
}
async function loadNotifications() {
  const d=await api.get(`/api/notifications?userId=${currentUser.id}`);
  $("#notificationList").innerHTML=d.notifications.length?d.notifications.map(n=>`<div class="notification-item ${n.read?"":"unread"}">${avatarHtml(n.actor,"md")}<div class="notification-text"><p><b>${esc(n.actor?.fullname||"Hệ thống")}</b> ${esc(n.text)}</p><small>${timeAgo(n.createdAt)}</small></div><span class="notification-type">${n.type==="message"?"◌":n.type==="comment"?"○":"♥"}</span></div>`).join(""):`<div class="empty-notifications"><div>♢</div><h3>Chưa có thông báo</h3><p>Khi có hoạt động mới, bạn sẽ thấy chúng ở đây.</p></div>`;
  updateBadges();
}
async function updateBadges() {
  const d=await api.get(`/api/dashboard?userId=${currentUser.id}`);
  const mb=$("#messageBadge"), nb=$("#notificationBadge"), dot=$("#topDot");
  mb.textContent=d.unreadMessages; mb.classList.toggle("hidden",!d.unreadMessages);
  nb.textContent=d.unreadNotifications; nb.classList.toggle("hidden",!d.unreadNotifications); dot.classList.toggle("hidden",!d.unreadNotifications);
}
async function markRead(){await api.send("/api/notifications/read","POST",{userId:currentUser.id});loadNotifications();toast("Đã đánh dấu tất cả là đã đọc.");}
async function loadSearch(q) {
  const [u,p]=await Promise.all([api.get(`/api/users?q=${encodeURIComponent(q)}`),api.get(`/api/posts?userId=${currentUser.id}&q=${encodeURIComponent(q)}`)]);
  allSearchData={users:u.users,posts:p.posts}; renderSearch();
}
function renderSearch(){
  const wrap=$("#searchResults"), users=allSearchData.users, posts=allSearchData.posts;
  let html="";
  if(currentSearchTab!=="posts") html+=`<div class="result-section"><div class="result-title"><h3>Người dùng</h3><span>${users.length} kết quả</span></div><div class="people-grid">${users.map(u=>`<div class="person-card card">${avatarHtml(u,"lg")}<h3>${esc(u.fullname)}</h3><span>@${esc(u.username)}</span><p>${esc(u.bio||"Chưa có giới thiệu.")}</p><button class="secondary-btn full" data-message-user="${u.id}" ${u.id===currentUser.id?"disabled":""}>${u.id===currentUser.id?"Bạn":"Nhắn tin"}</button></div>`).join("")||`<div class="no-results">Không tìm thấy người dùng.</div>`}</div></div>`;
  if(currentSearchTab!=="people") html+=`<div class="result-section"><div class="result-title"><h3>Bài viết</h3><span>${posts.length} kết quả</span></div><div class="search-posts">${posts.map(postCard).join("")||`<div class="no-results">Không tìm thấy bài viết.</div>`}</div></div>`;
  wrap.innerHTML=html;
}
function showNewChat(){openModal("userModal");loadUserPicker("");}
async function loadUserPicker(q){const d=await api.get(`/api/users?q=${encodeURIComponent(q)}`);$("#userPickerResults").innerHTML=d.users.filter(u=>u.id!==currentUser.id).map(u=>`<button class="picker-user" data-message-user="${u.id}">${avatarHtml(u,"md")}<span><b>${esc(u.fullname)}</b><small>@${esc(u.username)}</small></span><span>→</span></button>`).join("")}
async function logout(){await api.send("/api/logout","POST",{userId:currentUser.id});localStorage.removeItem("socialUser");location.href="/login.html"}

document.addEventListener("click", async e=>{
  const nav=e.target.closest(".nav-item"); if(nav){setPage(nav.dataset.page);return}
  if(e.target.closest("#topNotificationBtn")){setPage("notifications");return}
  if(e.target.closest("#profileButton")||e.target.closest("#topProfileBtn")){openProfileModal();return}
  if(e.target.closest("#openComposer")||e.target.closest("#openComposer2")||e.target.closest("#composerPhoto")){openModal("composerModal");$("#postContent").focus();return}
  const close=e.target.closest("[data-close]"); if(close){closeModal(close.dataset.close);return}
  const action=e.target.closest("[data-action]"); if(action){
    const a=action.dataset.action,id=action.dataset.id;
    if(a==="like") likePost(id);
    if(a==="focus-comment"){const input=document.querySelector(`.comment-form[data-id="${id}"] input`);input?.focus()}
    if(a==="share"){navigator.clipboard?.writeText(location.origin+location.pathname+`#post-${id}`);toast("Đã sao chép liên kết bài viết.");}
    return;
  }
  const conv=e.target.closest("[data-chat-user]"); if(conv){const d=await api.get(`/api/users/${conv.dataset.chatUser}`);openChat(d.user);return}
  const msgUser=e.target.closest("[data-message-user]"); if(msgUser){const d=await api.get(`/api/users/${msgUser.dataset.messageUser}`);closeModal("userModal");setPage("messages");openChat(d.user);return}
});
document.addEventListener("submit",e=>{if(e.target.matches(".comment-form")){e.preventDefault();const input=e.target.querySelector("input");const text=input.value.trim();if(text)commentPost(e.target.dataset.id,text)}});
$("#publishPost").onclick=createPost;
$("#postContent").addEventListener("input",e=>$("#charCount").textContent=`${e.target.value.length} / 1000`);
$("#refreshFeed").onclick=loadFeed;
$("#chatForm").addEventListener("submit",sendMessage);
$("#newChatBtn").onclick=showNewChat; $("#emptyNewChat").onclick=showNewChat;
$("#readAllBtn").onclick=markRead;
$("#messageSearch").addEventListener("input",e=>loadConversations(e.target.value));
$("#userPickerSearch").addEventListener("input",e=>loadUserPicker(e.target.value));
$("#searchInput").addEventListener("input",e=>{clearTimeout(window.searchTimer);window.searchTimer=setTimeout(()=>loadSearch(e.target.value),250)});
$("#clearSearch").onclick=()=>{$("#searchInput").value="";loadSearch("")};
$$(".search-tabs button").forEach(b=>b.onclick=()=>{$$(".search-tabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentSearchTab=b.dataset.searchTab;renderSearch()});
$("#globalSearch").addEventListener("keydown",e=>{if(e.key==="Enter"){setPage("search");$("#searchInput").value=e.target.value;loadSearch(e.target.value)}});
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#globalSearch").focus()}if(e.key==="Escape")$$(".modal-backdrop.visible").forEach(x=>closeModal(x.id))});
$("#logoutBtn").onclick=logout;
$("#mobileNavTrigger").onclick=()=>document.body.classList.toggle("sidebar-open");
async function openProfileModal(){const d=await api.get(`/api/users/${currentUser.id}`);$("#profileNameInput").value=d.user.fullname;$("#profileBioInput").value=d.user.bio||"";$("#profileAvatarInput").value=d.user.avatar||"";openModal("profileModal")}
$("#editProfileBtn").onclick=openProfileModal;
$("#saveProfile").onclick=async()=>{const d=await api.send(`/api/users/${currentUser.id}`,"PUT",{fullname:$("#profileNameInput").value,bio:$("#profileBioInput").value,avatar:$("#profileAvatarInput").value});setUserUI(d.user);closeModal("profileModal");toast("Đã cập nhật hồ sơ.");};
$("#topProfileBtn").onclick=openProfileModal;
window.addEventListener("hashchange",()=>{const p=location.hash.slice(1);if(["home","search","messages","notifications"].includes(p))setPage(p)});
(async function init(){await loadProfile();await loadFeed();await updateBadges();const hash=location.hash.slice(1);if(["search","messages","notifications"].includes(hash))setPage(hash);setInterval(updateBadges,12000);})();
