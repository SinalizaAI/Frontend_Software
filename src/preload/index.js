import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  onFraseReconhecida: (callback) => ipcRenderer.on('frase-reconhecida', (_, dado) => callback(dado)),
  onVozAtendente: (callback) => ipcRenderer.on('voz-atendente', (_, dado) => callback(dado)),
  onStatusGravacao: (callback) => ipcRenderer.on('status-gravacao', (_, dado) => callback(dado)),
  iniciarGravacao: () => ipcRenderer.send('iniciar-gravacao'),
  pararGravacao: () => ipcRenderer.send('parar-gravacao'),
  onFrameCamera: (callback) => ipcRenderer.on('frame-camera', (_, dado) => callback(dado)),
  enviarRespostaOuvinte: (texto) => ipcRenderer.send('enviar-resposta-ouvinte', texto), 
  onRespostaOuvinte: (callback) => ipcRenderer.on('resposta-ouvinte', (_, dado) => callback(dado)),
  apagarUltimoSinal: () => ipcRenderer.send('apagar-ultimo-sinal'),
  resetarFrase: () => ipcRenderer.send('resetar-frase'),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}