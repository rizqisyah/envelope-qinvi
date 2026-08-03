// Loads the invitation and asserts getHome is requested exactly once and returns 200.
// Before the fix, 18 components each fired their own request and every one came back 502.
import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage()

const calls = []
page.on('response', (res) => {
  if (res.url().includes('/getHome/')) calls.push(res.status())
})

await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' })
await browser.close()

console.log(`getHome requests: ${calls.length} -> statuses ${JSON.stringify(calls)}`)

if (calls.length !== 1) throw new Error(`expected 1 getHome request, got ${calls.length}`)
if (calls[0] !== 200) throw new Error(`expected status 200, got ${calls[0]}`)
console.log('OK')
