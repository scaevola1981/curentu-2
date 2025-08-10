import NavBar from './Componente/NavBar/NavBar'
import Ambalare from "./pages/Ambalare/Ambalare";
import Dashboard from "./pages/Dashboard/Dashboard";
import MateriiPrime from "./pages/MateriiPrime/MateriiPrime";
import Productie from "./pages/Productie/Productie";
import Depozitare from "./pages/Depozitare/Depozitare";
import Rebuturi from "./pages/Rebuturi/Rebuturi";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const App = () => {
  return (
    <>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="materii-prime" element={<MateriiPrime />} />
        <Route path="productie" element={<Productie />} />
        <Route path="ambalare" element={<Ambalare />} />
        <Route path="depozitare" element={<Depozitare />} />
        <Route path="rebuturi" element={<Rebuturi />} />
      </Routes>
   
    </>
  );
};

export default App;
