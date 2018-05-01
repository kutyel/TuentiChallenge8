const { createReadStream, createWriteStream } = require('fs')
const { createStream } = require('byline')
const { allPass, compose, map, split, toString } = require('ramda')

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

const not = closed => node => closed.findIndex(c => equalNodes(c, node)) === -1
const notLava = board => ({ x, y }) => board[x] && board[x][y] !== '#' // forbidden
const outside = (n, m) => ({ x, y }) => x >= 0 && y >= 0 && x < n && y < m

const getNextPositions = (parent, closed, board, n, m) => {
  const mult = board[parent.x][parent.y] === '*' ? 2 : 1 // is trampoline
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
    .filter(allPass([not(closed), notLava(board), outside(n, m)]))
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

const countMovesFromTo = (origin, destination, board, n, m) => {
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
    const nextCells = getNextPositions(extracted, closed, board, n, m)
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

const getFrontiers = compose(map(Number), split(' '), toString)

const getMinPath = (s, p, d, board, n, m) => {
  const sToP = countMovesFromTo(s, p, board, n, m)
  const pToD = countMovesFromTo(p, d, board, n, m)
  return sToP === -1 || pToD === -1 ? 'IMPOSSIBLE' : sToP + pToD
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
  if (line === 1) {
    ;[n, m] = getFrontiers(str)
  } else if (n > 0 && i < n) {
    const row = compose(split(''), toString)(str)
    find(S, i, row)
    find(P, i, row)
    find(D, i, row)
    board[i] = row
    i++
  } else if (line > 0 && i === n) {
    // Perform logic
    const result = getMinPath(S, P, D, board, n, m)
    // console.log({ S, P, D })
    output.write(`Case #${test}: ${result}\n`)
    ;[n, m] = getFrontiers(str)
    i = 0
    test++
  }
  line++
})

stream.on('end', () => console.log('Success! 🎉'))
