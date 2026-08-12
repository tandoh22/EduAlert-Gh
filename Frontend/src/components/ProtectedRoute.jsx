import { Navigate } from 'react-router-dom'

const isLoggedIn = () => !!localStorage.getItem('edualert_token')

export default function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/" replace />
}
