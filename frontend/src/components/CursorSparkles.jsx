import React, { useEffect } from "react";

function CursorSparkles() {
  useEffect(() => {
    let trail = [];

    const createParticle = (x, y) => {
      const particle = document.createElement("div");
      particle.className = "trail-particle";

      // Блідо-рожеві відтінки + трохи білого і лавандового
      const colors = [
        "#fce7f3", // дуже блідий рожевий
        "#f8d1e6",
        "#f5b8d6",
        "#f7a8cf",
        "#f9a8d4",
        "#fbb6ce",
        "#ffccd5",
        "#ffe4e1",
        "#e9d5ff", // легка лаванда для різноманітності
        "#f0abfc"
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const size = Math.random() * 6 + 3;

      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.backgroundColor = color;
      particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;

      document.body.appendChild(particle);

      // Анімація зникнення і руху
      const duration = Math.random() * 1000 + 800;
      const offsetX = (Math.random() - 0.5) * 30;
      const offsetY = (Math.random() - 0.5) * 30;

      particle.style.transition = `all ${duration}ms ease-out`;

      setTimeout(() => {
        particle.style.opacity = "0";
        particle.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(0)`;
      }, 10);

      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, duration + 100);

      // Обмежуємо кількість частинок (щоб не гальмувало)
      trail.push(particle);
      if (trail.length > 40) {
        const old = trail.shift();
        if (old.parentNode) old.parentNode.removeChild(old);
      }
    };

    const handleMouseMove = (e) => {
      // Створюємо 2-4 частинки при кожному русі
      const count = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          createParticle(e.clientX, e.clientY);
        }, i * 30);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      trail.forEach(p => p.parentNode && p.parentNode.removeChild(p));
    };
  }, []);

  return null;
}

export default CursorSparkles;