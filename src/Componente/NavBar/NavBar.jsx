import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './NavBar.module.css';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Hide on scroll
  useEffect(() => {
    let last = 0;
    const nav = document.querySelector(`.${styles.navbar}`);

    const onScroll = () => {
      const curr = window.pageYOffset;
      if (curr > last && curr > 50) nav.classList.add(styles.hide);
      else nav.classList.remove(styles.hide);
      last = curr;
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { to: "/", label: "Dashboard", icon: "📊" },
    { to: "/materii-prime", label: "Materii Prime", icon: "🌾" },
    { to: "/productie", label: "Producție", icon: "⚗️" },
    { to: "/ambalare", label: "Ambalare", icon: "📦" },
    { to: "/depozitare", label: "Depozitare", icon: "🏚️" },
    { to: "/rebuturi", label: "Rebuturi", icon: "🗑️" },
    { to: "/setari", label: "Setări", icon: "⚙️" },
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.left}>
        <Link to="/" className={styles.brand}>
          <span className={styles.logo}>⚡</span>
          <span className={styles.brandText}>CURENTU'</span>
        </Link>
      </div>

      <button
        className={`${styles.menuBtn} ${isMenuOpen ? styles.open : ""}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <span></span><span></span><span></span>
      </button>

      <ul className={`${styles.navList} ${isMenuOpen ? styles.show : ""}`}>
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className={`${styles.navLink} ${location.pathname === l.to ? styles.active : ""}`}
            >
              <span className={styles.icon}>{l.icon}</span>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>

      <div
        className={`${styles.overlay} ${isMenuOpen ? styles.show : ""}`}
        onClick={() => setIsMenuOpen(false)}
      />
    </nav>
  );
};

export default NavBar;
