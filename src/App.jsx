import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AdminPage from './pages/AdminPage'
import GuestLobbyPage from './pages/GuestLobbyPage'
import BingoRoomGuestPage from './pages/BingoRoomGuestPage'
import QuizRoomGuestPage from './pages/QuizRoomGuestPage'
import AdivinaRoomGuestPage from './pages/AdivinaRoomGuestPage'
import DeseosGuestPage from './pages/DeseosGuestPage'
import TimelineGuestPage from './pages/TimelineGuestPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing: code entry for guests, admin login link */}
        <Route path="/" element={<LandingPage />} />

        {/* Admin panel (unified, Google OAuth protected) */}
        <Route path="/admin/*" element={<AdminPage />} />

        {/* Guest: room lobby + game routes */}
        <Route path="/:code" element={<GuestLobbyPage />} />
        <Route path="/:code/bingo" element={<BingoRoomGuestPage />} />
        <Route path="/:code/quiz" element={<QuizRoomGuestPage />} />
        <Route path="/:code/adivina" element={<AdivinaRoomGuestPage />} />
        <Route path="/:code/deseos" element={<DeseosGuestPage />} />
        <Route path="/:code/timeline" element={<TimelineGuestPage />} />
      </Routes>
    </BrowserRouter>
  )
}
