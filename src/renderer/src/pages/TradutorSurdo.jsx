import { useEffect, useRef, useState, useCallback } from 'react'
import styles from '../css/TradutorSurdo.module.css'
import Footer from '../components/Footer'

function TradutorSurdo() {
  const [fraseReconhecida, setFraseReconhecida] = useState('')
  const [frameCamera, setFrameCamera] = useState(null)
  const [respostaOuvinte, setRespostaOuvinte] = useState('')
  const rybenaIniciada = useRef(false)
  const avatarRef = useRef(null)

  const posicionarRybena = useCallback(() => {
    const playerDiv = document.getElementById('rybena-player-div')
    const avatarDiv = avatarRef.current
    if (!playerDiv || !avatarDiv) {
      setTimeout(posicionarRybena, 500)
      return
    }

    const rect = avatarDiv.getBoundingClientRect()
    const playerWidth = 280
    const playerHeight = 490
    const scale = Math.min(rect.width / playerWidth, rect.height / playerHeight)

    playerDiv.style.position = 'fixed'
    playerDiv.style.left = `${rect.left + (rect.width - playerWidth * scale) / 2}px`
    playerDiv.style.top = `${rect.top + (rect.height - playerHeight * scale) / 2}px`
    playerDiv.style.transform = `scale(${scale})`
    playerDiv.style.transformOrigin = 'top left'
    playerDiv.style.zIndex = '10'
  }, [])

  const posicionarSidebar = useCallback(() => {
    const sidebar = document.getElementById('rybena-sidebar')
    if (!sidebar) {
      setTimeout(posicionarSidebar, 500)
      return
    }

    sidebar.style.position = 'fixed'
    sidebar.style.bottom = '18px'
    sidebar.style.left = '320px'
    sidebar.style.transform = 'none'
    sidebar.style.top = 'unset'
    sidebar.style.flexDirection = 'row'
    sidebar.style.gap = '8px'
    sidebar.style.zIndex = '20'

    const optionsDiv = sidebar.querySelector('.options')
    if (optionsDiv) {
      optionsDiv.style.gridTemplateColumns = 'repeat(3, 45px)'
      optionsDiv.style.gridTemplateRows = '45px'
      optionsDiv.style.gridRowGap = '0'
      optionsDiv.style.gridColumnGap = '8px'
    }
  }, [])

  useEffect(() => {
    window.api.onFraseReconhecida((dado) => setFraseReconhecida(dado))
    window.api.onFrameCamera((dado) => setFrameCamera(dado))
    window.api.onRespostaOuvinte((texto) => setRespostaOuvinte(texto))

    const handleKeyDown = (e) => {
      if (e.key === 'Backspace') {
        window.api.apagarUltimoSinal()
      } else if (e.key === 'Enter') {
        window.api.resetarFrase()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    if (!rybenaIniciada.current) {
      const script = document.createElement('script')
      script.src = '/src/assets/rybena.js'
      script.onload = () => {
        setTimeout(() => {
          if (window.RybenaDOM) {
            window.RybenaDOM.getInstance().getRybenaScripts('LIBRAS')
            setTimeout(() => {
              posicionarRybena()
              posicionarSidebar()
            }, 2500)
          }
        }, 1500)
      }
      document.head.appendChild(script)
      rybenaIniciada.current = true
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [posicionarRybena, posicionarSidebar])

  return (
    <div className={styles.container}>
      <div className={styles.area_principal}>
        <div className={styles.camera}>
          {frameCamera
            ? <img src={`data:image/jpeg;base64,${frameCamera}`} alt="câmera" />
            : <span>Aguardando câmera...</span>
          }
        </div>
        <div className={styles.avatar} ref={avatarRef}>
          <span style={{ color: '#ccc', fontSize: 13 }}>Carregando avatar...</span>
        </div>
      </div>
      <div className={styles.resultado}>
        {fraseReconhecida || 'Aguardando sinal...'}
      </div>
      <div className={styles.resposta_ouvinte}>
        {respostaOuvinte || 'Aguardando resposta do atendente...'}
      </div>
      <Footer />
    </div>
  )
}

export default TradutorSurdo