/* Mini enrutador por # (para que la página abra con doble clic, sin servidor) */
import { createContext, useContext, useEffect, useState, Children } from 'react'
const parse = () => {
  const h = location.hash.slice(1) || '/'
  const [p, q = ''] = h.split('?')
  return { path: p || '/', search: q }
}
const Loc = createContext({ path: '/', search: '' })
const Par = createContext({})

export function BrowserRouter({ children }) {
  const [loc, setLoc] = useState(parse())
  useEffect(() => {
    const f = () => { setLoc(parse()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return <Loc.Provider value={loc}>{children}</Loc.Provider>
}
export const useNavigate = () => (to, o) => {
  if (o && o.replace) location.replace('#' + to)
  else location.hash = to
}
export const useParams = () => useContext(Par)
export const useSearchParams = () => [new URLSearchParams(useContext(Loc).search)]
export const Link = ({ to, children, ...r }) => <a href={'#' + to} {...r}>{children}</a>
export function Navigate({ to }) {
  useEffect(() => { location.replace('#' + to) }, [])
  return null
}
export const Route = () => null
export function Routes({ children }) {
  const { path } = useContext(Loc)
  let fallback = null
  for (const c of Children.toArray(children)) {
    const pat = c.props.path
    if (pat === '*') { fallback = c; continue }
    const a = pat.split('/'), b = path.split('/'), params = {}
    if (a.length !== b.length) continue
    if (a.every((s, i) => (s[0] === ':' ? ((params[s.slice(1)] = decodeURIComponent(b[i])), true) : s === b[i])))
      return <Par.Provider value={params}>{c.props.element}</Par.Provider>
  }
  return fallback ? fallback.props.element : null
}
