import { createReadStream, createWriteStream } from 'fs'
import { createStream } from 'byline'
import { compose, map, reduce, split, toString, trim, uniq } from 'ramda'

const read = createReadStream('./submitInput.txt')
const write = createWriteStream('./submitOutput.txt')
const stream = createStream(read)

// EXAMPLES:
// MA -> A, B, C#, D, E, F#, G#, A
// MA# -> A#, C, D, D#, F, G, A, A#
const keys =
  'MA MA# MB MC MC# MD MD# ME MF MF# MG MG# mA mA# mB mC mC# mD mD# mE mF mF# mG mG#'
const tones = 'C C# D D# E F F# G G# A A# B C C# D D# E F F# G G# A A# B'
const stones = split(' ', tones)
const M = [0, 2, 4, 5, 7, 9, 11]
const m = [0, 2, 3, 5, 7, 8, 10]
const to = note => tone => stones[stones.indexOf(note) + tone]
const genScale = (e, note = e.slice(1)) => map(to(note))(e[0] === 'M' ? M : m)
const scales = compose(
  reduce((o, e) => ({ ...o, [e]: genScale(e) }), {}),
  split(' ')
)(keys)
const eqs = {
  Ab: 'G#',
  Bb: 'A#',
  'B#': 'C',
  Cb: 'B',
  Db: 'C#',
  Eb: 'D#',
  'E#': 'F',
  Fb: 'E',
  Gb: 'F#'
}
const toSharp = b => eqs[b] || b

let test = 1
let line = 0

stream.on('data', str => {
  if (line > 0) {
    const numNotes = Number(str)
    if (numNotes === 0) {
      write.write(`Case #${test}: ${keys}\n`)
      test++
    } else if (isNaN(numNotes)) {
      const notes = compose(uniq, map(toSharp), split(' '), trim, toString)(str)
      const result = reduce(
        (keys, [k, val]) =>
          notes.every(n => val.includes(n)) ? keys + k + ' ' : keys,
        ''
      )(Object.entries(scales))
      write.write(`Case #${test}: ${trim(result) || 'None'}\n`)
      test++
    }
  }
  line++
})

stream.on('end', () => console.log('Success! 🎉'))
