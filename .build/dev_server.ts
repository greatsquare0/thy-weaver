import { Hono } from 'hono'
import { serve, type ServerWebSocket } from 'bun'
import { createBunWebSocket, serveStatic } from 'hono/bun'
import { transformFile as swcTransform } from '@swc/core'
import pico from 'picocolors'

import { devEvents, devState } from './dev_state'
import { loadConfig } from './handle_config'
import swcConfig from './swc_config'

const config = await loadConfig()

const placeholder = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Document</title>
</head>
<body>
  
</body>
</html>
`

const throwServerLog = (log: string) => {
  console.log(`${pico.bgCyan(pico.bold(' DEV SERVER '))} ${log}`)
}

const throwServerError = (error: string) => {
  console.log(
    `${pico.bgCyan(pico.bold(' DEV SERVER '))} ${pico.bgRed(
      pico.bold(' ERROR ')
    )} ${error}`
  )
}

const app = new Hono()
const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>()

app.get('/', async ctx => {
  const html = devState.html !== undefined ? devState.html : placeholder
  const modifiedHtml = html.replace(
    '</head>',
    `<script async src="${server.url.href}dev"></script>\n</head>`
  )
  return new Response(modifiedHtml, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
})

const dist = config.builder!.dist!.output_dir

app.get(
  '*',
  serveStatic({
    root: `${dist}/scripts`,
  }),
  serveStatic({
    root: `${dist}/styles`,
  }),
  serveStatic({
    root: dist,
  })
)

app.get(
  '/media/*',
  serveStatic({
    root: dist,
    onNotFound: (path, c) => {
      throwServerError(`${path} is not found, you access ${c.req.path}`)
    },
  })
)

app.get('/dev', async ctx => {
  const output = await swcTransform('./.build/reload_agent.ts', {
    ...swcConfig,
  })
  return new Response(output.code, {
    headers: {
      'Content-Type': 'application/javascript',
    },
  })
})

app.get(
  '/ws',
  upgradeWebSocket(c => {
    return {
      onMessage(event, ws) {
        throwServerLog(`Message from client: ${event.data}`)
      },
      onClose: () => {
        throwServerLog('Connection with client lost')
      },
      onOpen(event, ws) {
        ws.send('Hello from server!')
        throwServerLog('Client connected')

        devEvents.once('builded', () => {
          ws.send('update')
        })
      },
    }
  })
)

let server

try {
  server = serve({
    fetch: app.fetch,
    //@ts-expect-error
    websocket,
    hostname: config.dev_server!.hostname,
    port: config.dev_server!.port,
  })
} catch (error) {
  throwServerError(error)
}

export { server }
