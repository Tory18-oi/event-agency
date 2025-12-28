import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs,addDoc, deleteDoc } from "firebase/firestore";
import eventsData from "../data/events.json";
import "./EventList.css";

function EventList() {
  const [savedEvents, setSavedEvents] = useState([]);
  const [purchasedTickets, setPurchasedTickets] = useState([]);
  const user = auth.currentUser;

  // Завантажуємо збережені події і куплені квитки
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        // Збережені
        const savedQ = query(collection(db, "savedEvents"), where("userId", "==", user.uid));
        const savedSnap = await getDocs(savedQ);
        const savedIds = savedSnap.docs.map(doc => doc.data().eventId);
        setSavedEvents(savedIds);

        // Куплені квитки
        const ticketsQ = query(collection(db, "tickets"), where("userId", "==", user.uid));
        const ticketsSnap = await getDocs(ticketsQ);
        const ticketEventIds = ticketsSnap.docs.map(doc => doc.data().eventId);
        setPurchasedTickets(ticketEventIds);
      };
      fetchData();
    } else {
      setSavedEvents([]);
      setPurchasedTickets([]);
    }
  }, [user]);

  // Функція збереження (як раніше)
const toggleSaveEvent = async (eventId) => {
  if (!user) {
    alert("Увійдіть в акаунт!");
    return;
  }

  const isSaved = savedEvents.includes(eventId);
  const endpoint = isSaved ? "/api/unsave-event" : "/api/save-event";

  try {
    const token = await user.getIdToken();

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ eventId })
    });

    if (response.ok) {
      // Оновлюємо локальний стан
      if (isSaved) {
        setSavedEvents(savedEvents.filter(id => id !== eventId));
      } else {
        setSavedEvents([...savedEvents, eventId]);
      }
    } else {
      const errorData = await response.json();
      alert(errorData.error || "Помилка збереження");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    alert("Помилка мережі або бекенд не відповідає");
  }
};

  // Персональні рекомендації
  const userInterests = [...new Set([
    ...savedEvents.map(id => {
      const e = eventsData.find(ev => ev.id === id);
      return { type: e?.type, region: e?.region_id };
    }),
    ...purchasedTickets.map(id => {
      const e = eventsData.find(ev => ev.id === id);
      return { type: e?.type, region: e?.region_id };
    })
  ].filter(Boolean))];

  const recommendedEvents = eventsData
    .filter(event => {
      return userInterests.some(interest => 
        interest.type === event.type || interest.region === event.region_id
      );
    })
    .filter(event => !savedEvents.includes(event.id) && !purchasedTickets.includes(event.id))
    .slice(0, 6);

  return (
    <section id="events">
      <h2>Афіші подій</h2>
      <div className="events-grid">
        {eventsData.map((event) => (
          <div key={event.id} className="event-card">
            <Link to={`/event/${event.id}`}>
              {event.image && <img src={event.image} alt={event.title} className="event-poster" />}
              <div className="event-info">
                <h3>{event.title}</h3>
                <p>{event.date} о {event.time}</p>
                <p>{event.short_description}</p>
                {event.min_price > 0 ? (
                  <p className="price">від {event.min_price} грн</p>
                ) : (
                  <p className="price">Вхід вільний</p>
                )}
              </div>
            </Link>
            {user && (
              <button
                className={`save-btn ${savedEvents.includes(event.id) ? "saved" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toggleSaveEvent(event.id);
                }}
              >
                {savedEvents.includes(event.id) ? "Збережено" : "♡ Зберегти"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Персональні рекомендації */}
      {user && recommendedEvents.length > 0 && (
        <>
          <h2 className="recommendations-title">Рекомендації для вас </h2>
          <div className="events-grid">
            {recommendedEvents.map((event) => (
              <div key={event.id} className="event-card recommended">
                <Link to={`/event/${event.id}`}>
                  {event.image && <img src={event.image} alt={event.title} className="event-poster" />}
                  <div className="event-info">
                    <h3>{event.title}</h3>
                    <p>{event.date} о {event.time}</p>
                    <p>{event.short_description}</p>
                    <span className="recommended-badge">Рекомендуємо!</span>
                  </div>
                </Link>
                {user && (
                  <button
                    className={`save-btn ${savedEvents.includes(event.id) ? "saved" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleSaveEvent(event.id);
                    }}
                  >
                    {savedEvents.includes(event.id) ? " Збережено" : "♡ Зберегти"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default EventList;