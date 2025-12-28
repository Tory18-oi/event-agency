import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import eventsData from "../data/events.json";
import "./TicketHistory.css";
import { Link } from "react-router-dom";

function TicketHistory() {
  const user = auth.currentUser;
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [flippedTickets, setFlippedTickets] = useState([]);

  const toggleFlip = (ticketId) => {
    setFlippedTickets(prev => 
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "tickets"),
      where("userId", "==", user.uid),
      orderBy("purchasedAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPurchaseHistory(tickets);
    });

    return () => unsubscribe();
  }, [user]);

  const getEventTitle = (eventId) => {
    const event = eventsData.find(e => e.id === eventId);
    return event ? event.title : "Невідома подія";
  };

  const getEventPrice = (eventId) => {
    const event = eventsData.find(e => e.id === eventId);
    return event && event.min_price > 0 ? `від ${event.min_price} грн` : "Вхід вільний";
  };

  if (!user) {
    return <section className="ticket-history"><h2>Увійдіть в акаунт</h2></section>;
  }

  return (
    <section className="ticket-history">
      <h2>Історія покупок квитків</h2>

      {purchaseHistory.length === 0 ? (
        <p className="empty-message">
          Ви ще не купували квитків.<br/>
          Перейдіть до <Link to="/tickets">покупки квитків</Link> і оберіть подію!
        </p>
      ) : (
        <div className="tickets-grid">
          {purchaseHistory.map(ticket => (
            <div key={ticket.id} className="ticket-flip-container">
              <div className={`ticket-flip-card ${flippedTickets.includes(ticket.id) ? "flipped" : ""}`}>
                {/* Лицьова сторона */}
                <div className="ticket-front" onClick={() => toggleFlip(ticket.id)}>
                  <h3>{getEventTitle(ticket.eventId)}</h3>
                  <p><strong>Квиток №:</strong> {ticket.id}</p>
                  <p><strong>Ціна:</strong> {getEventPrice(ticket.eventId)}</p>

                  <p className="ticket-status">
                    <strong>Статус:</strong>{" "}
                    <span className={`status-badge ${ticket.status}`}>
                      {ticket.status === "valid" && "✅ Дійсний"}
                      {ticket.status === "cancelled" && "❌ Скасовано (повернуто)"}
                      {ticket.status === "used" && "🔴 Використано"}
                    </span>
                  </p>

                  <p><strong>Куплено:</strong> {new Date(ticket.purchasedAt.seconds * 1000).toLocaleDateString("uk-UA")}</p>

                  {ticket.cancelledAt && (
                    <p className="status-date">
                      Скасовано: {new Date(ticket.cancelledAt.seconds * 1000).toLocaleDateString("uk-UA")}
                    </p>
                  )}
                  {ticket.usedAt && (
                    <p className="status-date">
                      Використано: {new Date(ticket.usedAt.seconds * 1000).toLocaleDateString("uk-UA")}
                    </p>
                  )}

                  {ticket.status === "valid" && (
                    <p className="flip-hint">Натисніть, щоб побачити QR-код →</p>
                  )}
                </div>

                {/* Зворотна сторона — тільки для дійсних */}
                {ticket.status === "valid" && (
                  <div className="ticket-back" onClick={() => toggleFlip(ticket.id)}>
                    <div className="qr-container-large">
                      <QRCodeSVG value={ticket.id} size={280} level="H" />
                    </div>
                    <p className="flip-hint">← Натисніть, щоб повернутися</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default TicketHistory;