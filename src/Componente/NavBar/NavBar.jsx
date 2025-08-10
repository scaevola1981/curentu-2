import styles from './NavBar.module.css'
import { Link } from "react-router-dom";

const NavBar = () => {
  return (
    <nav className={styles.navbar}>
      <ul>
        <li>
          <Link to="/">Dashboard</Link>
        </li>
        <li>
          <Link to="/materii-prime">Materii</Link>
        </li>
        <li>
          <Link to="/productie">Productie</Link>
        </li>
        <li>
          <Link to="/ambalare">Ambalare</Link>
        </li>
        <li>
          <Link to="/Depozitare">Depozitare</Link>
        </li>
        <li>
          <Link to="/rebuturi">Rebuturi</Link>
        </li>
      </ul>
    </nav>
  );
};

export default NavBar;
