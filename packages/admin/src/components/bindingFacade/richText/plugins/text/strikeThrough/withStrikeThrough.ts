import isHotkey from 'is-hotkey'
import { createElement } from 'react'
import { BaseEditor } from '../../../baseEditor'

export const strikeThroughMark = 'isStruckThrough'

export const withStrikeThrough = <E extends BaseEditor>(editor: E): E => {
	const { onKeyDown, renderLeafChildren, processAttributesPaste, processInlinePaste } = editor

	const isStruckThroughHotkey = isHotkey('mod+opt+s')

	editor.renderLeafChildren = props => {
		const children = renderLeafChildren(props)

		if (props.leaf[strikeThroughMark] === true) {
			return createElement('s', undefined, children)
		}
		return children
	}

	editor.onKeyDown = event => {
		// TODO use onDOMBeforeInput for this
		if (isStruckThroughHotkey(event.nativeEvent)) {
			editor.toggleMarks({ [strikeThroughMark]: true })
			event.preventDefault()
		}
		onKeyDown(event)
	}

	editor.processAttributesPaste = (element, cta) => {
		if (element.style.textDecoration) {
			cta = { ...cta, strikeThroughMark: element.style.textDecoration === 'line-through' }
		}
		return processAttributesPaste(element, cta)
	}

	editor.processInlinePaste = (element, next, cumulativeTextAttrs) => {
		if (element.nodeName === 'S') {
			return next(element.childNodes, { ...cumulativeTextAttrs, [strikeThroughMark]: true })
		}
		return processInlinePaste(element, next, cumulativeTextAttrs)
	}

	return editor
}
