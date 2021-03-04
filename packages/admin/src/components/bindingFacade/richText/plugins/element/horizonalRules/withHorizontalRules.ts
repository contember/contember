import { createElement } from 'react'
import {
	Editor,
	Element as SlateElement,
	Node as SlateNode,
	NodeEntry,
	Range as SlateRange,
	Text,
	Transforms,
} from 'slate'
import { BaseEditor, ElementNode, WithAnotherNodeType } from '../../../baseEditor'
import { EditorWithHorizontalRules, WithHorizontalRules } from './EditorWithHorizontalRules'
import { HorizontalRuleElement, horizontalRuleElementType } from './HorizontalRuleElement'
import { HorizontalRuleRenderer, HorizontalRuleRendererProps } from './HorizontalRuleRenderer'

export const withHorizontalRules = <E extends BaseEditor>(editor: E): EditorWithHorizontalRules<E> => {
	type BaseHorizontalRuleEditor = WithAnotherNodeType<E, HorizontalRuleElement>

	const e: E & Partial<WithHorizontalRules<BaseHorizontalRuleEditor>> = editor
	const { isVoid, insertText, renderElement, toggleElement } = editor

	const isHorizontalRule = (element: SlateNode | ElementNode): element is HorizontalRuleElement =>
		element.type === horizontalRuleElementType
	const isHorizontalRuleActive = (editor: BaseHorizontalRuleEditor) => {
		const [hr] = Editor.nodes(editor, { match: isHorizontalRule })
		return !!hr
	}
	const removeHorizontalRule = (editor: BaseHorizontalRuleEditor) => {
		Transforms.removeNodes(editor, { match: isHorizontalRule })
	}
	const insertHorizontalRule = (editor: BaseHorizontalRuleEditor) => {
		const selection = editor.selection
		const isCollapsed = selection ? SlateRange.isCollapsed(selection!) : false

		if (!isCollapsed || isHorizontalRuleActive(editor)) {
			return
		}
		const horizontalRule: HorizontalRuleElement = {
			type: horizontalRuleElementType,
			children: [{ text: '' }],
		}
		Transforms.insertNodes(editor, horizontalRule)
	}

	e.isHorizontalRule = isHorizontalRule

	e.toggleElement = (elementType, suchThat) => {
		if (elementType === horizontalRuleElementType) {
			return e.isElementActive(elementType, suchThat) ? removeHorizontalRule(e) : insertHorizontalRule(e)
		}
		return toggleElement(elementType, suchThat)
	}

	e.renderElement = props => {
		if (isHorizontalRule(props.element)) {
			return createElement(HorizontalRuleRenderer, props as HorizontalRuleRendererProps)
		}
		return renderElement(props)
	}

	e.isVoid = element => {
		if (isHorizontalRule(element)) {
			return true
		}
		return isVoid(element)
	}

	e.insertText = text => {
		insertText(text)
		if (text !== '-') {
			return
		}
		const selection = e.selection
		if (!selection || !SlateRange.isCollapsed(selection)) {
			return
		}
		const focusPoint = selection.focus

		if (focusPoint.offset < 3) {
			return
		}
		const [targetTextNode, targetPath] = Editor.node(e, focusPoint)
		if (!Text.isText(targetTextNode)) {
			return
		}
		const slice = targetTextNode.text.slice(focusPoint.offset - 3, focusPoint.offset)
		if (slice !== '---') {
			return
		}

		Editor.withoutNormalizing(e, () => {
			let closestBlockEntry: NodeEntry | undefined = Editor.above(e, {
				at: focusPoint,
				mode: 'lowest',
				match: matchedNode =>
					SlateElement.isElement(matchedNode) && !e.isInline(matchedNode) && e.isDefaultElement(matchedNode),
			})
			if (!closestBlockEntry) {
				return
			}
			const [closestBlock, closestBlockPath] = closestBlockEntry
			if (closestBlockPath.length !== 1 || SlateNode.string(closestBlock) !== '---') {
				return // We only support horizontal rules at the very top level.
			}

			// First insert the rule after the closest block
			const horizontalRule: HorizontalRuleElement = {
				type: horizontalRuleElementType,
				children: [{ text: '' }],
			}
			const newHrPath = [...closestBlockPath.slice(0, -1), closestBlockPath[closestBlockPath.length - 1] + 1]
			Transforms.insertNodes(e, horizontalRule, {
				at: newHrPath,
			})

			// Remove the '---'
			e.deleteBackward('character')
			e.deleteBackward('character')
			e.deleteBackward('character')

			const pointAfter = Editor.after(e, newHrPath)
			if (pointAfter) {
				Transforms.select(e, pointAfter)
			} else {
				// There's nothing to select so we're likely at the end. Insert a new default element then.
				const targetPath = [...newHrPath.slice(0, -1), newHrPath[newHrPath.length - 1] + 1]
				Transforms.insertNodes(editor, editor.createDefaultElement([{ text: '' }]), {
					at: targetPath,
					select: true,
				})
			}

			// Lastly, if remove the closest block. Need to update the entry though.
			closestBlockEntry = Editor.node(e, closestBlockPath)
			if (!closestBlockEntry) {
				return
			}
			Transforms.removeNodes(e, {
				at: closestBlockEntry[1],
			})
		})
	}

	return (e as unknown) as EditorWithHorizontalRules<E>
}
