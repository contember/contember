import { describe, expect, test } from 'vitest'
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
		expect(render(<RichText blocks={[createLeafBlock('Hello', 'isBold')]} />).container.firstChild)
			.toMatchInlineSnapshot(`
			<b>
			  Hello
			</b>
		`)
	})

	test('render code', () => {
		expect(render(<RichText blocks={[createLeafBlock('Hello', 'isCode')]} />).container.firstChild)
			.toMatchInlineSnapshot(`
				<code>
				  Hello
				</code>
			`)
	})


	test('render highlighted', () => {
		expect(render(<RichText blocks={[createLeafBlock('Hello', 'isHighlighted')]} />).container.firstChild)
			.toMatchInlineSnapshot(`
				<em>
				  Hello
				</em>
			`)
	})


	test('render italic', () => {
		expect(render(<RichText blocks={[createLeafBlock('Hello', 'isItalic')]} />).container.firstChild)
			.toMatchInlineSnapshot(`
				<i>
				  Hello
				</i>
			`)
	})


	test('render underline', () => {
		expect(render(<RichText blocks={[createLeafBlock('Hello', 'isUnderlined')]} />).container.firstChild)
			.toMatchInlineSnapshot(`
				<u>
				  Hello
				</u>
			`)
	})


	test('render struck through', () => {
		expect(render(<RichText blocks={[createLeafBlock('Hello', 'isStruckThrough')]} />).container.firstChild)
			.toMatchInlineSnapshot(`
				<s>
				  Hello
				</s>
			`)
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
		}]} />).container.firstChild)
			.toMatchInlineSnapshot(`
				<b>
				  <i>
				    Hello
				  </i>
				</b>
			`)
	})

	test('render custom leaf', () => {
		expect(render(<RichText<never, {isSup?: boolean} & BuiltinLeaves> blocks={[createLeafBlock('Hello', 'isSup')]} renderLeaf={it => {
			if (it.leaf.isSup) {
				return <sup>{it.fallback}</sup>
			}
			return it.fallback
		}} />).container.firstChild)
			.toMatchInlineSnapshot(`
				<sup>
				  Hello
				</sup>
			`)
	})
})
