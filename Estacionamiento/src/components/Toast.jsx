import { useApp } from '../context/AppContext.jsx'

export default function Toast() {
  const { msg } = useApp()
  return <div className="tw" style={{ display: msg ? 'block' : 'none' }}>{msg}</div>
}
