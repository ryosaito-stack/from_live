// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// fetch のpolyfill
global.fetch = jest.fn()

// Mock localStorage with persistent storage
const localStorageMock = (() => {
  let store = {}

  return {
    getItem: jest.fn((key) => {
      return store[key] || null
    }),
    setItem: jest.fn((key, value) => {
      store[key] = String(value)
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}

// Firebase関連のモック
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
}))