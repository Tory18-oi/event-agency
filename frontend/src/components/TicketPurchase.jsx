import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { auth, db } from "../firebase/config";
import { collection, addDoc, deleteDoc, query, where, getDocs } from "firebase/firestore";
import eventsData from "../data/events.json";
import "./TicketPurchase.css";
import { useNavigate,Link } from "react-router-dom";


function TicketPurchase() {
  const user = auth.currentUser;
  const [purchasedTickets, setPurchasedTickets] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");

  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      const fetchTickets = async () => {
        const q = query(collection(db, "tickets"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const tickets = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPurchasedTickets(tickets);
      };
      fetchTickets();
    }
  }, [user]);

  const hasTicketForEvent = (eventId) => {
    return purchasedTickets.some(ticket => ticket.eventId === eventId);
  };

const buyTicket = async () => {
  const token = await user.getIdToken();

  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/buy-ticket`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ eventId: selectedEvent })
});

  if (response.ok) {
    alert("Квиток куплено!");
    // оновити стан або перенаправити
  }
};

  const cancelTicket = async (ticketId) => {
    if (!confirm("Повернути квиток? Гроші не повертаються :)")) return;

    try {
      await deleteDoc(doc(db, "tickets", ticketId));
      setPurchasedTickets(purchasedTickets.filter(t => t.id !== ticketId));
      alert("Квиток скасовано");
    } catch (error) {
      alert("Помилка при скасуванні");
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
    return <section id="tickets"><h2>Увійдіть, щоб купити квиток</h2></section>;
  }

  return (
  <section id="tickets">
    <h2>Придбати квиток</h2>

   <div className="purchase-form">
  <div className="select-wrapper">
    <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
      <option value="">Оберіть подію</option>
      {eventsData.map(event => (
        <option key={event.id} value={event.id} disabled={hasTicketForEvent(event.id)}>
          {event.title} — {event.date} ({getEventPrice(event.id)})
          {hasTicketForEvent(event.id) && " (вже куплено)"}
        </option>
      ))}
    </select>
  </div>

  <button onClick={buyTicket} className="buy-btn">
    Купити квиток
  </button>
</div>

    
  </section>
);
}

export default TicketPurchase;