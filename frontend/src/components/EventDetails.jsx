import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { auth, db } from "../firebase/config";
import { collection, addDoc, deleteDoc, query, where, getDocs } from "firebase/firestore";
import eventsData from "../data/events.json";
import "./EventDetails.css";

function EventDetails() {
  const { id } = useParams();
  const event = eventsData.find(e => e.id === id);
  const user = auth.currentUser;

  const [isSaved, setIsSaved] = useState(false);

  // Перевіряємо, чи вже збережено цю подію
  useEffect(() => {
    if (user && event) {
      const checkSaved = async () => {
        const q = query(
          collection(db, "savedEvents"),
          where("userId", "==", user.uid),
          where("eventId", "==", event.id)
        );
        const snapshot = await getDocs(q);
        setIsSaved(!snapshot.empty);
      };
      checkSaved();
    }
  }, [user, event]);

  const toggleSave = async () => {
    if (!user) {
      alert("Увійдіть в акаунт, щоб зберегти подію!");
      return;
    }
  
    if (isSaved) {
      // Видаляємо
      const q = query(
        collection(db, "savedEvents"),
        where("userId", "==", user.uid),
        where("eventId", "==", event.id)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach(async (doc) => await deleteDoc(doc.ref));
      setIsSaved(false);
    } else {
      // Додаємо
      await addDoc(collection(db, "savedEvents"), {
        userId: user.uid,
        eventId: event.id,
        savedAt: new Date()
      });
      setIsSaved(true);
    }
  };

  if (!event) {
    return (
      <section>
        <h2>Подію не знайдено 😔</h2>
        <Link to="/">← Повернутися на головну</Link>
      </section>
    );
  }

  return (
    <section className="event-detail">
      <h2>{event.title}</h2>

      {event.image && (
        <img 
          src={event.image} 
          alt={event.title} 
          className="detail-poster"
        />
      )}

      <div className="detail-info">
        <p><strong>Дата:</strong> {event.date} о {event.time}</p>
        <p><strong>Місце:</strong> {event.location}</p>
        {event.min_price > 0 ? (
          <p><strong>Ціна:</strong> від {event.min_price} до {event.max_price} грн</p>
        ) : (
          <p><strong>Вхід:</strong> вільний</p>
        )}

        <p><strong>Опис:</strong></p>
        <p>{event.description}</p>

        {/* Кнопка збереження */}
        {user && (
          <button onClick={toggleSave} className="save-detail-btn">
            {isSaved ? "❤️ Збережено в профіль" : "♡ Зберегти в профіль"}
          </button>
        )}

        

        <Link to="/" className="back-link">← Назад до всіх подій</Link>
      </div>
    </section>
  );
}

export default EventDetails;