import { renderHook } from '@testing-library/react-hooks'
import { describe, expect, test } from 'vitest'
import { ControlProps } from '../../src'
import { useInputValue } from '../../src/components/Forms/hooks/useInputValue'
import { useCallback } from 'react'

const useTextBasedInputValue = <E extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
	props: ControlProps<string>,
) => {
	return useInputValue<string, E>({
		...props,
		emptyValue: '',
		extractValue: useCallback(input => input.value, []),
	})
}

describe('useInputValue hook', () => {
	test('default null value', () => {
		const { result } = renderHook(() => useTextBasedInputValue({}))
		expect(result.current.state).toBe(null)
	})

	test('not null', () => {
		const { result } = renderHook(() => useTextBasedInputValue({
			notNull: true,
		}))
		expect(result.current.state).toBe('')
	})


	test('passed default value', () => {
		const { result } = renderHook(() => useTextBasedInputValue({ defaultValue: 'abcd' }))
		expect(result.current.state).toBe('abcd')
	})

	test('invoke on change', () => {
		let received = null

		const { result } = renderHook(() => useTextBasedInputValue({
			onChange: receivedVal => {
				received = receivedVal
			},
		}))

		result.current.onChange({
			target: {
				value: 'abcd',
			},
		} as any)

		expect(result.current.state).toBe('abcd')
		expect(received).toBe('abcd')
	})

	test('controlled value', () => {
		let onChangeInvoked = false
		const { result, rerender } = renderHook(({ value }) => useTextBasedInputValue({
			value,
			onChange: () => {
				onChangeInvoked = true
			},
		}), {
			initialProps: {
				value: 'abcd',
			},
		})
		expect(result.current.state).toBe('abcd')
		rerender({ value: 'xyz' })
		expect(result.current.state).toBe('xyz')
		expect(onChangeInvoked).toBe(false)
		rerender({ value: null })
		expect(result.current.state).toBe(null)
	})


	test('controlled value with notnull', () => {
		const { result, rerender } = renderHook(({ value }) => useTextBasedInputValue({
			value,
			notNull: true,
		}), {
			initialProps: {
				value: 'abcd',
			},
		})
		expect(result.current.state).toBe('abcd')
		rerender({ value: null })
		expect(result.current.state).toBe('')
	})
})
