import type { Location as SlateLocation, NodeEntry } from 'slate'
import type { BaseEditor, EditorNode, ElementNode } from '../../baseEditor'
import { closest } from './closest'
import { Element } from 'slate'

export const closestViableBlockContainerEntry = <E extends BaseEditor>(
	editor: E,
	options?: {
		at?: SlateLocation
	},
): NodeEntry<ElementNode | EditorNode> | undefined =>
	closest(editor, {
		at: options?.at,
		match: node => Element.isElement(node) && editor.canContainAnyBlocks(node),
	})
