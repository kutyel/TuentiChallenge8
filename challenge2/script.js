import { createReadStream, createWriteStream } from 'fs'
import { createStream } from 'byline'
import { fromArray } from 'big-integer'
import { ascend, compose, descend, identity, range, sort } from 'ramda'

const read = createReadStream('./submitInput.txt')
const write = createWriteStream('./submitOutput.txt')
const stream = createStream(read)

const to = base => arr => fromArray(arr, base)
const flip = ([fst, snd, ...tail]) => [snd, fst, ...tail]

let test = 0

stream.on('data', line => {
  if (test > 0) {
    const s = line.toString()
    const base = s.length
    const max = compose(to(base), sort(descend(identity)), range(0))(base)
    const min = compose(to(base), flip, sort(ascend(identity)), range(0))(base)
    const result = max.minus(min).toString()
    write.write(`Case #${test}: ${result}\n`)
  }
  test++
})

stream.on('end', () => console.log('Success! 🎉'))
