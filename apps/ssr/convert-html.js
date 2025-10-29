import fs from 'node:fs'

const html = fs.readFileSync('./public/index.html', 'utf8')
const jsContent = `export default \`${html.replaceAll('`', '\\`').replaceAll('$', '\\$')}\`;`
fs.writeFileSync('./src/index.html.ts', jsContent)
 
console.info('✅ Converted index.html to index.html.ts')
