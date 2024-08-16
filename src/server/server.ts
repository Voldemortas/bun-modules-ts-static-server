import config from './config'
const {DEFAULT_PATH, PORT, OUT_DIR} = config

const server = Bun.serve({
  async fetch(req: Request) {
    const url = new URL(req.url)
    const pathname = url.pathname
    const betterPathName = pathname === '/' ? pathname + DEFAULT_PATH : pathname
    const filePath = OUT_DIR + betterPathName
    const file = Bun.file(filePath)
    const fileExists = await file.exists()
    if (!fileExists) {
      return new Response('404', {status: 404})
    }
    return new Response(file, {headers: {...contentType(req)}})
  },
  port: PORT,
})

function contentType(req: Request) {
  let type = undefined
  if (req.url.endsWith('.js')) {
    type = 'application/javascript'
  }
  if (req.url.endsWith('.html') || req.url.endsWith('.htm')) {
    type = 'text/html'
  }
  return type && {'Content-Type': type}
}

console.log(`http://${server.hostname}:${server.port}`)

