import { renderHook } from '@testing-library/react-hooks'
import { createRef } from 'react'
import { describe, expect, test } from 'vitest'
import { useNativeInput } from '../../src'


describe('useNativeInput hook', () => {

	test('empty props', () => {
		const { result } = renderHook(() => useNativeInput({}, createRef<HTMLInputElement>()))
		expect(result.current).toMatchInlineSnapshot(`
			{
			  "className": "",
			  "disabled": undefined,
			  "id": undefined,
			  "max": undefined,
			  "maxLength": undefined,
			  "min": undefined,
			  "minLength": undefined,
			  "name": undefined,
			  "onBlur": [Function],
			  "onFocus": [Function],
			  "pattern": undefined,
			  "placeholder": undefined,
			  "readOnly": undefined,
			  "ref": {
			    "current": null,
			  },
			  "required": undefined,
			}
		`)
	})

	test('pass many props', () => {
		const { result } = renderHook(() => useNativeInput({
			placeholder: 'my placeholder',
			max: 100,
			min: 10,
			active: true,
			scheme: 'light',
			loading: true,
			intent: 'primary',
			hovered: true,
			focused: true,
			distinction: 'seamless',
			readOnly: true,
			required: true,
			validationState: 'invalid',
			name: 'test,',
		}, createRef<HTMLInputElement>()))
		expect(result.current).toMatchInlineSnapshot(`
			{
			  "className": "is-active is-focused is-hovered is-loading is-read-only is-required scheme-light cui-theme theme-danger view-seamless is-invalid",
			  "disabled": true,
			  "id": undefined,
			  "max": 100,
			  "maxLength": undefined,
			  "min": 10,
			  "minLength": undefined,
			  "name": "test,",
			  "onBlur": [Function],
			  "onFocus": [Function],
			  "pattern": undefined,
			  "placeholder": "my placeholder",
			  "readOnly": true,
			  "ref": {
			    "current": null,
			  },
			  "required": true,
			}
		`)
	})
})
