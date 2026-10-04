const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DB_DIR, "db.json");

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const seed = {
  users: [
    { id: "u1", fullname: "Bùi Duy Mạnh", email: "dmanhz@gmail.com", username: "dmanhz", password: "12345", avatar: "", bio: "Software Engineering student • Building things with code.", online: true },
    { id: "u2", fullname: "Nguyễn Minh Anh", email: "minhanh@gmail.com", username: "minhanh", password: "123", avatar: "", bio: "UI/UX lover • Coffee • Design.", online: true },
    { id: "u3", fullname: "Trần Quốc Huy", email: "quochuy@gmail.com", username: "quochuy", password: "123", avatar: "", bio: "Backend developer. Node.js & databases.", online: false },
    { id: "u4", fullname: "Lê Khánh Linh", email: "khanhlinh@gmail.com", username: "khanhlinh", password: "123", avatar: "", bio: "Photography and creative content.", online: true },
    { id: "u5", fullname: "Phạm Gia Bảo", email: "giabao@gmail.com", username: "giabao", password: "123", avatar: "", bio: "Android • Kotlin • Compose.", online: false }
  ],
  posts: [
    {
      id: "p1", userId: "u2",
      content: "Một giao diện tốt không chỉ đẹp, mà còn phải khiến người dùng biết mình cần làm gì tiếp theo. ✨",
      image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80",
      createdAt: "2026-10-04T08:20:00.000Z", likes: ["u1","u4"], comments: [
        { id: "c1", userId: "u1", text: "Chuẩn luôn! UX trước, màu sắc sau 😄", createdAt: "2026-10-04T08:42:00.000Z" }
      ]
    },
    {
      id: "p2", userId: "u3",
      content: "Hôm nay vừa hoàn thành API tìm kiếm người dùng. Cảm giác backend chạy mượt thật sự rất đã! 🚀",
      image: "",
      createdAt: "2026-10-03T15:30:00.000Z", likes: ["u1","u2","u5"], comments: [
        { id: "c2", userId: "u5", text: "Nice! Tối cho mình xem structure nhé.", createdAt: "2026-10-03T16:10:00.000Z" }
      ]
    },
    {
      id: "p3", userId: "u4",
      content: "Chiều Sài Gòn và một chút nắng. Có những ngày chẳng cần đi đâu xa. 🌇",
      image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
      createdAt: "2026-10-02T10:15:00.000Z", likes: ["u2","u3"], comments: []
    }
  ],
  messages: [
    { id: "m1", senderId: "u2", receiverId: "u1", text: "Mình vừa xem bài post của bạn, UI mới nhìn ổn đó!", createdAt: "2026-10-04T07:20:00.000Z", read: true },
    { id: "m2", senderId: "u1", receiverId: "u2", text: "Cảm ơn bạn nha! Mình đang hoàn thiện phần chat.", createdAt: "2026-10-04T07:23:00.000Z", read: true },
    { id: "m3", senderId: "u2", receiverId: "u1", text: "Nếu cần test thì nhắn mình nhé 👌", createdAt: "2026-10-04T07:25:00.000Z", read: false },
    { id: "m4", senderId: "u3", receiverId: "u1", text: "Mai mình bàn tiếp phần database nhé.", createdAt: "2026-10-03T13:00:00.000Z", read: false }
  ],
  notifications: [
    { id: "n1", userId: "u1", type: "like", actorId: "u2", postId: "p1", text: "đã thích bài viết của bạn.", createdAt: "2026-10-04T08:45:00.000Z", read: false },
    { id: "n2", userId: "u1", type: "comment", actorId: "u2", postId: "p1", text: "đã bình luận về bài viết của bạn.", createdAt: "2026-10-04T08:40:00.000Z", read: false },
    { id: "n3", userId: "u1", type: "message", actorId: "u3", text: "đã gửi cho bạn một tin nhắn.", createdAt: "2026-10-03T13:00:00.000Z", read: false }
  ]
};

function ensureDb() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) saveDb(seed);
}
function getDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}
function id(prefix) {
  return `${prefix}_${crypto.randomBytes(7).toString("hex")}`;
}
function publicUser(user) {
  if (!user) return null;
  return { id: user.id, fullname: user.fullname, username: user.username, email: user.email, avatar: user.avatar || "", bio: user.bio || "", online: !!user.online };
}
function userById(db, userId) {
  return db.users.find(u => u.id === userId);
}
function getUserFromBody(db, req) {
  const userId = req.body.userId || req.headers["x-user-id"];
  return userById(db, userId);
}
function safePost(db, post) {
  const author = userById(db, post.userId);
  return {
    ...post,
    author: publicUser(author),
    likeCount: post.likes.length,
    commentCount: post.comments.length,
    likedByMe: false,
    comments: post.comments.map(c => ({ ...c, author: publicUser(userById(db, c.userId)) }))
  };
}
function addNotification(db, data) {
  db.notifications.unshift({
    id: id("n"), createdAt: new Date().toISOString(), read: false, ...data
  });
}
ensureDb();

