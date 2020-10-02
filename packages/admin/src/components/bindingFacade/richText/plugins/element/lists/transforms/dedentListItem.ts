import {
	Editor,
	Element as SlateElement,
	Node as SlateNode,
	NodeEntry,
	Path as SlatePath,
	Point,
	Range as SlateRange,
	Text,
	Transforms,
} from 'slate'
import { BaseEditor } from '../../../../baseEditor'
import { EditorWithLists } from '../EditorWithLists'
import { ListItemElement } from '../ListItemElement'

export const dedentListItem = (
	editor: EditorWithLists<BaseEditor>,
	listItem: ListItemElement,
	listItemPath: SlatePath,
): boolean => {
	return false // TODO stub
}
