import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const template = readFileSync(join(root, 'src', 'client.template.js'), 'utf8')
const front = readFileSync(join(root, 'assets', 'lion-front.webp')).toString('base64')
const side = readFileSync(join(root, 'assets', 'lion-side.webp')).toString('base64')
const client = template.replaceAll('__LION_FRONT__', front).replaceAll('__LION_SIDE__', side)

if (client.includes('__LION_')) throw new Error('unreplaced asset placeholder')
mkdirSync(join(root, 'lib'), { recursive: true })
writeFileSync(join(root, 'lib', 'client.js'), client)
copyFileSync(join(root, 'src', 'index.js'), join(root, 'lib', 'index.js'))
console.log(`built lib/client.js (${(client.length / 1024).toFixed(1)} KiB)`)