app.get("/api/health", (_, res) => res.json({ ok: true, app: "Dmanhz Social" }));

app.post("/api/register", (req, res) => {
  const { fullname, email, username, password } = req.body;
  if (!fullname || !email || !username || !password) return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin!" });
  const db = getDb();
  if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ message: "Tên đăng nhập hoặc email đã tồn tại!" });
  }
  const user = { id: id("u"), fullname: fullname.trim(), email: email.trim(), username: username.trim(), password, avatar: "", bio: "Thành viên mới của cộng đồng.", online: true };
  db.users.push(user);
  saveDb(db);
  res.json({ message: "Đăng ký thành công!", user: publicUser(user) });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const db = getDb();
  const user = db.users.find(u => u.username.toLowerCase() === String(username || "").toLowerCase() && u.password === password);
  if (!user) return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không chính xác!" });
  user.online = true;
  saveDb(db);
  res.json({ message: "Đăng nhập thành công!", user: publicUser(user) });
});

app.post("/api/logout", (req, res) => {
  const db = getDb();
  const user = userById(db, req.body.userId);
  if (user) user.online = false;
  saveDb(db);
  res.json({ ok: true });
});

app.get("/api/users", (req, res) => {
  const db = getDb();
  const q = String(req.query.q || "").trim().toLowerCase();
  let users = db.users.filter(u => !q || u.fullname.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
  res.json({ users: users.map(publicUser) });
});

app.get("/api/users/:id", (req, res) => {
  const db = getDb();
  const user = userById(db, req.params.id);
  if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng." });
  res.json({ user: publicUser(user) });
});

app.put("/api/users/:id", (req, res) => {
  const db = getDb();
  const user = userById(db, req.params.id);
  if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng." });
  const { fullname, bio, avatar } = req.body;
  if (fullname) user.fullname = String(fullname).trim();
  if (bio !== undefined) user.bio = String(bio).trim();
  if (avatar !== undefined) user.avatar = String(avatar).trim();
  saveDb(db);
  res.json({ user: publicUser(user) });
});

app.get("/api/posts", (req, res) => {
  const db = getDb();
  const me = req.query.userId;
  const q = String(req.query.q || "").trim().toLowerCase();
  let posts = db.posts
    .filter(p => !q || p.content.toLowerCase().includes(q) || (userById(db, p.userId)?.fullname || "").toLowerCase().includes(q))
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(p => ({ ...safePost(db, p), likedByMe: !!me && p.likes.includes(me) }));
  res.json({ posts });
});

app.post("/api/posts", (req, res) => {
  const db = getDb();
  const { userId, content, image } = req.body;
  const author = userById(db, userId);
  if (!author) return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ." });
  if (!String(content || "").trim() && !String(image || "").trim()) return res.status(400).json({ message: "Bài viết chưa có nội dung." });
  const post = { id: id("p"), userId, content: String(content || "").trim(), image: String(image || "").trim(), createdAt: new Date().toISOString(), likes: [], comments: [] };
  db.posts.push(post);
  saveDb(db);
  res.json({ post: safePost(db, post) });
});

app.put("/api/posts/:id", (req, res) => {
  const db = getDb();
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết." });
  if (post.userId !== req.body.userId) return res.status(403).json({ message: "Bạn không có quyền sửa bài này." });
  post.content = String(req.body.content ?? post.content).trim();
  post.image = String(req.body.image ?? post.image).trim();
  saveDb(db);
  res.json({ post: safePost(db, post) });
});

app.delete("/api/posts/:id", (req, res) => {
  const db = getDb();
  const index = db.posts.findIndex(p => p.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: "Không tìm thấy bài viết." });
  if (db.posts[index].userId !== req.body.userId) return res.status(403).json({ message: "Bạn không có quyền xóa bài này." });
  db.posts.splice(index, 1);
  saveDb(db);
  res.json({ ok: true });
});

