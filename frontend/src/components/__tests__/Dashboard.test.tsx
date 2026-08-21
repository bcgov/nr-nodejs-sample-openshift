import { vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Dashboard from '@/components/Dashboard'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

describe('Dashboard', () => {
  test('renders the hello world greeting', async () => {
    render(<Dashboard />)
    expect(await screen.findByRole('heading', { name: 'Hello World!' })).toBeInTheDocument()
  })

  test('renders metadata for the injected secrets', async () => {
    render(<Dashboard />)

    expect(await screen.findByText('Secret Key')).toBeInTheDocument()
    expect(await screen.findByText('SAMPLE_API_KEY')).toBeInTheDocument()
    expect(screen.getByText('a1b2c3d4')).toBeInTheDocument()
    expect(screen.getByText('apps/dev/oscar-example/nodejs-sample/sample')).toBeInTheDocument()
  })
})
