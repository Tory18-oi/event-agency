import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import EventList from "./components/EventList.jsx";
import EventDetails from "./components/EventDetails.jsx";
import TicketPurchase from "./components/TicketPurchase.jsx";
import Login from "./components/auth/Login.jsx";
import Register from "./components/auth/Register.jsx";
import Profile from "./components/Profile.jsx";
import Scanner from "./components/Scanner.jsx";  // ← Додаємо імпорт Scanner
import { auth } from "./firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";
import CursorSparkles from "./components/CursorSparkles.jsx";  // ← Додаємо імпорт
import MyTickets from "./components/MyTickets.jsx";
import TicketHistory from "./components/TicketHistory";

// Компонент захищеного маршруту
function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <h2>Завантаження...</h2>;

  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <div>
      <CursorSparkles />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<EventList />} />
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Захищені маршрути */}
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <TicketPurchase />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
import MyTickets from "./components/MyTickets.jsx";

// ... в Routes
<Route
  path="/my-tickets"
  element={
    <ProtectedRoute>
      <MyTickets />
    </ProtectedRoute>
  }
/>
<Route path="/ticket-history" element={<ProtectedRoute><TicketHistory /></ProtectedRoute>} />
          {/* Сканер квитків — можна зробити захищеним або відкритим */}
          {/* Якщо тільки для адміна — загорни в ProtectedRoute */}
          <Route path="/scanner" element={<Scanner />} />
          {/* Або захищений варіант: */}
          {/* <Route
            path="/scanner"
            element={
              <ProtectedRoute>
                <Scanner />
              </ProtectedRoute>
            }
          /> */}

          {/* 404 */}
          <Route path="*" element={<h2>Сторінку не знайдено</h2>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;