app.post("/api/posts/:id/like", (req, res) => {
  const db = getDb();
  const post = db.posts.find(p => p.id === req.params.id);
  const me = userById(db, req.body.userId);
  if (!post || !me) return res.status(404).json({ message: "Không tìm thấy dữ liệu." });
  const index = post.likes.indexOf(me.id);
  if (index >= 0) post.likes.splice(index, 1);
  else {
    post.likes.push(me.id);
    if (post.userId !== me.id) addNotification(db, { userId: post.userId, type: "like", actorId: me.id, postId: post.id, text: "đã thích bài viết của bạn." });
  }
  saveDb(db);
  res.json({ liked: index < 0, likeCount: post.likes.length });
});

app.post("/api/posts/:id/comments", (req, res) => {
  const db = getDb();
  const post = db.posts.find(p => p.id === req.params.id);
  const me = userById(db, req.body.userId);
  const text = String(req.body.text || "").trim();
  if (!post || !me) return res.status(404).json({ message: "Không tìm thấy dữ liệu." });
  if (!text) return res.status(400).json({ message: "Bình luận không được để trống." });
  const comment = { id: id("c"), userId: me.id, text, createdAt: new Date().toISOString() };
  post.comments.push(comment);
  if (post.userId !== me.id) addNotification(db, { userId: post.userId, type: "comment", actorId: me.id, postId: post.id, text: "đã bình luận về bài viết của bạn." });
  saveDb(db);
  res.json({ comment: { ...comment, author: publicUser(me) } });
});

app.get("/api/conversations", (req, res) => {
  const db = getDb(), me = req.query.userId;
  if (!userById(db, me)) return res.status(401).json({ message: "Chưa đăng nhập." });
  const map = new Map();
  db.messages.filter(m => m.senderId === me || m.receiverId === me).forEach(m => {
    const otherId = m.senderId === me ? m.receiverId : m.senderId;
    const previous = map.get(otherId);
    if (!previous || new Date(m.createdAt) > new Date(previous.createdAt)) map.set(otherId, m);
  });
  const conversations = [...map.entries()].map(([otherId, last]) => {
    const other = publicUser(userById(db, otherId));
    const unread = db.messages.filter(m => m.senderId === otherId && m.receiverId === me && !m.read).length;
    return { user: other, lastMessage: last.text, createdAt: last.createdAt, unread };
  }).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ conversations });
});

app.get("/api/messages/:userId", (req, res) => {
  const db = getDb(), me = req.query.me, other = req.params.userId;
  if (!userById(db, me) || !userById(db, other)) return res.status(404).json({ message: "Không tìm thấy người dùng." });
  db.messages.filter(m => (m.senderId === me && m.receiverId === other) || (m.senderId === other && m.receiverId === me))
    .filter(m => m.receiverId === me).forEach(m => m.read = true);
  saveDb(db);
  res.json({ messages: db.messages.filter(m => (m.senderId === me && m.receiverId === other) || (m.senderId === other && m.receiverId === me)).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)) });
});

app.post("/api/messages", (req, res) => {
  const db = getDb();
  const { senderId, receiverId, text } = req.body;
  const sender = userById(db, senderId), receiver = userById(db, receiverId);
  if (!sender || !receiver) return res.status(404).json({ message: "Người dùng không tồn tại." });
  if (!String(text || "").trim()) return res.status(400).json({ message: "Tin nhắn không được để trống." });
  const message = { id: id("m"), senderId, receiverId, text: String(text).trim(), createdAt: new Date().toISOString(), read: false };
  db.messages.push(message);
  addNotification(db, { userId: receiverId, type: "message", actorId: senderId, text: "đã gửi cho bạn một tin nhắn." });
  saveDb(db);
  res.json({ message });
});

app.get("/api/notifications", (req, res) => {
  const db = getDb(), me = req.query.userId;
  const notifications = db.notifications.filter(n => n.userId === me).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(n => ({ ...n, actor: publicUser(userById(db, n.actorId)) }));
  res.json({ notifications, unreadCount: notifications.filter(n => !n.read).length });
});

app.post("/api/notifications/read", (req, res) => {
  const db = getDb();
  db.notifications.filter(n => n.userId === req.body.userId).forEach(n => n.read = true);
  saveDb(db);
  res.json({ ok: true });
});

app.get("/api/dashboard", (req, res) => {
  const db = getDb(), me = req.query.userId;
  const unreadMessages = db.messages.filter(m => m.receiverId === me && !m.read).length;
  const unreadNotifications = db.notifications.filter(n => n.userId === me && !n.read).length;
  res.json({ unreadMessages, unreadNotifications, postCount: db.posts.length, userCount: db.users.length });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "app.html"));
});

app.listen(PORT, () => console.log(`Dmanhz Social đang chạy tại http://localhost:${PORT}`));