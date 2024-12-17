import { describe, expect, test } from 'bun:test'
import { BuiltinLeaves, RichText } from '../src'
import { render } from '@testing-library/react'

describe('leaf rendering', () => {
	const createLeafBlock = (text: string, marker: keyof BuiltinLeaves | string) => ({
		content: {
			formatVersion: 1,
			children: [{
				text,
				[marker]: true,
			}],
		},
		id: '1',
		references: undefined,
	})

	test('render bold', () => {
		expect(render(<RichText blocks={[createLeafBlock('Hello', 'isBold')]} />).container.innerHTML)
			.toEqual(`<b>Hello</b>`)
	})

	test('render code', () => {
		expect(render(<RichText blocks={[createLeafBlock('Hello', 'isCode')]} />).container.innerHTML)
			.toEqual(`<code>Hello</code>`)
	})


	test('render highlighted', () => {
		expect(render(<RichText blocks={[createLeafBlock('Hello', 'isHighlighted')]} />).container.innerHTML)
			.toEqual(`<em>Hello</em>`)
	})


	test('render italic', () => {
		expect(render(<RichText blocks={[createLeafBlock('Hello', 'isItalic')]} />).container.innerHTML)
			.toEqual(`<i>Hello</i>`)
	})


	test('render underline', () => {
		expect(render(<RichText blocks={[createLeafBlock('Hello', 'isUnderlined')]} />).container.innerHTML)
			.toEqual(`<u>Hello</u>`)
	})


	test('render struck through', () => {
		expect(render(<RichText blocks={[createLeafBlock('Hello', 'isStruckThrough')]} />).container.innerHTML)
			.toEqual(`<s>Hello</s>`)
	})


	test('render multiple', () => {
		expect(render(<RichText blocks={[{
			content: {
				formatVersion: 1,
				children: [{
					text: 'Hello',
					isBold: true,
					isItalic: true,
				}],
			},
			id: '1',
			references: undefined,
		}]} />).container.innerHTML)
			.toEqual(`<b><i>Hello</i></b>`)
	})

	test('render custom leaf', () => {
		expect(render(<RichText<never, {isSup?: boolean} & BuiltinLeaves> blocks={[createLeafBlock('Hello', 'isSup')]} renderLeaf={it => {
			if (it.leaf.isSup) {
				return <sup>{it.fallback}</sup>
			}
			return it.fallback
		}} />).container.innerHTML)
			.toEqual(`<sup>Hello</sup>`)
	})
})
