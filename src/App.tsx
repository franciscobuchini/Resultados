import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import HomePage from './pages/HomePage'
import TournamentPage from './pages/TournamentPage'
import AdminPage from './pages/AdminPage'
import ProfilePage from './pages/ProfilePage'
import Error404 from './pages/Error404'
import ThemeProvider from './functions/themeStore'
import ScrollToTop from './functions/scrollToTop'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <MainLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tournament/:tournamentId" element={<TournamentPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Error404 />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </ThemeProvider>
  )
}
