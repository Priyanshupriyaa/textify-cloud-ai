import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import History from './pages/History'
import DocumentView from './pages/DocumentView'
import Navbar from './components/Navbar'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><><Navbar /><Dashboard /></></PrivateRoute>} />
        <Route path="/upload" element={<PrivateRoute><><Navbar /><Upload /></></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute><><Navbar /><History /></></PrivateRoute>} />
        <Route path="/document/:id" element={<PrivateRoute><><Navbar /><DocumentView /></></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
