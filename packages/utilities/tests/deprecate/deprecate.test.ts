import { describe, expect, it, vitest } from 'vitest'
import { deprecate } from '../../src'

describe('@contember/utilities.deprecate', () => {
	it('logs a warning if the condition is true', () => {
		const spy = vitest.spyOn(console, 'warn').mockImplementation(() => { })
		deprecate('2.0.0', true, 'oldFeature', 'newFeature')
		expect(spy).toHaveBeenCalledWith('Use of oldFeature is deprecated and might be removed in the next release. Use newFeature instead.')
		spy.mockRestore()
	})

	it('throws an error if strict deprecations are enabled and the condition is true', () => {
		const originalEnv = process.env
		process.env = { ...originalEnv, VITE_CONTEMBER_ADMIN_STRICT_DEPRECATIONS: 'true' }
		expect(() => {
			deprecate('2.0.0', true, 'oldFeature', 'newFeature')
		}).toThrow('Support for oldFeature was planned to be removed in the 2.0.0 release. Replace it with newFeature instead.')
		process.env = originalEnv
	})

	it('does not log a warning if the condition is false', () => {
		const spy = vitest.spyOn(console, 'warn').mockImplementation(() => { })
		deprecate('2.0.0', false, 'oldFeature', 'newFeature')
		expect(spy).not.toHaveBeenCalled()
		spy.mockRestore()
	})

	it('does not throw an error if strict deprecations are enabled and the condition is false', () => {
		const originalEnv = process.env
		process.env = { ...originalEnv, VITE_CONTEMBER_ADMIN_STRICT_DEPRECATIONS: 'true' }
		expect(() => {
			deprecate('2.0.0', false, 'oldFeature', 'newFeature')
		}).not.toThrow()
		process.env = originalEnv
	})

	it('does not log a warning if the condition is true but the environment is not development', () => {
		const originalEnv = process.env
		process.env = { ...originalEnv, DEV: '' }
		const spy = vitest.spyOn(console, 'warn').mockImplementation(() => { })
		deprecate('2.0.0', true, 'oldFeature', 'newFeature')
		expect(spy).not.toHaveBeenCalled()
		spy.mockRestore()
		process.env = originalEnv
	})

	it('logs a warning if the condition is true and replacement is null', () => {
		const spy = vitest.spyOn(console, 'warn').mockImplementation(() => { })
		deprecate('2.0.0', true, 'oldFeature', null)
		expect(spy).toHaveBeenCalledWith('Use of oldFeature is deprecated and might be removed in the next release. There is no replacement.')
		spy.mockRestore()
	})
})
