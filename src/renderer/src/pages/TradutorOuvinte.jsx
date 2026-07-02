import { useEffect, useState } from 'react'
import styles from '../css/TradutorOuvinte.module.css'
import Footer from '../components/Footer'
import microfone from '../assets/microfone.svg'
import stop from '../assets/stop.svg'

function TradutorOuvinte() {
  const [fraseReconhecida, setFraseReconhecida] = useState('')
  const [textoVoz, setTextoVoz] = useState('')
  const [statusGravacao, setStatusGravacao] = useState('')
  const [textoDigitado, setTextoDigitado] = useState('')
  const [historico, setHistorico] = useState([])
  const [processando, setProcessando] = useState(false)

  const gravando = statusGravacao === 'gravando'

  useEffect(() => {
    window.api.onFraseReconhecida((dado) => {
      setFraseReconhecida(dado)
      setHistorico((prev) => {
        if (prev[0] === dado) return prev
        return [dado, ...prev]
      })
    })

    window.api.onVozAtendente((dado) => {
      setTextoVoz(dado)
      setProcessando(false)
    })

    window.api.onStatusGravacao((dado) => {
      setStatusGravacao(dado)
      if (dado !== 'gravando') setProcessando(false)
    })
  }, [])

  const iniciarGravacao = () => {
    window.api.iniciarGravacao()
  }

  const pararGravacao = () => {
    setProcessando(true)
    window.api.pararGravacao()
  }

  return (
    <div className={styles.container}>
      <div className={styles.funcao}>
        <div className={styles.coluna_esquerda}>
          <input
            className={styles.resultado}
            value={fraseReconhecida || 'O resultado do sinal aparece aqui'}
            readOnly
          />
          <div className={styles.historico}>
            <span className={styles.historico_label}>HISTÓRICO:</span>
            <div className={styles.historico_lista}>
              {historico.map((frase, i) => (
                <div key={i} className={styles.historico_item}>{frase}</div>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.coluna_direita}>
          <div className={styles.texto_digitado}>
            <div className={styles.header_digitado}>
              <label className={styles.label}>Digitar texto</label>
              <hr className={styles.linha} />
            </div>
            <textarea
              className={styles.textarea}
              value={textoDigitado}
              onChange={(e) => setTextoDigitado(e.target.value)}
            />
            <div className={styles.footer_digitado}>
              <button
                className={styles.botao}
                onClick={() => {
                  if (textoDigitado.trim()) {
                    window.api.enviarRespostaOuvinte(textoDigitado)
                    setTextoDigitado('')
                  }
                }}
              >
                Enviar resposta
              </button>
            </div>
          </div>
          <div className={styles.falar}>
            <div className={styles.header_digitado}>
              <label className={styles.label}>Falar</label>
              <hr className={styles.linha} />
            </div>
            <textarea
              className={styles.textarea}
              value={textoVoz}
              readOnly
            />
            <div className={styles.footer_falar}>
              <div className={styles.gravar}>
                <button
                  className={styles.botao_gravacao}
                  onClick={iniciarGravacao}
                  disabled={gravando || processando}
                >
                  <img src={microfone} alt="microfone" />
                </button>
                <button
                  className={styles.botao_microfone}
                  onClick={pararGravacao}
                  disabled={!gravando || processando}
                >
                  <img src={stop} alt="stop" />
                </button>
              </div>
              <span className={styles.status}>
                {processando ? 'transcrevendo...' : statusGravacao}
              </span>
              <button
                className={styles.botao}
                onClick={() => {
                  if (textoVoz.trim()) {
                    window.api.enviarRespostaOuvinte(textoVoz)
                  }
                }}
              >
                Enviar resposta
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default TradutorOuvinte