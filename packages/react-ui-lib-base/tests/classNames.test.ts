import { describe, expect, test } from 'bun:test'
import { cva, cx } from '../src/utils/classNames.js'

describe('cx', () => {
	test('joins strings and numbers, drops falsy values', () => {
		expect(cx('a', 0, 1, '', null, undefined, false, true, 'b')).toBe('a 1 b')
	})

	test('flattens arrays and takes truthy keys of objects', () => {
		expect(cx(['a', ['b', { c: true, d: false, e: 1 }]], { f: 'yes', g: 0, h: null })).toBe('a b c e f')
	})

	test('returns an empty string for no input', () => {
		expect(cx()).toBe('')
		expect(cx([], {})).toBe('')
	})
})

describe('cva', () => {
	const button = cva('base', {
		variants: {
			intent: { primary: 'primary', secondary: 'secondary' },
			size: { sm: 'sm', lg: 'lg' },
			disabled: { true: 'is-disabled', false: 'is-enabled' },
			level: { 0: 'level-0', 1: 'level-1' },
		},
		defaultVariants: { intent: 'primary', size: 'sm', disabled: false, level: 0 },
		compoundVariants: [
			{ intent: 'secondary', size: 'lg', className: 'secondary-lg' },
			{ intent: ['primary', 'secondary'], disabled: true, class: 'any-disabled' },
		],
	})

	test('applies default variants', () => {
		expect(button()).toBe('base primary sm is-enabled level-0')
	})

	test('props override defaults, null drops the variant, undefined keeps the default', () => {
		expect(button({ intent: 'secondary', size: null, disabled: undefined })).toBe('base secondary is-enabled level-0')
	})

	test('maps booleans and 0 to variant keys', () => {
		expect(button({ disabled: true, level: 1 })).toBe('base primary sm is-disabled level-1 any-disabled')
	})

	test('matches compound variants against defaults merged with props', () => {
		expect(button({ intent: 'secondary', size: 'lg' })).toBe('base secondary lg is-enabled level-0 secondary-lg')
	})

	test('appends class and className last', () => {
		expect(button({ className: 'extra' })).toBe('base primary sm is-enabled level-0 extra')
		expect(button({ class: ['x', { y: true }] })).toBe('base primary sm is-enabled level-0 x y')
	})

	test('without variants returns base plus class names', () => {
		expect(cva(['a', 'b'])({ className: 'c' })).toBe('a b c')
		expect(cva()()).toBe('')
	})
})
