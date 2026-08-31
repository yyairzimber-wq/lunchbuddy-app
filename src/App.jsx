import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Splash from './components/Splash'
import Landing from './pages/Landing'
import RoleGate from './pages/RoleGate'
import ChildSetup from './pages/ChildSetup'
import KidView from './pages/KidView'
import ParentDashboard from './pages/ParentDashboard'
import { useApp } from './context/AppContext'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const { ready } = useApp()

  if (showSplash || !ready) {
    return <Splash onDone={() => setShowSplash(false)} />
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
