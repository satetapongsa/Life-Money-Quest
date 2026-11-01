import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { inject } from '@vercel/analytics'
import { setupPwa } from './lib/install'
import App from './App'
import './styles.css'

// กันจอขาว: ถ้ามีอะไรพัง ให้ผู้เล่นเริ่มใหม่ได้
class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="card" style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
        <h2 className="stage-title" style={{ justifyContent: 'center' }}>อุ๊ย มีบางอย่างผิดพลาด 😵</h2>
        <p className="lead">ลิงก์นี้อาจไม่ถูกต้อง ลองเริ่มเกมใหม่อีกครั้งนะ</p>
        <button className="btn" onClick={() => window.location.assign(window.location.pathname)}>เริ่มใหม่</button>
      </div>
    )
  }
}

// นับผู้เข้าชมแบบไม่เก็บข้อมูลส่วนตัว (ต้องเปิด Web Analytics ในหน้าโปรเจกต์ Vercel)
inject()
setupPwa()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
