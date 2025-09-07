import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './NavBar.module.css';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('');

  const handleToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = (item) => {
    setActiveItem(item);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    let lastScroll = 0;
    const handleScroll = () => {
      const navbar = document.querySelector(`.${styles.navbar}`);
      const currentScroll = window.pageYOffset;
      
      if (currentScroll > lastScroll && currentScroll > 50) {
        navbar.classList.add(`${styles.hide}`);
      } else {
        navbar.classList.remove(`${styles.hide}`);
      }
      lastScroll = currentScroll;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link to="/" onClick={() => handleNavClick('')}>
          <span className={styles.logoIcon}>🍺</span>
          <span className={styles.logoText}>CURENTU'</span>
        </Link>
      </div>
      
      <button 
        className={`${styles.menuToggle} ${isMenuOpen ? styles.active : ''}`} 
        onClick={handleToggle}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      
      <ul className={`${styles.navList} ${isMenuOpen ? styles.active : ''}`}>
        <li className={styles.navItem}>
          <Link 
            to="/" 
            className={`${styles.navLink} ${activeItem === 'dashboard' ? styles.active : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <span className={styles.navIcon}>📋</span>
            Dashboard
          </Link>
        </li>
        <li className={styles.navItem}>
          <Link 
            to="/materii-prime" 
            className={`${styles.navLink} ${activeItem === 'materii-prime' ? styles.active : ''}`}
            onClick={() => handleNavClick('materii-prime')}
          >
            <span className={styles.navIcon}>🌾</span>
            Materii Prime
          </Link>
        </li>
        <li className={styles.navItem}>
          <Link 
            to="/productie" 
            className={`${styles.navLink} ${activeItem === 'productie' ? styles.active : ''}`}
            onClick={() => handleNavClick('productie')}
          >
            <span className={styles.navIcon}>🏭</span>
            Producție
          </Link>
        </li>
        <li className={styles.navItem}>
          <Link 
            to="/ambalare" 
            className={`${styles.navLink} ${activeItem === 'ambalare' ? styles.active : ''}`}
            onClick={() => handleNavClick('ambalare')}
          >
            <span className={styles.navIcon}>📦</span>
            Ambalare
          </Link>
        </li>
        <li className={styles.navItem}>
          <Link 
            to="/depozitare" 
            className={`${styles.navLink} ${activeItem === 'depozitare' ? styles.active : ''}`}
            onClick={() => handleNavClick('depozitare')}
          >
            <span className={styles.navIcon}>🗄️</span>
            Depozitare
          </Link>
        </li>
        <li className={styles.navItem}>
          <Link 
            to="/rebuturi" 
            className={`${styles.navLink} ${activeItem === 'rebuturi' ? styles.active : ''}`}
            onClick={() => handleNavClick('rebuturi')}
          >
            <span className={styles.navIcon}>🗑️</span>
            Rebuturi
          </Link>
        </li>
      </ul>
      
      <div className={`${styles.navOverlay} ${isMenuOpen ? styles.active : ''}`} onClick={() => setIsMenuOpen(false)}></div>
    </nav>
  );
};

export default NavBar;