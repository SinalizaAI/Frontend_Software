import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { spawn } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import WebSocket from 'ws'

let telaInicial = null
let janelaSurdo = null
let janelaOuvinte = null
let wsPython = null
let pythonProcess = null

function iniciarPython() {
  let comando
  let args
  let cwd

  if (is.dev) {
    // Durante o desenvolvimento, usa o .venv local (como já funcionava)
    comando = 'C:\\SinalizaAI_prototipo\\.venv\\Scripts\\python.exe'
    args = ['C:\\SinalizaAI_prototipo\\etapa9_websocket.py']
    cwd = 'C:\\SinalizaAI_prototipo'
  } else {
    // No executável final, usa o .exe empacotado pelo PyInstaller,
    // que fica junto dos recursos do app instalado
    comando = join(process.resourcesPath, 'python', 'sinalizaai_backend.exe')
    args = []
    cwd = join(process.resourcesPath, 'python')
  }

  pythonProcess = spawn(comando, args, {
    cwd,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' }
  })

  pythonProcess.stdout.on('data', (data) => {
    console.log('[Python]', data.toString())
  })

  pythonProcess.stderr.on('data', (data) => {
    console.log('[Python erro]', data.toString())
  })

  pythonProcess.on('close', (code) => {
    console.log('[Python] processo encerrado com código', code)
  })
}

function conectarPython() {
  wsPython = new WebSocket('ws://localhost:8765')

  wsPython.on('open', () => {
    console.log('Conectado ao Python via WebSocket')
  })

  wsPython.on('message', (data) => {
    try {
      const mensagem = JSON.parse(data.toString())

      if (mensagem.tipo === 'frase_reconhecida') {
        if (janelaSurdo) janelaSurdo.webContents.send('frase-reconhecida', mensagem.dado)
        if (janelaOuvinte) janelaOuvinte.webContents.send('frase-reconhecida', mensagem.dado)
      }

      if (mensagem.tipo === 'voz_atendente') {
        if (janelaOuvinte) janelaOuvinte.webContents.send('voz-atendente', mensagem.dado)
      }

      if (mensagem.tipo === 'status_gravacao') {
        if (janelaOuvinte) janelaOuvinte.webContents.send('status-gravacao', mensagem.dado)
      }

      if (mensagem.tipo === 'frame_camera') {
        if (janelaSurdo) janelaSurdo.webContents.send('frame-camera', mensagem.dado)
      }

    } catch (e) {
      console.log('Erro ao processar mensagem do Python:', e.message)
    }
  })

  wsPython.on('close', () => {
    console.log('Conexão com Python encerrada — tentando reconectar em 3s...')
    setTimeout(conectarPython, 3000)
  })

  wsPython.on('error', (err) => {
    console.log('Erro WebSocket:', err.message)
  })
}

function createWindows() {
  telaInicial = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false,
    title: 'SinalizaAI',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  janelaSurdo = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    title: 'SinalizaAI - Surdo',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true
    }
  })

  janelaOuvinte = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    title: 'SinalizaAI - Ouvinte',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  telaInicial.on('ready-to-show', () => telaInicial.show())
  janelaSurdo.on('ready-to-show', () => janelaSurdo.show())
  janelaOuvinte.on('ready-to-show', () => janelaOuvinte.show())

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    telaInicial.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/')
    janelaSurdo.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/surdo')
    janelaOuvinte.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/ouvinte')
  } else {
    telaInicial.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/' })
    janelaSurdo.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/surdo' })
    janelaOuvinte.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/ouvinte' })
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.sinalizaai.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  iniciarPython()
  createWindows()
  conectarPython()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows()
  })
})

app.on('before-quit', () => {
  if (pythonProcess) pythonProcess.kill()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('abrir-surdo', () => {
  if (janelaSurdo) janelaSurdo.show()
})

ipcMain.on('abrir-ouvinte', () => {
  if (janelaOuvinte) janelaOuvinte.show()
})

ipcMain.on('iniciar-gravacao', () => {
  if (wsPython && wsPython.readyState === WebSocket.OPEN) {
    wsPython.send(JSON.stringify({ tipo: 'iniciar_gravacao' }))
  }
})

ipcMain.on('parar-gravacao', () => {
  if (wsPython && wsPython.readyState === WebSocket.OPEN) {
    wsPython.send(JSON.stringify({ tipo: 'parar_gravacao' }))
  }
})

ipcMain.on('enviar-resposta-ouvinte', (_, texto) => {
  if (janelaSurdo) janelaSurdo.webContents.send('resposta-ouvinte', texto)
})

ipcMain.on('apagar-ultimo-sinal', () => {
  if (wsPython && wsPython.readyState === WebSocket.OPEN) {
    wsPython.send(JSON.stringify({ tipo: 'apagar_ultimo_sinal' }))
  }
})

ipcMain.on('resetar-frase', () => {
  if (wsPython && wsPython.readyState === WebSocket.OPEN) {
    wsPython.send(JSON.stringify({ tipo: 'resetar_frase' }))
  }
})