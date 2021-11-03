import type { Location as SlateLocation, NodeEntry } from 'slate'
import { Editor as SlateEditor, Element as SlateElement } from 'slate'
import { closest } from './closest'

export const closestViableBlockContainerEntry = <E extends SlateEditor>(
	editor: E,
	options?: {
		at?: SlateLocation
	},
): NodeEntry<SlateElement | SlateEditor> | undefined =>
	closest(editor, {
		at: options?.at,
		match: node => editor.canContainAnyBlocks(node),
	})
