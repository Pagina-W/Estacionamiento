import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

export default function RutaProtegida({ roles, children }) {
  const { ses } = useApp()

  // Sin sesión: manda al acceso del rol que pide la ruta
  if (!ses) return <Navigate to={'/acceso?rol=' + roles[0]} replace />

  // El administrador puede ver todo
  if (ses.role === 'administrador' || roles.includes(ses.role)) return children

  // Rol incorrecto: de regreso al inicio
  return <Navigate to="/" replace />
}