import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, onSnapshot, deleteDoc, doc,updateDoc } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import eventsData from "../data/events.json";
import "./MyTickets.css"; 
import { Link } from "react-router-dom";

function MyTickets() {
  const user = auth.currentUser;
  const [tickets, setTickets] = useState([]);
  const [flippedTickets, setFlippedTickets] = useState([]); // які картки перевернуті

const toggleFlip = (ticketId) => {
  setFlippedTickets(prev => 
    prev.includes(ticketId)
      ? prev.filter(id => id !== ticketId)
      : [...prev, ticketId]
  );
};

  useEffect(() => {
    if (!user) {
      setTickets([]);
      return;
    }

    const q = query(collection(db, "tickets"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTickets(ticketList);
    });

    return () => unsubscribe();
  }, [user]);

  const cancelTicket = async (ticketId) => {
  if (!confirm("Скасувати квиток? Гроші не повертаються :)")) return;

  try {
    await updateDoc(doc(db, "tickets", ticketId), {
      status: "cancelled",
      cancelledAt: new Date()
    });
    alert("Квиток скасовано");
  } catch (error) {
    alert("Помилка при скасуванні");
    console.error(error);
  }
};

  const getEventTitle = (eventId) => {
    const event = eventsData.find(e => e.id === eventId);
    return event ? event.title : "Невідома подія";
  };

  const getEventPrice = (eventId) => {
    const event = eventsData.find(e => e.id === eventId);
    return event && event.min_price > 0 ? `від ${event.min_price} грн` : "Вхід вільний";
  };

  if (!user) {
    return <section className="my-tickets"><h2>Увійдіть в акаунт</h2></section>;
  }

  return (
    <section className="my-tickets">
      <h2>Мої квитки</h2>

      {tickets.length === 0 ? (
        <p className="empty-message">
          Ви ще не купили жодного квитка. Перейдіть до <Link to="/tickets">покупки</Link>!
        </p>
      ) : (
        <div className="tickets-grid">
          {tickets.map(ticket => (
  <div key={ticket.id} className="ticket-flip-container">
    <div className={`ticket-flip-card ${flippedTickets.includes(ticket.id) ? "flipped" : ""}`}>
      {/* Лицьова сторона — інформація про квиток */}
      <div className="ticket-front" onClick={() => toggleFlip(ticket.id)}>
        <h3>{getEventTitle(ticket.eventId)}</h3>
        <p><strong>Квиток №:</strong> {ticket.id}</p>
        <p><strong>Ціна:</strong> {getEventPrice(ticket.eventId)}</p>
        <p><strong>Статус:</strong> 
          {ticket.status === "valid" ? "Дійсний" : "Скасовано/Використано"}
        </p>
        <p><strong>Куплено:</strong> {new Date(ticket.purchasedAt.seconds * 1000).toLocaleDateString("uk-UA")}</p>

        {ticket.status === "valid" && (
          <p className="flip-hint">Натисніть, щоб побачити QR-код →</p>
        )}

        {ticket.status === "valid" && (
          <button onClick={(e) => {
            e.stopPropagation(); // щоб не перевертало при кліку на кнопку
            cancelTicket(ticket.id);
          }} className="cancel-btn">
            Повернути квиток
          </button>
        )}
      </div>

      {/* Зворотна сторона — QR-код */}
      <div className="ticket-back" onClick={() => toggleFlip(ticket.id)}>
      
        <div className="qr-container-large">
          <QRCodeSVG value={ticket.id} size={280} level="H" />
        </div>
        
        <p className="flip-hint">← Натисніть, щоб повернутися</p>
      </div>
    </div>
  </div>
))}
        </div>
      )}
    </section>
  );
}

export default MyTickets;