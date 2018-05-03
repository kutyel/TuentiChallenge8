import { createReadStream, createWriteStream } from 'fs'
import { createStream } from 'byline'
import { allPass, and, eqProps, inc, map, path } from 'ramda'

const input = createReadStream('./submitInput.txt')
const output = createWriteStream('./submitOutput.txt')
const stream = createStream(input)

const find = (X, x, line) => {
  const y = line.indexOf(X.id)
  if (y !== -1) {
    X.x = x
    X.y = y
  }
}
const open = closed => node => closed.findIndex(c => equal(c, node)) === -1
const inside = (n, m) => ({ x, y }) => and(x >= 0 && y >= 0, x < n && y < m)
const notLava = board => ({ x, y }) => path([x, y], board) !== '#' // forbidden
const getNextPositions = (parent, closed, board, n, m) => {
  const mult = path([parent.x, parent.y], board) === '*' ? 2 : 1 // is trampoline
  const moves = [
    { x: -2, y: -1 },
    { x: -2, y: +1 },
    { x: -1, y: -2 },
    { x: -1, y: +2 },
    { x: +1, y: -2 },
    { x: +1, y: +2 },
    { x: +2, y: -1 },
    { x: +2, y: +1 }
  ]
  return moves
    .map(({ x, y }) => ({
      x: parent.x + x * mult,
      y: parent.y + y * mult,
      g: -1,
      h: -1,
      parent
    }))
    .filter(allPass([open(closed), notLava(board), inside(n, m)])) // B) and C)
}
const getSteps = ({ parent }, steps = 0) =>
  !parent ? steps : getSteps(parent, inc(steps))
const equal = (a, b) => and(eqProps('x', a, b), eqProps('y', a, b))
const calculateG = (origin, current, cost = 24) =>
  equal(origin, current)
    ? 0
    : equal(current.parent, origin) ? cost : current.parent.g + cost
const calculateH = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) // Manhattan distance
const recalculateFactors = (origin, current, destination) => {
  current.g = calculateG(origin, current)
  current.h = calculateH(current, destination)
}
/**
 * My own implementation of the A* algorithm 😎
 * https://www.lanshor.com/pathfinding-a-estrella/
 */
const findPath = (from, to, board, n, m) => {
  let opened = []
  let closed = []
  // Step 0
  opened.push(from)
  while (true) {
    if (!opened.length) return -1
    // Step 1
    const extracted = opened.shift()
    closed.push(extracted)
    // Step 2
    const nextCells = getNextPositions(extracted, closed, board, n, m)
    // Step 3
    for (const cell of nextCells) {
      if (equal(cell, to)) {
        return getSteps(cell) // A) reached destination! 🎉
      } else if (opened.findIndex(c => equal(c, cell)) > -1) {
        const currentG = cell.g
        const newG = calculateG(from, cell) // D)
        if (newG < currentG) {
          cell.parent = extracted
          recalculateFactors(from, cell, to)
        }
      } else {
        cell.parent = extracted
        recalculateFactors(from, cell, to) // E)
        opened.push(cell)
      }
    }
    // Step 4
    opened.sort((a, b) => a.g + a.h - (b.g + b.h))
  }
}
const calcMinPath = (s, p, d, board, n, m) => {
  const sToP = findPath(s, p, board, n, m)
  if (sToP === -1) return 'IMPOSSIBLE'
  const pToD = findPath(p, d, board, n, m)
  return pToD === -1 ? 'IMPOSSIBLE' : sToP + pToD
}

let test = 1
let line = 0
let board = []
let n = 0
let m = 0
let i = 0
let S = { g: -1, h: -1, x: 0, y: 0, id: 'S' } // Knight
let P = { g: -1, h: -1, x: 0, y: 0, id: 'P' } // Princess
let D = { g: -1, h: -1, x: 0, y: 0, id: 'D' } // Exit

stream.on('data', str => {
  if (and(line > 0, i === 0 && n === 0)) {
    ;[n, m] = map(Number, str.toString().split(' '))
  } else if (and(n > 0, i <= n)) {
    if (i < n) {
      const row = str.toString().split('')
      find(S, i, row)
      find(P, i, row)
      find(D, i, row)
      board[i] = row
      i++
    }
    if (i === n) {
      const result = calcMinPath(S, P, D, board, n, m)
      output.write(`Case #${test}: ${result}\n`)
      ;[n, i] = [0, 0]
      test++
    }
  }
  line++
})

stream.on('end', () => console.log('Success! 🎉'))
