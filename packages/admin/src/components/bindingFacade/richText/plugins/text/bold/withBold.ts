import isHotkey from 'is-hotkey'
import * as React from 'react'
import { BaseEditor } from '../../../baseEditor'

export const boldMark = 'isBold'

export const withBold = <E extends BaseEditor>(editor: E): E => {
	const { onKeyDown, renderLeafChildren, processAttributesPaste, processInlinePaste } = editor

	const isBoldHotkey = isHotkey('mod+b')

	editor.renderLeafChildren = props => {
		const children = renderLeafChildren(props)

		if (props.leaf[boldMark] === true) {
			return React.createElement('b', undefined, children)
		}
		return children
	}

	editor.onKeyDown = event => {
		// TODO use onDOMBeforeInput for this
		if (isBoldHotkey(event.nativeEvent)) {
			editor.toggleMarks({ [boldMark]: true })
			event.preventDefault()
		}
		onKeyDown(event)
	}

	editor.processAttributesPaste = (element, cta) => {
		if (element.style.fontWeight) {
			const isBold = ['700', '800', '900', 'bold', 'bolder'].includes(element.style.fontWeight)
			cta[boldMark] = isBold
		}
		return processAttributesPaste(element, cta)
	}

	editor.processInlinePaste = (element, next, cumulativeTextAttrs) => {
		if (element.nodeName === 'STRONG' || (element.nodeName === 'B' && !element.id.startsWith('docs-internal-guid'))) {
			return next(element.childNodes, { ...cumulativeTextAttrs, [boldMark]: true })
		}
		return processInlinePaste(element, next, cumulativeTextAttrs)
	}

	return editor
}
