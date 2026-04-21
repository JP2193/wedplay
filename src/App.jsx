import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import GuestPage from './pages/GuestPage'
import QuizAdminPage from './pages/QuizAdminPage'
import QuizGuestPage from './pages/QuizGuestPage'
import LandingPage from './pages/LandingPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/bingo/admin/*" element={<AdminPage />} />
        <Route path="/bingo" element={<GuestPage />} />
        <Route path="/quiz/admin/*" element={<QuizAdminPage />} />
        <Route path="/quiz" element={<QuizGuestPage />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  )
}
