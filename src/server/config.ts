const config = {
  OUT_DIR: __dirname + '/../../build',
  DEFAULT_PATH: '/index.html',
  PORT: Bun.env.PORT || 3000,
  WEB_DIR: __dirname + '/../web',
  WATCHER: Bun.env.WATCHER || false,
}

export default config

