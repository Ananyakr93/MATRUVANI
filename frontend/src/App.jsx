import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import OfflineBanner from '@/components/OfflineBanner'
import { Toaster } from '@/components/ui/sonner'

import Welcome from '@/pages/Welcome'
import Demo from '@/pages/Demo'
import ASHALogin from '@/pages/asha/ASHALogin'
import ASHAHome from '@/pages/asha/ASHAHome'
import ScreeningFlow from '@/pages/asha/ScreeningFlow'
import FreeSpeech from '@/pages/asha/FreeSpeech'
import ResultCard from '@/pages/asha/ResultCard'
import SessionHistory from '@/pages/asha/SessionHistory'

import DoctorLogin from '@/pages/doctor/DoctorLogin'
import DoctorDashboard from '@/pages/doctor/DoctorDashboard'

import DistrictLogin from '@/pages/district/DistrictLogin'
import DistrictDashboard from '@/pages/district/DistrictDashboard'
import { useOfflineQueue } from '@/hooks/useOfflineQueue'

const ProtectedRoute = ({ children, allowedRole }) => {
  const role = useAppStore((state) => state.role)
  if (role !== allowedRole) {
    return <Navigate to={`/${allowedRole}/login`} replace />
  }
  return children
}

export default function App() {
  // Initialize global offline queue manager
  useOfflineQueue()

  return (
    <BrowserRouter>
      <OfflineBanner />
      <Toaster />
      <Routes>
        <Route path="/" element={<Welcome />} />
        
        {/* ASHA Routes */}
        <Route path="/asha/login" element={<ASHALogin />} />
        <Route path="/asha/home" element={
          <ProtectedRoute allowedRole="asha"><ASHAHome /></ProtectedRoute>
        } />
        <Route path="/asha/screen" element={
          <ProtectedRoute allowedRole="asha"><ScreeningFlow /></ProtectedRoute>
        } />
        <Route path="/asha/free-speech" element={
          <ProtectedRoute allowedRole="asha"><FreeSpeech /></ProtectedRoute>
        } />
        <Route path="/asha/result" element={
          <ProtectedRoute allowedRole="asha"><ResultCard /></ProtectedRoute>
        } />
        <Route path="/asha/history" element={
          <ProtectedRoute allowedRole="asha"><SessionHistory /></ProtectedRoute>
        } />

        {/* Doctor Routes */}
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/doctor/dashboard" element={
          <ProtectedRoute allowedRole="doctor"><DoctorDashboard /></ProtectedRoute>
        } />

        {/* District Routes */}
        <Route path="/district/login" element={<DistrictLogin />} />
        <Route path="/district/dashboard" element={
          <ProtectedRoute allowedRole="district"><DistrictDashboard /></ProtectedRoute>
        } />

        {/* Demo */}
        <Route path="/demo" element={<Demo />} />
      </Routes>
    </BrowserRouter>
  )
}
