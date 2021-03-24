import { Fragment, ReactNode } from 'react'
import { BuiltinLeaves } from './BuiltinLeaves'

export interface RenderLeafFallbackProps {
	leaf: BuiltinLeaves
}

function jsxN2br(text: string): ReactNode {
	const lines = text.split('\n')
	if (lines.length <= 1) {
		return text
	}
	return lines.map((line, i) => (
		<Fragment key={i}>
			{!!i && <br />}
			{line}
		</Fragment>
	))
}

export function RenderLeafFallback({ leaf }: RenderLeafFallbackProps) {
	let element = jsxN2br(leaf.text)

	if ('isCode' in leaf && leaf.isCode === true) {
		element = <code>{element}</code>
	}
	if ('isStruckThrough' in leaf && leaf.isStruckThrough === true) {
		element = <s>{element}</s>
	}
	if ('isHighlighted' in leaf && leaf.isHighlighted === true) {
		element = <em>{element}</em>
	}
	if ('isUnderlined' in leaf && leaf.isUnderlined === true) {
		element = <u>{element}</u>
	}
	if ('isItalic' in leaf && leaf.isItalic === true) {
		element = <i>{element}</i>
	}
	if ('isBold' in leaf && leaf.isBold === true) {
		element = <b>{element}</b>
	}
	return <>{element}</>
}
