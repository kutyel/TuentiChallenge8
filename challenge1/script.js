const fs = require('fs')
const byline = require('byline')

const read = fs.createReadStream('./submitInput.txt')
const write = fs.createWriteStream('./submitOutput.txt')
const stream = byline.createStream(read)

let test = 0

stream.on('data', line => {
  if (test > 0) {
    const [n, m] = line
      .toString()
      .split(' ')
      .map(Number)
    const result = (n - 1) * (m - 1)
    write.write(`Case #${test}: ${result}\n`)
  }
  test++
})

stream.on('end', () => console.log('Success! 🎉'))
