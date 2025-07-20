import styles from './dashboard.module.css'
import NavBar from '../../Componente/NavBar/NavBar'

const Dashboard = () => {
  return (
    <>
    <NavBar/>
     <div className={styles.dashboard}>Dashboard</div>
    </>
   
  )
}

export default Dashboard