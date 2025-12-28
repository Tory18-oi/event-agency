import React, { useState } from "react";
import { Html5Qrcode } from "html5-qrcode"; // Змінено імпорт: тільки Html5Qrcode, не Scanner
import { db } from "../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import eventsData from "../data/events.json";
import "./Scanner.css";

function Scanner() {
  const [ticketInfo, setTicketInfo] = useState(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  const getEventTitle = (eventId) => {
    const event = eventsData.find(e => e.id === eventId);
    return event ? event.title : "Невідома подія";
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProcessing(true);
    setError("");
    setTicketInfo(null);

    try {
      const html5QrCode = new Html5Qrcode("reader"); // Тимчасовий контейнер

      // Зчитуємо QR з файлу
      const result = await html5QrCode.scanFile(file, true); // true — показувати UI (але ми його не показуємо)

      await checkTicket(result);
    } catch (err) {
      console.error(err);
      setError("Не вдалося зчитати QR-код з файлу. Спробуйте інше зображення.");
    } finally {
      setProcessing(false);
      // Очищаємо input, щоб можна було завантажити той самий файл повторно
      e.target.value = "";
    }
  };

  const checkTicket = async (ticketId) => {
    try {
      const ticketDoc = await getDoc(doc(db, "tickets", ticketId));

      if (!ticketDoc.exists()) {
        setError("Квиток не знайдено");
        return;
      }

      const data = ticketDoc.data();

      if (data.status === "used") {
        setError("Квиток вже використано!");
        return;
      }

      setTicketInfo({
        id: ticketId,
        ...data
      });
    } catch (err) {
      setError("Помилка перевірки квитка");
      console.error(err);
    }
  };

  const markAsUsed = async () => {
    if (!ticketInfo) return;

    try {
      await updateDoc(doc(db, "tickets", ticketInfo.id), {
        status: "used",
        usedAt: new Date()
      });
      alert("Квиток позначено як використаний!");
      setTicketInfo(null);
    } catch (err) {
      alert("Помилка при позначенні");
      console.error(err);
    }
  };

  const reset = () => {
    setTicketInfo(null);
    setError("");
  };

  return (
    <section className="scanner-page">
      <div className="scanner-container">
        <h2>Сканер QR-квитків</h2>

        {/* Основна зона — завантаження файлу */}
        {!ticketInfo && !error && (
          <div className="upload-area">
            <label className="upload-btn">
              {processing ? "Обробка зображення..." : "Завантажити фото QR-коду"}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={processing}
                hidden
              />
            </label>
            <p style={{ marginTop: "1.5rem", color: "#8b5cf6", fontSize: "1.4rem" }}>
              Натисніть, щоб вибрати фото квитка з галереї або комп'ютера
            </p>
          </div>
        )}

        {/* Помилка */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={reset} className="start-btn" style={{ marginTop: "1.5rem", padding: "1rem 2rem" }}>
              Спробувати ще раз
            </button>
          </div>
        )}

        {/* Валідний квиток */}
        {ticketInfo && (
          <div className="valid-ticket">
            <h3>Квиток валідний ✅</h3>
            <p><strong>Подія:</strong> {getEventTitle(ticketInfo.eventId)}</p>
            <p><strong>Користувач:</strong> {ticketInfo.userEmail}</p>
            <p><strong>Куплено:</strong> {new Date(ticketInfo.purchasedAt.seconds * 1000).toLocaleString("uk-UA")}</p>

            <button onClick={markAsUsed} className="use-btn">
              Пропустити (позначити як використаний)
            </button>

            <button onClick={reset} className="stop-btn" style={{ marginTop: "1.5rem" }}>
              Сканувати наступний
            </button>
          </div>
        )}

        {/* Прихований div для бібліотеки (потрібен для scanFile) */}
        <div id="reader" style={{ display: "none" }}></div>
      </div>
    </section>
  );
}

export default Scanner;