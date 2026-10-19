import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DB } from '../lib/db.js'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

/* Sesión + avisos (toast) + navegación de roles, compartidos por todas las páginas */
export function AppProvider({ children }) {
  const navigate = useNavigate()
  const [ses, setSes] = useState(() => DB.get('ses', null))
  const [msg, setMsg] = useState('')
  const timer = useRef(null)

  const toast = useCallback((m) => {
    setMsg(m)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(''), 2600)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

  const login = (u, role) => {
    const s = { id: u.id, nombre: u.nombre, tel: u.tel, role }
    DB.set('ses', s)
    setSes(s)
    const next = sessionStorage.getItem('gp_next')
    sessionStorage.removeItem('gp_next')
    navigate(role === 'propietario' ? '/propietario' : next || '/')
  }

  const salir = () => {
    DB.remove('ses')
    setSes(null)
    navigate('/')
  }

  const entrar = (r) => {
    if (ses && ses.role === r) return navigate(r === 'propietario' ? '/propietario' : '/')
    navigate('/acceso?rol=' + r)
  }

  return <Ctx.Provider value={{ ses, login, salir, entrar, toast, msg }}>{children}</Ctx.Provider>
}
