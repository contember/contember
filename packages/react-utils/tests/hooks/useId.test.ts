import { renderHook } from '@testing-library/react-hooks'
import { describe, expect, test } from 'vitest'
import { useId } from '../../src'

describe('@contember/utilities', () => {
	test('useClassName', () => {
		expect(renderHook(() => useId()).result.current).toBe(':a1:')
		expect(renderHook(() => useId()).result.current).toBe(':a2:')
		expect(renderHook(() => useId()).result.current).toBe(':a3:')
		expect(renderHook(() => useId()).result.current).toBe(':a4:')
		expect(renderHook(() => useId()).result.current).toBe(':a5:')
	})
})
