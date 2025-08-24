import { useEffect } from 'react';
import styles from './NavBar.module.css';
import { Link } from 'react-router-dom';

const NavBar = () => {
  const handleToggle = () => {
    const navList = document.querySelector(`.${styles.navList}`);
    navList.classList.toggle(`${styles.active}`);
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
  }, []); // Empty dependency array is now safe

  return (
    <nav className={styles.navbar}>
      <button className={styles.menuToggle} onClick={handleToggle}>
        ☰
      </button>
      <ul className={styles.navList}>
        <li className={styles.navItem}>
          <Link to="/" className={styles.navLink}>
            Dashboard
          </Link>
        </li>
        <li className={styles.navItem}>
          <Link to="/materii-prime" className={styles.navLink}>
            Materii Prime
          </Link>
        </li>
        <li className={styles.navItem}>
          <Link to="/productie" className={styles.navLink}>
            Productie
          </Link>
        </li>
        <li className={styles.navItem}>
          <Link to="/ambalare" className={styles.navLink}>
            Ambalare
          </Link>
        </li>
        <li className={styles.navItem}>
          <Link to="/Depozitare" className={styles.navLink}>
            Depozitare
          </Link>
        </li>
        <li className={styles.navItem}>
          <Link to="/rebuturi" className={styles.navLink}>
            Rebuturi
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default NavBar;