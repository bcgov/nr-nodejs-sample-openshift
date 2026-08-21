import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const secretsStatus = {
  available: true,
  vaultPath: 'apps/dev/oscar-example/nodejs-sample/sample',
  file: '/vault/secrets/app.json',
  renderedAt: '2026-01-01T00:00:00.000Z',
  secrets: [
    { key: 'SAMPLE_API_KEY', length: 36, fingerprint: 'a1b2c3d4' },
    { key: 'SAMPLE_CLIENT_ID', length: 20, fingerprint: 'e5f6a7b8' },
  ],
}

export const restHandlers = [
  http.get('http://localhost:3000/api', () => {
    return new HttpResponse('Hello World!', { status: 200 })
  }),
  http.get('http://localhost:3000/api/v1/secrets', () => {
    return new HttpResponse(JSON.stringify(secretsStatus), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }),
]

const server = setupServer(...restHandlers)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

//  Close server after all tests
afterAll(() => server.close())

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers())
