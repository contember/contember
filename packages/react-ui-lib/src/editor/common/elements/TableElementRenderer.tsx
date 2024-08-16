import { isTableElement, TableCellElement, TableElement, TableModifications } from '@contember/react-slate-editor-base'
import { assertNever } from '@contember/utilities'
import { memo, useCallback } from 'react'
import { Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useSelected, useSlateStatic } from 'slate-react'
import { BlockElement } from './BlockElement'


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

	const deleteTable = useCallback(() => {
		Promise.resolve().then(() => {
			// The promise is a hack to avoid an exception when the table is the last element in the editor.
			// Slate also has an onClick handler somewhere that attempts to update the caret position but if our handler
			// deletes the table before that gets to run, it operates on stale props (I think) and ends up throwing.
			// So as a hacky workaround, we just let it do its thing and actually remove the table later.
			return Transforms.removeNodes(editor, {
				at: ReactEditor.findPath(editor, props.element),
				match: node => isTableElement(node),
			})
		}).catch(() => {})
	}, [editor, props.element])
	return (
		<BlockElement element={props.element} attributes={props.attributes} withBoundaries>
			<div className="py-4">

				<table
					className=""
					// rowCount={props.element.children.length}
					// columnCount={(props.element.children[0] as TableRowElement | undefined)?.children.length ?? 0}
					// extendTable={extendTable}
					// shrinkTable={shrinkTable}
					// toggleRowHeaderScope={toggleRowHeaderScope}
					// toggleColumnHeaderScope={toggleColumnHeaderScope}
					// justifyColumn={justifyColumn}
					// //selectTable={selectTable}
					// deleteTable={deleteTable}
					// isSelected={isSelected}
					// isFocused={isFocused}
				>
					{props.children}
				</table>
			</div>
		</BlockElement>
	)
})
