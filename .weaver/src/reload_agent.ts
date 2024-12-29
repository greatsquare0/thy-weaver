let ws: WebSocket
let retryCount = 0
const maxRetries = 5
const retryDelay = 1000

const connect = () => {
  ws = new WebSocket(`ws://${window.location.host}/ws`)

  ws.addEventListener('open', () => {
    console.info('[Dev Server]: Connected!')
  })

  ws.addEventListener('message', message => {
    console.info(`[Dev Server]: Message received:\n${message.data}`)

    if (message.data == 'update') {
      console.info(`[Dev Server]: Update trigger received, reloading page...`)
      window.location.reload()
    }
  })

  ws.addEventListener('close', event => {
    if (!event.wasClean && retryCount < maxRetries) {
      retryConnection()
    } else {
      console.warn(`[Dev Server]: Connection closed. Reason:\n${event.reason}`)
    }
  })
}

const retryConnection = () => {
  retryCount++
  setTimeout(() => {
    if (retryCount <= maxRetries) {
      console.info(
        `[Dev Server] Connection lost, reconnection... (Attempt #${retryCount})`
      )
      connect()
    } else {
      console.error('[Dev Server] Max reconnection attempts reached. Giving up')
    }
  }, retryDelay)
}

connect()
