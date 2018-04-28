import { createReadStream, createWriteStream } from 'fs'
import { createStream } from 'byline'
import { compose, map, split, toString, trim, uniq } from 'ramda'

const read = createReadStream('./submitInput.txt')
const write = createWriteStream('./submitOutput.txt')
const stream = createStream(read)

// EXAMPLES:
// MA -> A, B, C#, D, E, F#, G#, A
// MA# -> A#, C, D, D#, F, G, A, A#
const allKeys =
  'MA MA# MB MC MC# MD MD# ME MF MF# MG MG# mA mA# mB mC mC# mD mD# mE mF mF# mG mG#'
const tones =
  'C C# D D# E F F# G G# A A# B C C# D D# E F F# G G# A A# B C C# D D# E F F# G G# A A# B'
const allTones = tones.split(' ')
const M = [0, 2, 4, 5, 7, 9, 11]
const m = [0, 2, 3, 5, 7, 8, 10]
const to = note => tone => allTones[allTones.indexOf(note) + tone]
const genScale = e => {
  const note = e.slice(1)
  return e[0] === 'M' ? M.map(to(note)) : m.map(to(note))
}
const scales = allKeys
  .split(' ')
  .reduce((obj, esc) => ({ ...obj, [esc]: genScale(esc) }), {})
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
      write.write(`Case #${test}: ${allKeys}\n`)
      test++
    } else if (isNaN(numNotes)) {
      const notes = compose(uniq, map(toSharp), split(' '), trim, toString)(str)
      const result = Object.entries(scales).reduce(
        (scales, [key, values]) =>
          notes.every(n => values.includes(n)) ? scales + key + ' ' : scales,
        ''
      )
      write.write(`Case #${test}: ${trim(result) || 'None'}\n`)
      test++
    }
  }
  line++
})

stream.on('end', () => console.log('Success! 🎉'))
