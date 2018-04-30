import { createReadStream, createWriteStream } from 'fs'
import { createStream } from 'byline'
import { compose, head, map, split, toString, trim } from 'ramda'

const input = createReadStream('./testInput.txt')
const output = createWriteStream('./testOutput.txt')
const stream = createStream(input)

const find = (X, x, line) => {
  const y = line.indexOf(X.id)
  if (y !== -1) {
    X.x = x
    X.y = y
  }
}

const getNextPositions = (parent, tramp = false) => {
  const mult = tramp ? 2 : 1
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
  return moves.map(({ x, y }) => ({
    x: parent.x + x * mult,
    y: parent.y + y * mult,
    g: -1,
    h: -1,
    parent
  }))
}

const getManhattanDistance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

const getStepsUpToRoot = cell => {
  let steps = 0
  let next = cell
  while (next.parent) {
    next = next.parent
    steps++
  }
  return steps
}

const equalNodes = (a, b) => a.x === b.x && a.y === b.y

const calculateG = (origin, current, cost = 24) =>
  equalNodes(origin, current)
    ? 0
    : equalNodes(current.parent, origin)
      ? cost
      : current.parent.g + cost

const calculateH = getManhattanDistance

const recalculateFactors = (origin, current, destination) => {
  current.g = calculateG(origin, current)
  current.h = calculateH(current, destination)
}

const countMovesFromTo = (origin, destination) => {
  /**
   * My own A* algorithm implementation 😎
   */
  let opened = []
  let closed = []
  // Step 0
  opened.push(origin)

  while (true) {
    if (!opened.length) return -1
    // Step 1
    const extracted = opened.shift()
    closed.push(extracted)
    // Step 2
    const nextCells = getNextPositions(extracted)
    // Step 3
    for (const cell of nextCells) {
      if (equalNodes(cell, destination)) {
        // reached destination!
        cell.parent = extracted
        return getStepsUpToRoot(cell)
      } else if (opened.findIndex(c => equalNodes(c, cell)) > -1) {
        const currentG = cell.g
        const newG = calculateG(origin, cell)
        if (newG < currentG) {
          cell.parent = extracted
          recalculateFactors(origin, cell, destination)
        }
      } else {
        cell.parent = extracted
        recalculateFactors(origin, cell, destination)
        opened.push(cell)
      }
    }
    // Step 4
    opened.sort((a, b) => a.g + a.h - (b.g + b.h))
  }
}

const newTest = compose(head, map(Number), split(' '), trim, toString)

const getMinPath = (s, p, d) => {
  const sToP = countMovesFromTo(s, p)
  const pToD = countMovesFromTo(p, d)
  return sToP === -1 || pToD === -1 ? 'IMPOSSIBLE' : sToP + pToD
}

let test = 1
let line = 0
let board = []
let n = 0
let i = 0
let S = { g: -1, h: -1, x: 0, y: 0, id: 'S' } // Knight
let P = { g: -1, h: -1, x: 0, y: 0, id: 'P' } // Princess
let D = { g: -1, h: -1, x: 0, y: 0, id: 'D' } // Exit

stream.on('data', str => {
  if (line === 1) {
    n = newTest(str)
  } else if (n > 0 && i < n) {
    const row = compose(split(''), toString)(str)
    find(S, i, row)
    find(P, i, row)
    find(D, i, row)
    board[i] = row
    i++
  } else if (line > 0 && i === n) {
    // Perform logic
    const result = getMinPath(S, P, D)
    // console.log({ S, P, D })
    output.write(`Case #${test}: ${result}\n`)
    n = newTest(str)
    i = 0
    test++
  }
  line++
})

stream.on('end', () => console.log('Success! 🎉'))
