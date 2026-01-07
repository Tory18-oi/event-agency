import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import eventsData from "../data/events.json";
import "./EventList.css";

function EventList() {
  const [savedEvents, setSavedEvents] = useState([]);
  const [purchasedTickets, setPurchasedTickets] = useState([]);
  const user = auth.currentUser;

  // Стани для фільтрації
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Функція для витягування міста з location
  const getCityFromLocation = (location) => {
    if (!location) return "Інше";

    // Список міст з твоєї JSON
    const cityMap = {
      "Івано-Франківськ": "Івано-Франківськ",
      "Київ": "Київ",
      "Львів": "Львів",
      "Дрогобич": "Дрогобич",
      "Чернівці": "Чернівці"
    };

    for (const city of Object.keys(cityMap)) {
      if (location.includes(city)) {
        return city;
      }
    }

    // Запасний варіант — беремо текст після останньої коми (зазвичай місто)
    const parts = location.split(",");
    if (parts.length > 1) {
      const potentialCity = parts[parts.length - 2].trim();
      // Перевіряємо, чи це одне з відомих міст
      if (Object.keys(cityMap).includes(potentialCity)) {
        return potentialCity;
      }
    }
    return "Інше";
  };

  // Унікальні міста (сортовані)
  const cities = [...new Set(eventsData.map(event => getCityFromLocation(event.location)))].sort();

  // Завантаження збережених і куплених
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const savedQ = query(collection(db, "savedEvents"), where("userId", "==", user.uid));
        const savedSnap = await getDocs(savedQ);
        const savedIds = savedSnap.docs.map(doc => doc.data().eventId);
        setSavedEvents(savedIds);

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

  // Функція збереження (залишається без змін)
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

  // Фільтрація подій
  const filteredEvents = eventsData.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMinPrice = minPrice === "" || event.min_price >= Number(minPrice);
    const matchesMaxPrice = maxPrice === "" || event.max_price <= Number(maxPrice);
    const matchesCity = selectedCity === "" || getCityFromLocation(event.location) === selectedCity;
    const eventDateISO = event.date.split(".").reverse().join("-"); // "21.01.2026" → "2026-01-21"
    const matchesDate = selectedDate === "" || eventDateISO === selectedDate;

    return matchesSearch && matchesMinPrice && matchesMaxPrice && matchesCity && matchesDate;
  });

  // Персональні рекомендації (без змін)
  const userInterests = [...new Set([
    ...savedEvents.map(id => eventsData.find(ev => ev.id === id)),
    ...purchasedTickets.map(id => eventsData.find(ev => ev.id === id))
  ].filter(Boolean))];

  const recommendedEvents = eventsData
    .filter(event => {
      return userInterests.some(interest => 
        interest.type === event.type || interest.region_id === event.region_id
      );
    })
    .filter(event => !savedEvents.includes(event.id) && !purchasedTickets.includes(event.id))
    .slice(0, 6);

  return (
    <section id="events">
      <h2>Афіші подій</h2>

      {/* Форма фільтрації */}
      <div className="filters-container">
        <input
          type="text"
          placeholder="Пошук по назві..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <input
          type="number"
          placeholder="Мін. ціна"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
        <input
          type="number"
          placeholder="Макс. ціна"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
        <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
          <option value="">Всі міста</option>
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <button onClick={() => {
          setSearchTerm("");
          setMinPrice("");
          setMaxPrice("");
          setSelectedCity("");
          setSelectedDate("");
        }}>
          Очистити фільтри
        </button>
      </div>

      {/* Основна афіша */}
      <div className="events-grid">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
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
          ))
        ) : (
          <p>Події за вибраними фільтрами не знайдено.</p>
        )}
      </div>

      {/* Персональні рекомендації */}
      {user && recommendedEvents.length > 0 && (
        <>
          <h2 className="recommendations-title">Рекомендації для вас</h2>
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
                    {savedEvents.includes(event.id) ? "Збережено" : "♡ Зберегти"}
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