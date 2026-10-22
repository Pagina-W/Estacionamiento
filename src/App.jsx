import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Toast from './components/Toast.jsx'
import Inicio from './pages/Inicio.jsx'
import Acceso from './pages/Acceso.jsx'
import Lugar from './pages/Lugar.jsx'
import Propietario from './pages/Propietario.jsx'
import Cliente from './pages/Cliente' 

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/acceso" element={<Acceso />} />
        <Route path="/lugar/:id" element={<Lugar />} />
        <Route path="/propietario" element={<Propietario />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/cliente" element={<Cliente />} />
        
      </Routes>
      <Footer />
      <Toast />
    </>
  )
}
