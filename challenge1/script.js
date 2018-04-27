import { createReadStream, createWriteStream } from 'fs'
import { createStream } from 'byline'
import { compose, map, split, toString } from 'ramda'

const read = createReadStream('./submitInput.txt')
const write = createWriteStream('./submitOutput.txt')
const stream = createStream(read)

let test = 0

stream.on('data', line => {
  if (test > 0) {
    const [n, m] = compose(map(Number), split(' '), toString)(line)
    const result = (n - 1) * (m - 1)
    write.write(`Case #${test}: ${result}\n`)
  }
  test++
})

stream.on('end', () => console.log('Success! 🎉'))
