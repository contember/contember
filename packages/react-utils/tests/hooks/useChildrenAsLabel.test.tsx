import jsdom from 'jsdom'
import { createPortal } from 'react-dom'
import { describe, expect, it } from 'vitest'
import { getChildrenAsLabel } from '../../src'

const { JSDOM } = jsdom
const { window } = new JSDOM('<!doctype html><html><body></body></html>')
global.document = window.document

describe('@contember/utilities.getChildrenAsLabel', () => {
	it('should return undefined for null or undefined children', () => {
		expect(getChildrenAsLabel(null)).toBeUndefined()
		expect(getChildrenAsLabel(undefined)).toBeUndefined()
	})

	it('should return undefined for boolean children', () => {
		expect(getChildrenAsLabel(true)).toBeUndefined()
		expect(getChildrenAsLabel(false)).toBeUndefined()
	})

	it('should return the string representation of a string or number child', () => {
		expect(getChildrenAsLabel('Hello')).toBe('Hello')
		expect(getChildrenAsLabel(42)).toBe('42')
	})

	it('should concatenate the string representation of multiple string or number children', () => {
		expect(getChildrenAsLabel(['Hello', 'world'])).toBe('Helloworld')
		expect(getChildrenAsLabel([42, ' is ', ' the ', ' answer '])).toBe('42 is the answer')
	})

	it('should ignore whitespace-only string children', () => {
		expect(getChildrenAsLabel(['Hello', '  ', 'world'])).toBe('Hello world')
	})

	it('should concatenate the labels of nested children', () => {
		const nested = (
			<div>
				<span>Hello </span>
				<span> world </span>
			</div>
		)

		expect(getChildrenAsLabel(nested)).toBe('Hello world')
	})

	it('should ignore null, undefined, or boolean nested children', () => {
		const nested = (
			<div>
				<span>Hello</span>
				{null}
				{undefined}
				<span>world</span>
				{true}
				{false}
			</div>
		)

		expect(getChildrenAsLabel(nested)).toBe('Helloworld')
	})

	it('should concatenate the labels of nested arrays of children', () => {
		const nested = [
			<span key="0.1">Hello </span>,
			[<span key="1.1">world </span>, '!', null],
			<span key="1.2">How are you?</span>,
		]

		expect(getChildrenAsLabel(nested)).toBe('Hello world !How are you?')
	})

	it('should concatenate the createPortal children', () => {
		const nested = (
			<>
				{createPortal('Hello world', document.body)}
				{createPortal(<span>!</span>, document.body)}
			</>
		)

		expect(getChildrenAsLabel(nested)).toBe('Hello world!')
	})

	it('should ignore unsupported child types', () => {
		const unsupported = (
			<div>
				<span>Hello </span>
				{42}
				{(() => { }) as any}
				<>
					<span>world </span>
				</>
			</div>
		)

		expect(getChildrenAsLabel(unsupported)).toBe('Hello 42world')
	})
})
