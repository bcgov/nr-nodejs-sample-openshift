import { customLogger } from './logger.config'

describe('CustomLogger', () => {
  it('should be defined', () => {
    expect(customLogger).toBeDefined()
  })

  it('should log a message', () => {
    const logger = customLogger as typeof customLogger & {
      verbose: (...args: unknown[]) => unknown
    }
    const spy = vi.spyOn(logger, 'verbose')
    logger.verbose('Test message')
    expect(spy).toHaveBeenCalledWith('Test message')
    spy.mockRestore()
  })
})
