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

  test('renders the latest package installation intention', async () => {
    render(<Dashboard />)

    expect(await screen.findByText('intention-123')).toBeInTheDocument()
    expect(screen.getByText('1.2.3')).toBeInTheDocument()
    expect(screen.getByText('success')).toBeInTheDocument()
  })
})
