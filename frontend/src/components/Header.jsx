import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";
import { signOut, onAuthStateChanged } from "firebase/auth";
import "./Header.css";

function Header() {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Закриваємо дропдаун при кліку поза ним
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".user-section")) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header>
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>Event Agency</h1>
        </Link>

        {/* Панель навігації — тільки на десктопі */}
        <nav className="main-nav desktop-only">
          <Link to="/">Події</Link>
          {user && <Link to="/tickets">Квитки</Link>}
          {user && (
            <Link to="/scanner" className="scanner-link">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 4h6M4 4v6M20 4h-6M20 4v6M4 20h6M4 20v-6M20 20h-6M20 20v-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>Сканер</span>
            </Link>
          )}
        </nav>

        {/* Іконка користувача */}
        <div className="user-section">
          <button className="user-icon-btn" onClick={toggleDropdown}>
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" />
            </svg>
          </button>

          {/* Єдине дропдаун-меню */}
{dropdownOpen && (
  <div className="dropdown-menu">
    {user ? (
      <>
        <p className="user-email">{user.email.split("@")[0]}</p>

        {/* Навігація — тільки на мобілках */}
        <div className="mobile-nav-links">
          <Link to="/" onClick={() => setDropdownOpen(false)}>Події</Link>
          <Link to="/tickets" onClick={() => setDropdownOpen(false)}>Квитки</Link>
          <Link to="/scanner" onClick={() => setDropdownOpen(false)}>Сканер</Link>
        </div>

        {/* Профільні посилання — завжди */}
        <Link to="/profile" onClick={() => setDropdownOpen(false)}>Мій кабінет</Link>
        <Link to="/my-tickets" onClick={() => setDropdownOpen(false)}>Мої квитки</Link>
        <button onClick={handleLogout} className="logout-link">
          Вийти
        </button>
      </>
    ) : (
      <>
        <Link to="/" onClick={() => setDropdownOpen(false)}>Події</Link>
        <Link to="/login" onClick={() => setDropdownOpen(false)}>Вхід</Link>
        <Link to="/register" onClick={() => setDropdownOpen(false)}>Реєстрація</Link>
      </>
    )}
  </div>
)}
        </div>
      </div>
    </header>
  );
}

export default Header;