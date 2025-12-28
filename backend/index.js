const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const multer = require("multer");

// Завантажуємо ключі Firebase Admin
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "cursova-fea26.appspot.com"
});

const db = admin.firestore();
const bucket = admin.storage().bucket(); // ← це правильно для Admin SDK

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// Multer для завантаження файлів
const upload = multer({ storage: multer.memoryStorage() });

// Мідлвара для перевірки токена
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};

// 1. Зберегти подію
app.post("/api/save-event", verifyToken, async (req, res) => {
  const { eventId } = req.body;
  const uid = req.uid;

  try {
    await db.collection("savedEvents").add({
      userId: uid,
      eventId,
      savedAt: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Видалити збережену подію
app.post("/api/unsave-event", verifyToken, async (req, res) => {
  const { eventId } = req.body;
  const uid = req.uid;

  try {
    const snapshot = await db.collection("savedEvents")
      .where("userId", "==", uid)
      .where("eventId", "==", eventId)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Купити квиток
app.post("/api/buy-ticket", verifyToken, async (req, res) => {
  const { eventId } = req.body;
  const uid = req.uid;

  try {
    const ticketRef = await db.collection("tickets").add({
      userId: uid,
      eventId,
      status: "valid",
      purchasedAt: new Date()
    });
    res.json({ success: true, ticketId: ticketRef.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Отримати збережені події
app.get("/api/saved-events", verifyToken, async (req, res) => {
  const uid = req.uid;

  try {
    const snapshot = await db.collection("savedEvents")
      .where("userId", "==", uid)
      .get();

    const saved = snapshot.docs.map(doc => doc.data());
    res.json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Отримати історію квитків
app.get("/api/tickets", verifyToken, async (req, res) => {
  const uid = req.uid;

  try {
    const snapshot = await db.collection("tickets")
      .where("userId", "==", uid)
      .orderBy("purchasedAt", "desc")
      .get();

    const tickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Оновити профіль
app.post("/api/update-profile", verifyToken, async (req, res) => {
  const uid = req.uid;
  const data = req.body;

  try {
    await db.collection("users").doc(uid).set(data, { merge: true });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});