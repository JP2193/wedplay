import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import GuestPage from './pages/GuestPage'
import QuizAdminPage from './pages/QuizAdminPage'
import QuizGuestPage from './pages/QuizGuestPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="/guest" element={<GuestPage />} />
        <Route path="/quiz/admin/*" element={<QuizAdminPage />} />
        <Route path="/quiz" element={<QuizGuestPage />} />
        <Route path="/" element={<Navigate to="/guest" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
