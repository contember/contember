import { Editor, Editor as SlateEditor, Element as SlateElement, Point, Range as SlateRange, Transforms } from 'slate'
import { ContemberEditor } from '../../../ContemberEditor'
import {
	ejectHeadingElement,
	HeadingElement,
	headingElementPlugin,
	headingElementType,
	isHeadingElement,
} from './HeadingElement'
import { headingHtmlDeserializer } from './HeadingHtmlDeserializer'
import { isReferenceElement } from '../../../blockEditor'

export const withHeadings = <E extends Editor>(editor: E): E => {
	const {
		canToggleElement,
		insertBreak,
		deleteBackward,
	} = editor


	editor.registerElement(headingElementPlugin)
	editor.htmlDeserializer.registerPlugin(headingHtmlDeserializer)

	// T O D O cache this
	// e.getNumberedHeadingSection = function recurse(element): number[] {
	// 	const [topLevelIndex] = ReactEditor.findPath(e, element)
	// 	let previousNumberedHeadingIndex: number = topLevelIndex - 1
	//
	// 	let previousNumberedHeading: SlateNode
	// 	do {
	// 		previousNumberedHeading = e.children[previousNumberedHeadingIndex--]
	// 	} while (
	// 		previousNumberedHeadingIndex >= 0 &&
	// 		!(isHeading(previousNumberedHeading) && previousNumberedHeading.isNumbered)
	// 	)
	//
	// 	if (previousNumberedHeadingIndex < 0) {
	// 		return Array(element.level).fill(1)
	// 	}
	// 	const previousHeadingSection = recurse(previousNumberedHeading as HeadingElement)
	//
	// 	// Ensures the correct length - this is essentially padRight with zeros
	// 	const normalizedPrevious = previousHeadingSection.concat(Array(element.level).fill(0)).slice(0, element.level)
	//
	// 	normalizedPrevious[normalizedPrevious.length - 1]++
	//
	// 	// The map isn't really necessary for now but would be if we introduced deeper levels
	// 	return normalizedPrevious.map(level => Math.max(level, 1))
	// }

	editor.canToggleElement = (elementType, suchThat) => {
		if (elementType !== headingElementType) {
			return canToggleElement(elementType, suchThat)
		}
		if (!editor.selection) {
			return false
		}
		const closestBlockEntry = ContemberEditor.closestBlockEntry(editor)
		if (closestBlockEntry === undefined) {
			return true
		}
		const [closestBlockElement] = closestBlockEntry

		return (
			SlateElement.isElement(closestBlockElement) && (
				editor.isDefaultElement(closestBlockElement)
				|| isHeadingElement(closestBlockElement)
				|| isReferenceElement(closestBlockElement)
			)
		)
	}



	editor.insertBreak = () => {
		SlateEditor.withoutNormalizing(editor, () => {
			insertBreak()

			const { selection } = editor

			if (selection === null || SlateRange.isExpanded(selection)) {
				return
			}
			const [topLevelElement, path] = SlateEditor.node(editor, selection, {
				depth: 1,
			})
			if (isHeadingElement(topLevelElement) && SlateEditor.isEmpty(editor, topLevelElement)) {
				ejectHeadingElement(editor, path)
			}
		})
	}

	editor.deleteBackward = unit => {
		const selection = editor.selection
		if (unit !== 'character' || !selection || !SlateRange.isCollapsed(selection) || selection.focus.offset !== 0) {
			return deleteBackward(unit)
		}
		// The offset being zero doesn't necessarily imply that selection refers to the start of a heading.
		// It's just a way to early-exit.

		const closestNumberedEntry = Editor.above<HeadingElement>(editor, {
			match: node => SlateElement.isElement(node) && isHeadingElement(node, { isNumbered: true }),
		})
		if (closestNumberedEntry === undefined) {
			return deleteBackward(unit)
		}
		const [, headingPath] = closestNumberedEntry
		const headingStartPoint = Editor.start(editor, headingPath)

		if (!Point.equals(headingStartPoint, selection.focus)) {
			return deleteBackward(unit)
		}
		Transforms.setNodes(
			editor,
			{ isNumbered: null }, // null removes the key altogether
			{ at: headingPath },
		)
	}

	return editor
}
