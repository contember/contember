import {
	Editor,
	Element as SlateElement,
	Node as SlateNode,
	NodeEntry,
	Range as SlateRange,
	Text,
	Transforms,
} from 'slate'
import { HorizontalRuleElement, horizontalRuleElementPlugin, horizontalRuleElementType } from './HorizontalRuleElement'

export const withHorizontalRules = <E extends Editor>(editor: E): E => {
	const { insertText } = editor

	editor.registerElement(horizontalRuleElementPlugin)

	editor.insertText = text => {
		insertText(text)
		if (text !== '-') {
			return
		}
		const selection = editor.selection
		if (!selection || !SlateRange.isCollapsed(selection)) {
			return
		}
		const focusPoint = selection.focus

		if (focusPoint.offset < 3) {
			return
		}
		const [targetTextNode, targetPath] = Editor.node(editor, focusPoint)
		if (!Text.isText(targetTextNode)) {
			return
		}
		const slice = targetTextNode.text.slice(focusPoint.offset - 3, focusPoint.offset)
		if (slice !== '---') {
			return
		}

		Editor.withoutNormalizing(editor, () => {
			let closestBlockEntry: NodeEntry | undefined = Editor.above(editor, {
				at: focusPoint,
				mode: 'lowest',
				match: matchedNode =>
					SlateElement.isElement(matchedNode) && !editor.isInline(matchedNode) && editor.isDefaultElement(matchedNode),
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
			Transforms.insertNodes(editor, horizontalRule, {
				at: newHrPath,
			})

			// Remove the '---'
			editor.deleteBackward('character')
			editor.deleteBackward('character')
			editor.deleteBackward('character')

			const pointAfter = Editor.after(editor, newHrPath)
			if (pointAfter) {
				Transforms.select(editor, pointAfter)
			} else {
				// There's nothing to select so we're likely at the end. Insert a new default element then.
				const targetPath = [...newHrPath.slice(0, -1), newHrPath[newHrPath.length - 1] + 1]
				Transforms.insertNodes(editor, editor.createDefaultElement([{ text: '' }]), {
					at: targetPath,
					select: true,
				})
			}

			// Lastly, if remove the closest block. Need to update the entry though.
			closestBlockEntry = Editor.node(editor, closestBlockPath)
			if (!closestBlockEntry) {
				return
			}
			Transforms.removeNodes(editor, {
				at: closestBlockEntry[1],
			})
		})
	}

	return editor
}
