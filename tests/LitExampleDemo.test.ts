import { waitFor } from '@testing-library/dom'
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { ModuleManagerFactory } from '../src/core'
import '../src/lit'
import { AppModule } from '../examples/lit/app.module'
import '../examples/lit/user-list.element'

describe('Lit example app', () => {
  beforeEach(() => {
    ModuleManagerFactory.resetInstance()
  })

  // AppModule is loaded as this loader's root module - disconnecting it logs the expected
  // "Cannot unload root module" safety-guard warning.
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeAll(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterAll(() => {
    consoleWarnSpy.mockRestore()
  })

  test('renders users and adds one on button click', async () => {
    const loader = document.createElement('flexdi-root-module-loader') as any
    loader.module = AppModule
    const list = document.createElement('user-list')
    loader.appendChild(list)
    document.body.appendChild(loader)

    await waitFor(() => {
      expect(list.shadowRoot?.querySelectorAll('li').length).toBe(2)
    })

    const button = list.shadowRoot?.querySelector('button') as HTMLButtonElement
    expect(button).toBeTruthy()
    button.click()

    await waitFor(() => {
      expect(list.shadowRoot?.querySelectorAll('li').length).toBe(3)
    })
    expect(list.shadowRoot?.textContent).toContain('User 3')

    document.body.removeChild(loader)
  })
})
