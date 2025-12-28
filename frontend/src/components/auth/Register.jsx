import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../firebase/config"; // Переконайся, що db імпортовано
import { doc, setDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");   // Ім'я
  const [lastName, setLastName] = useState("");     // Прізвище
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Базова валідація
    if (!firstName.trim() || !lastName.trim()) {
      setError("Будь ласка, введіть ім'я та прізвище");
      setLoading(false);
      return;
    }

    try {
      // Створюємо користувача в Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Оновлюємо displayName в Auth (ім'я + прізвище)
      const displayName = `${firstName.trim()} ${lastName.trim()}`;
      await updateProfile(user, { displayName });

      // Зберігаємо додаткові дані в Firestore (колекція users)
      await setDoc(doc(db, "users", user.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName,
        email: user.email,
        photoURL: "", // за замовчуванням порожньо
        phoneNumber: "",
        city: "",
        createdAt: new Date()
      });

      // Переходимо в профіль
      navigate("/profile");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Цей email вже зареєстровано");
      } else if (err.code === "auth/weak-password") {
        setError("Пароль має бути мінімум 6 символів");
      } else {
        setError("Помилка реєстрації. Спробуйте ще раз.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-form">
      <h2>Реєстрація</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Ім'я"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Прізвище"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Пароль (мін. 6 символів)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength="6"
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Реєстрація..." : "Зареєструватися"}
        </button>
      </form>

      <p>
        Вже є акаунт? <Link to="/login">Увійти</Link>
      </p>
    </section>
  );
}

export default Register;