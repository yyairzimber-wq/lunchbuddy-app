import { useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Splash from './components/Splash'
import Landing from './pages/Landing'
import FamilyGate from './pages/FamilyGate'
import RoleGate from './pages/RoleGate'
import ChildSetup from './pages/ChildSetup'
import KidView from './pages/KidView'
import ParentDashboard from './pages/ParentDashboard'
import { useApp } from './context/AppContext'
import { firebaseReady } from './firebase'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const { ready, familyId } = useApp()
  const location = useLocation()

  if (showSplash) {
    return <Splash onDone={() => setShowSplash(false)} />
  }

  // /welcome is the public marketing page — it must stay reachable before
  // anyone has created or joined a family.
  if (location.pathname === '/welcome') {
    return <Landing />
  }

  // Every family gets its own Firestore document; without a code the device
  // hasn't created or joined one yet, so it can't reach the rest of the app.
  if (firebaseReady && !familyId) {
    return <FamilyGate />
  }

  if (!ready) {
    return null
  }

  return (
    <Routes>
      <Route path="/welcome" element={<Landing />} />
      <Route path="/" element={<RoleGate />} />
      <Route path="/child-setup" element={<ChildSetup />} />
      <Route path="/kid/:kidId" element={<KidView />} />
      <Route path="/parent" element={<ParentDashboard />} />
    </Routes>
  )
}
