import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase/config";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot, orderBy, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { QRCodeSVG } from "qrcode.react";
import eventsData from "../data/events.json";
import "./Profile.css";

function Profile() {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [savedEvents, setSavedEvents] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [profileData, setProfileData] = useState({
    displayName: "",
    phoneNumber: "",
    city: "",
    photoURL: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState(profileData);
  const [uploading, setUploading] = useState(false);
  const [closingModal, setClosingModal] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setSavedEvents([]);
      setPurchaseHistory([]);
      return;
    }

    // Профіль
    const userRef = doc(db, "users", user.uid);
    const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData(data);
        setTempData(data);
      } else {
        const defaultData = {
          displayName: user.email.split("@")[0],
          phoneNumber: "",
          city: "",
          photoURL: ""
        };
        setDoc(userRef, defaultData);
        setProfileData(defaultData);
        setTempData(defaultData);
      }
    });

    // Збережені події
    const qSaved = query(collection(db, "savedEvents"), where("userId", "==", user.uid));
    const unsubscribeSaved = onSnapshot(qSaved, (snapshot) => {
      const savedIds = snapshot.docs.map(doc => doc.data().eventId);
      const savedList = eventsData.filter(event => savedIds.includes(event.id));
      setSavedEvents(savedList);
    });

    // Історія квитків
    const qTickets = query(
      collection(db, "tickets"),
      where("userId", "==", user.uid),
      orderBy("purchasedAt", "desc")
    );
    const unsubscribeTickets = onSnapshot(qTickets, (snapshot) => {
      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPurchaseHistory(tickets);
    });

    // Правильний cleanup — всі unsubscribe!
    return () => {
      unsubscribeProfile();
      unsubscribeSaved();
      unsubscribeTickets();
    };
  }, [user]);

  useEffect(() => {
    if (isEditing) {
      // Фокус на першому input
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }

      // Закриття на Esc
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          handleCancel();
        }
      };
      window.addEventListener('keydown', handleEsc);

      return () => {
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isEditing]);

  

 const saveProfile = async () => {
  const token = await user.getIdToken();

  const response = await fetch("http://localhost:3000/api/update-profile", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(tempData)
  });

  if (response.ok) {
    setProfileData(tempData);
    setIsEditing(false);
    alert("Профіль оновлено!");
  }
};

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const getEventTitle = (eventId) => {
    const event = eventsData.find(e => e.id === eventId);
    return event ? event.title : "Невідома подія";
  };

  const getEventPrice = (eventId) => {
    const event = eventsData.find(e => e.id === eventId);
    return event && event.min_price > 0 ? `від ${event.min_price} грн` : "Вхід вільний";
  };

  const handleCancel = () => {
    setClosingModal(true);
    setTimeout(() => {
      setIsEditing(false);
      setTempData(profileData);
      setClosingModal(false);
    }, 400); // Тривалість анімації закриття
  };

  if (!user) {
    return <section className="profile"><h2>Увійдіть в акаунт</h2></section>;
  }

  return (
    <section className="profile">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
  <img 
    src={profileData.photoURL || `https://ui-avatars.com/api/?name=${profileData.displayName || user.email}&background=c084fc&color=fff&size=200`}
    alt="Аватар"
    className="profile-avatar-img"
  />
  
  {/* Кнопка тепер всередині wrapper і під аватаркою */}
  <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
    Редагувати профіль
  </button>
</div>

          <div className="profile-info">
            {/* Головний заголовок — повне ім'я, якщо є */}
  <h2>
    {profileData.displayName 
      ? profileData.displayName 
      : (profileData.firstName && profileData.lastName 
          ? `${profileData.firstName} ${profileData.lastName}`
          : user.email.split("@")[0]
        )
    }
  </h2>
            {/* Окремо показуємо ім'я та прізвище, якщо вони є */}
  {profileData.firstName && (
    <p><strong>Ім'я:</strong> {profileData.firstName}</p>
  )}
  {profileData.lastName && (
    <p><strong>Прізвище:</strong> {profileData.lastName}</p>
  )}

  {/* Емейл завжди показуємо нижче */}
  <p><strong>Email:</strong> {user.email}</p>
          </div>
        </div>

        <div className="stats">
          <div className="stat-item">
            <div className="stat-number">{savedEvents.length}</div>
            <div className="stat-label">Збережено подій</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{purchaseHistory.length}</div>
            <div className="stat-label">Куплено квитків</div>
          </div>
          
        </div>

        <h3>Збережені події</h3>
        {savedEvents.length === 0 ? (
          <p className="empty-message">
            Ви ще не зберегли жодної події.<br/>
            Перейдіть на головну і натисніть ❤️ біля вподобаної афіші!
          </p>
        ) : (
          <ul className="saved-list">
            {savedEvents.map(event => (
              <li key={event.id}>
                {event.image && <img src={event.image} alt={event.title} className="saved-poster" />}
                <div className="saved-info">
                  <strong>{event.title}</strong>
                  <p>{event.date} о {event.time}</p>
                  <p>{event.location}</p>
                </div>
                <button onClick={() => navigate(`/event/${event.id}`)}>Деталі</button>
              </li>
            ))}
          </ul>
        )}

        <h3>Історія покупок квитків</h3>
        <p className="history-link">
          Ви купили {purchaseHistory.length} квитків. 
          <Link to="/ticket-history">Переглянути повну історію →</Link>
        </p>
        <div className="profile-actions">
          <button onClick={() => navigate("/")}>Переглянути всі події</button>
          <button onClick={() => navigate("/tickets")}>Придбати квиток</button>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Вийти з акаунту
        </button>

        {/* Модальне вікно редагування */}
        
{isEditing && (
  <div className="edit-modal-overlay" onClick={handleCancel}>
    <div className={`edit-modal ${closingModal ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
      <button className="close-btn" onClick={handleCancel} aria-label="Закрити">
        ×
      </button>
      <h3>Редагувати профіль</h3>

      

      <div className="form-fields">
        <input
          ref={firstInputRef}
          type="text"
          placeholder="Ім'я"
          value={tempData.firstName}
          onChange={(e) => setTempData({...tempData, firstName: e.target.value})}
        />

        <input
          type="tel"
          placeholder="Прізвище"
          value={tempData.lastName}
          onChange={(e) => setTempData({...tempData, lastName: e.target.value})}
        />

      
      </div>

      {/* Кнопки знизу: спочатку Зберегти, потім Скасувати */}
      <div className="modal-actions">
        <button className="save-btn" onClick={saveProfile}>
          Зберегти зміни
        </button>
        <button className="cancel-btn" onClick={handleCancel}>
          Скасувати
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </section>
  );
}

export default Profile;

