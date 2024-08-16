import {watch} from 'fs'
import config from './config'
const {OUT_DIR, WEB_DIR, WATCHER} = config

import fs from 'node:fs'
import BunTranspiler from 'bunTranspiler'

const tsTranspiler = new BunTranspiler(
  {
    ignores: [/\/types$/i],
    transformations: [{key: /$/, value: '.js'}],
  },
  {
    target: 'browser',
    inline: false,
    minifyWhitespace: false,
    loader: 'ts',
  }
)

async function build() {
  try {
    fs.mkdirSync(OUT_DIR)
  } catch (e) {
    if ((e as {code: string}).code !== 'EEXIST') {
      console.log(e)
      return
    }
  }
  fs.rmdirSync(OUT_DIR, {
    recursive: true,
    //@ts-ignore
    force: true,
  })
  try {
    fs.mkdirSync(OUT_DIR)
  } catch (e) {
    if ((e as {code: string}).code !== 'EEXIST') {
      console.log(e)
      return
    }
  }
  fs.cpSync(WEB_DIR, OUT_DIR, {
    recursive: true,
  })
  const files = readDirRecursively(OUT_DIR)
  for (const file of files) {
    if (/\.test\./i.test(file)) {
      continue
    }
    buildFile(file)
  }
}

function readDirRecursively(path: string): string[] {
  const fileList = fs.readdirSync(path)
  let files: string[] = []

  for (const file of fileList) {
    const name = `${path}/${file}`
    if (fs.statSync(name).isDirectory()) {
      files = [...files, ...readDirRecursively(name)]
    } else {
      files.push(name)
    }
  }
  return files
}

async function transpileFile(
  file: string,
  regex: RegExp,
  ending: string,
  transpiler: {transpile: (code: string) => Promise<string>} = {
    transpile: async (code: string) => await code,
  },
  remove = false
) {
  if (!regex.test(file)) {
    return
  }
  const content = await Bun.file(file).text()
  const transpiledContent = await transpiler.transpile(content)

  try {
    await Bun.write(file.replace(regex, ending), transpiledContent)
    if (remove) {
      fs.rmSync(file)
    }
  } catch (e) {
    if ((e as {code: string}).code === 'ENOENT') {
      const folder = file.replace(
        new RegExp('([^]+)/([^]+)' + regex.source),
        '$1'
      )
      fs.mkdirSync(folder, {recursive: true})
      await Bun.write(file.replace(regex, ending), transpiledContent)
    } else {
      console.log(e)
      return
    }
  }
}

async function fixHtml(file: string) {
  if (!/\.html?/.test(file)) {
    return
  }
  const content = await Bun.file(file).text()
  const newContent = content.replaceAll(/src="(.+)\.ts"/g, `src="$1.js"`)

  try {
    await Bun.write(file, newContent)
  } catch (e) {
    console.log(e)
    return
  }
}

async function buildFile(filePath: string) {
  transpileFile(filePath, /\.ts$/i, '.js', tsTranspiler, true)
  fixHtml(filePath)
}

build()
if (WATCHER) {
  const watcher = watch(WEB_DIR, (event, filename) => {
    if (!filename || /\.test\./i.test(filename)) {
      return
    }
    const filePath = '/' + filename
    if (event === 'change') {
      fs.copyFileSync(WEB_DIR + filePath, OUT_DIR + filePath)
      buildFile(OUT_DIR + filePath)
    }
    if (event === 'rename') {
      build()
    }
  })

  process.on('SIGINT', () => {
    watcher.close()
    process.exit(0)
  })
}

