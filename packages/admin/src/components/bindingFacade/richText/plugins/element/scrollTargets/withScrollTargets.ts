import { createElement } from 'react'
import { Editor, Node as SlateNode, Range as SlateRange, Transforms } from 'slate'
import type { BaseEditor, ElementNode, ElementSpecifics, WithAnotherNodeType } from '../../../baseEditor'
import type { EditorWithScrollTargets, WithScrollTargets } from './EditorWithScrollTargets'
import { ScrollTargetElement, scrollTargetElementType } from './ScrollTargetElement'
import { ScrollTargetRenderer, ScrollTargetRendererProps } from './ScrollTargetRenderer'

export const withScrollTargets = <E extends BaseEditor>(editor: E): EditorWithScrollTargets<E> => {
	type BaseScrollTargetEditor = WithAnotherNodeType<E, ScrollTargetElement>

	const e: E & Partial<WithScrollTargets<BaseScrollTargetEditor>> = editor
	const { isInline, isVoid, renderElement, toggleElement, isElementActive } = editor

	const isScrollTarget = (element: SlateNode | ElementNode): element is ScrollTargetElement =>
		element.type === scrollTargetElementType
	const isScrollTargetActive = (editor: BaseScrollTargetEditor) => {
		const [link] = Editor.nodes(editor, { match: isScrollTarget })
		return !!link
	}
	const unwrapScrollTarget = (editor: BaseScrollTargetEditor) => {
		Transforms.removeNodes(editor, { match: isScrollTarget })
	}
	const wrapScrollTarget = (editor: BaseScrollTargetEditor, identifier: string) => {
		if (isScrollTargetActive(editor)) {
			unwrapScrollTarget(editor)
		}

		const selection = editor.selection
		const isCollapsed = selection ? SlateRange.isCollapsed(selection!) : false
		const ScrollTarget: ScrollTargetElement = {
			type: scrollTargetElementType,
			identifier,
			children: [{ text: '' }],
		}

		if (!isCollapsed) {
			Transforms.collapse(editor, { edge: 'start' })
		}
		Transforms.insertNodes(editor, ScrollTarget)
	}

	e.isScrollTarget = isScrollTarget

	e.isElementActive = (elementType, suchThat) => {
		if (elementType === scrollTargetElementType) {
			// TODO this includes waay too many false positives
			const [link] = Editor.nodes(editor, { match: isScrollTarget })
			return !!link
		}
		return isElementActive(elementType, suchThat)
	}

	e.toggleElement = (elementType, suchThat) => {
		if (elementType === scrollTargetElementType) {
			if (e.isElementActive(elementType, suchThat)) {
				unwrapScrollTarget(e)
			} else {
				let identifier =
					(suchThat as unknown as ElementSpecifics<ScrollTargetElement> | undefined)?.identifier ??
					prompt('Insert the identifier:')

				if (!identifier) {
					return
				}
				wrapScrollTarget(e, identifier)
			}
		}
		return toggleElement(elementType, suchThat)
	}

	e.renderElement = props => {
		if (isScrollTarget(props.element)) {
			return createElement(ScrollTargetRenderer, props as ScrollTargetRendererProps)
		}
		return renderElement(props)
	}

	e.isInline = element => {
		if (isScrollTarget(element)) {
			return true
		}
		return isInline(element)
	}

	e.isVoid = element => {
		if (isScrollTarget(element)) {
			return true
		}
		return isVoid(element)
	}

	return e as unknown as EditorWithScrollTargets<E>
}
