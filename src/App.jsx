import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AdminPage from './pages/AdminPage'
import RoomDashboard from './components/admin/RoomDashboard'
import BingoAdminSection from './components/admin/BingoAdminSection'
import QuizAdminSection from './components/admin/QuizAdminSection'
import AdivinaAdminSection from './components/admin/AdivinaAdminSection'
import DeseosAdminSection from './components/admin/DeseosAdminSection'
import TimelineAdminSection from './components/admin/TimelineAdminSection'
import EventDetail from './components/admin/EventDetail'
import QuizEventAdmin from './components/quiz/admin/QuizEventAdmin'
import AdivinaEventAdmin from './components/adivina/admin/AdivinaEventAdmin'
import GuestLobbyPage from './pages/GuestLobbyPage'
import BingoRoomGuestPage from './pages/BingoRoomGuestPage'
import QuizRoomGuestPage from './pages/QuizRoomGuestPage'
import AdivinaRoomGuestPage from './pages/AdivinaRoomGuestPage'
import DeseosGuestPage from './pages/DeseosGuestPage'
import TimelineGuestPage from './pages/TimelineGuestPage'
import QuizDisplayPage from './pages/QuizDisplayPage'
import AdivinaDisplayPage from './pages/AdivinaDisplayPage'
import DeseosDisplayPage from './pages/DeseosDisplayPage'
import DeseosPrintPage from './pages/DeseosPrintPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Admin — layout route con Outlet, sin catch-all anidado */}
        <Route path="/admin" element={<AdminPage />}>
          <Route index element={<RoomDashboard />} />
          <Route path="bingo" element={<BingoAdminSection />} />
          <Route path="bingo/events/:eventId" element={<EventDetail />} />
          <Route path="quiz" element={<QuizAdminSection />} />
          <Route path="quiz/events/:eventId" element={<QuizEventAdmin />} />
          <Route path="adivina" element={<AdivinaAdminSection />} />
          <Route path="adivina/events/:eventId" element={<AdivinaEventAdmin />} />
          <Route path="deseos" element={<DeseosAdminSection />} />
          <Route path="timeline" element={<TimelineAdminSection />} />
        </Route>

        {/* Guest */}
        <Route path="/:code" element={<GuestLobbyPage />} />
        <Route path="/:code/bingo" element={<BingoRoomGuestPage />} />
        <Route path="/:code/quiz" element={<QuizRoomGuestPage />} />
        <Route path="/:code/quiz/display" element={<QuizDisplayPage />} />
        <Route path="/:code/adivina" element={<AdivinaRoomGuestPage />} />
        <Route path="/:code/adivina/display" element={<AdivinaDisplayPage />} />
        <Route path="/:code/deseos" element={<DeseosGuestPage />} />
        <Route path="/:code/deseos/display" element={<DeseosDisplayPage />} />
        <Route path="/:code/deseos/print" element={<DeseosPrintPage />} />
        <Route path="/:code/timeline" element={<TimelineGuestPage />} />
      </Routes>
    </BrowserRouter>
  )
}
