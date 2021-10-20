import { EditorTableElement } from '@contember/ui'
import { memo, useCallback } from 'react'
import { Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useSelected, useSlateStatic } from 'slate-react'
import { assertNever } from '../../../../../../utils'
import { BlockElement } from '../../../baseEditor'
import type { TableCellElement } from './TableCellElement'
import type { TableElement } from './TableElement'
import type { TableRowElement } from './TableRowElement'
import { TableModifications } from './TableModifications'
import { isTableElement } from './TableElement'

export interface TableElementRendererProps extends Omit<RenderElementProps, 'element'> {
	element: TableElement
}

export const TableElementRenderer = memo(function TableElementRenderer(props: TableElementRendererProps) {
	const editor = useSlateStatic()
	const isSelected = useSelected()
	const isFocused = false

	const extendTable = useCallback(
		(vector: 'row' | 'column', index?: number) => {
			if (vector === 'row') {
				TableModifications.addTableRow(editor, props.element, index)
			} else if (vector === 'column') {
				TableModifications.addTableColumn(editor, props.element, index)
			} else {
				assertNever(vector)
			}
		},
		[editor, props.element],
	)
	const shrinkTable = useCallback(
		(vector: 'row' | 'column', index: number) => {
			if (vector === 'row') {
				TableModifications.deleteTableRow(editor, props.element, index)
			} else if (vector === 'column') {
				TableModifications.deleteTableColumn(editor, props.element, index)
			} else {
				assertNever(vector)
			}
		},
		[editor, props.element],
	)
	const toggleRowHeaderScope = useCallback(
		(index: number, scope: 'table') => {
			TableModifications.toggleTableRowHeaderScope(editor, props.element, index, scope)
		},
		[editor, props.element],
	)
	const toggleColumnHeaderScope = useCallback(
		(index: number, scope: 'row') => {
			TableModifications.toggleTableColumnHeaderScope(editor, props.element, index, scope)
		},
		[editor, props.element],
	)

	const justifyColumn = useCallback(
		(index: number, direction: TableCellElement['justify']) =>
			TableModifications.justifyTableColumn(editor, props.element, index, direction),
		[editor, props.element],
	)
	// TODO this kind of works but ends up generating tons of operations when used to delete the whole table.
	// 		it would require more testing to ensure that it works well so it will have to wait for now.
	// const selectTable = useCallback(() => {
	// 	const tablePath = ReactEditor.findPath(editor, props.element)
	// 	const firstTablePoint = SlateEditor.start(editor, tablePath)
	// 	const lastTablePoint = SlateEditor.end(editor, tablePath)
	//
	// 	const beforeFirst = SlateEditor.before(editor, firstTablePoint)
	// 	const afterLast = SlateEditor.after(editor, lastTablePoint)
	//
	// 	let range: SlateRange
	// 	if (beforeFirst) {
	// 		range = {
	// 			anchor: lastTablePoint,
	// 			focus: beforeFirst,
	// 		}
	// 	} else if (afterLast) {
	// 		range = {
	// 			anchor: firstTablePoint,
	// 			focus: afterLast,
	// 		}
	// 	} else {
	// 		range = {
	// 			anchor: firstTablePoint,
	// 			focus: lastTablePoint,
	// 		}
	// 	}
	// 	Transforms.select(editor, range)
	// }, [editor, props.element])
	const deleteTable = useCallback(() => {
		Promise.resolve().then(() => {
			// The promise is a hack to avoid an exception when the table is the last element in the editor.
			// Slate also has an onClick handler somewhere that attempts to update the caret position but if our handler
			// deletes the table before that gets to run, it operates on stale props (I think) and ends up throwing.
			// So as a hacky workaround, we just let it do its thing and actually remove the table later.
			Transforms.removeNodes(editor, {
				at: ReactEditor.findPath(editor, props.element),
				match: node => isTableElement(node),
			})
		})
	}, [editor, props.element])
	return (
		<BlockElement element={props.element} attributes={props.attributes} withBoundaries>
			<EditorTableElement
				rowCount={props.element.children.length}
				columnCount={(props.element.children[0] as TableRowElement | undefined)?.children.length ?? 0}
				extendTable={extendTable}
				shrinkTable={shrinkTable}
				toggleRowHeaderScope={toggleRowHeaderScope}
				toggleColumnHeaderScope={toggleColumnHeaderScope}
				justifyColumn={justifyColumn}
				//selectTable={selectTable}
				deleteTable={deleteTable}
				isSelected={isSelected}
				isFocused={isFocused}
			>
				{props.children}
			</EditorTableElement>
		</BlockElement>
	)
})
