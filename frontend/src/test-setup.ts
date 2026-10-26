import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const intentionResult = {
  environment: 'development',
  total: 1,
  latest: {
    id: 'intention-123',
    project: 'oscar-example',
    service: 'nodejs-sample',
    environment: 'development',
    packageVersion: '1.2.3',
    outcome: 'success',
  },
}

export const restHandlers = [
  http.get('http://localhost:3000/api', () => {
    return new HttpResponse('Hello World!', { status: 200 })
  }),
  http.get('http://localhost:3000/api/v1/intention', () => {
    return new HttpResponse(JSON.stringify(intentionResult), {
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
