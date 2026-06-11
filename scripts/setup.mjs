/**
 * One-time local setup. If .env has no ANTHROPIC_API_KEY, prompt for it once (input hidden), write
 * it to .env, and turn off mock mode so dropped PDFs analyze for real. The key lives only in this
 * file on this machine — never in the browser, never committed (.env is gitignored). Press Enter at
 * the prompt to stay in free mock mode (sample catalogues, no key, no cost).
 *
 * Run by start.command on every launch; it's a no-op once the key is set.
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import readline from 'node:readline'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env')
const examplePath = resolve(root, '.env.example')

if (!existsSync(envPath)) {
  if (existsSync(examplePath)) copyFileSync(examplePath, envPath)
  else writeFileSync(envPath, 'ANTHROPIC_API_KEY=\nPROXY_PORT=3001\nVITE_MOCK=1\n')
}

let env = readFileSync(envPath, 'utf8')

const valueOf = (key) => (env.match(new RegExp(`^${key}=(.*)$`, 'm')) || [])[1]?.trim() ?? ''
const setVar = (key, val) => {
  env = new RegExp(`^${key}=.*$`, 'm').test(env)
    ? env.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${val}`)
    : env.trimEnd() + `\n${key}=${val}\n`
}

if (valueOf('ANTHROPIC_API_KEY')) {
  console.log('✓ API key already configured in .env — real analysis is on. (Edit .env to change it.)')
  process.exit(0)
}

if (!process.stdin.isTTY) {
  console.log('• No API key in .env yet — staying in mock mode. Run `npm run setup` in a terminal to add one.')
  process.exit(0)
}

function askHidden(query) {
  return new Promise((res) => {
    process.stdout.write(query)
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    rl._writeToOutput = () => {} // swallow echo so the key isn't shown
    rl.question('', (answer) => {
      rl.close()
      process.stdout.write('\n')
      res(answer.trim())
    })
  })
}

console.log('\n▢ Demo Forge — one-time setup')
console.log('  Your Anthropic API key is stored locally in .env and never sent to the browser.')
console.log('  Get one at https://console.anthropic.com (Billing → set a spend limit).\n')

const key = await askHidden('  Paste your Anthropic API key (or press Enter for free mock mode): ')

if (!key) {
  console.log('\n• Staying in mock mode — sample catalogues, no key, no cost.')
  console.log('  Re-run `npm run setup` whenever you want to add a key.\n')
  process.exit(0)
}

if (!/^sk-ant-/.test(key)) {
  console.log('\n⚠ That doesn’t look like an Anthropic key (they start with "sk-ant-").')
  console.log('  Saved it anyway — if analysis fails, re-run `npm run setup` to fix it.\n')
}

setVar('ANTHROPIC_API_KEY', key)
setVar('VITE_MOCK', '0')
writeFileSync(envPath, env)
console.log('\n✓ Saved to .env — real analysis enabled. The key stays on this machine.\n')
