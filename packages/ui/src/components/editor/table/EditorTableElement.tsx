import * as React from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import cn from 'classnames'
import { toStateClass } from '../../../utils'
import { Icon } from '../../Icon'
import { Button } from '../../forms'

export interface EditorTableElementProps {
	rowCount: number
	columnCount: number
	addRow: (index?: number) => void
	addColumn: (index?: number) => void
	deleteTable: () => void
	deleteRow: (index: number) => void
	deleteColumn: (index: number) => void
	//selectTable: () => void
	isSelected: boolean
	isFocused: boolean
	children: React.ReactNode
}

export const EditorTableElement = React.memo(function EditorTableElement({
	rowCount,
	columnCount,
	addRow,
	addColumn,
	deleteTable,
	deleteRow,
	deleteColumn,
	//selectTable,
	isSelected,
	isFocused,
	children,
}: EditorTableElementProps) {
	const prefix = useClassNamePrefix()
	return (
		<div
			className={cn(`${prefix}editorTable`, toStateClass('focused', isFocused), toStateClass('selected', isSelected))}
			style={
				{
					[`--${prefix}editorTable-rowCount`]: rowCount,
					[`--${prefix}editorTable-columnCount`]: columnCount,
				} as React.CSSProperties
			}
		>
			<div className={cn(`${prefix}editorTable-handle`)} contentEditable={false}>
				{/*<Button onClick={selectTable} flow="circular" size="small" distinction="seamless">*/}
				{/*	<Icon blueprintIcon="selection" />*/}
				{/*</Button>*/}
			</div>
			<div className={cn(`${prefix}editorTable-remove`)} contentEditable={false}>
				<Button onClick={deleteTable} flow="circular" size="small" distinction="seamless">
					<Icon blueprintIcon="trash" />
				</Button>
			</div>
			<div className={cn(`${prefix}editorTable-columnControls`)} contentEditable={false}>
				{Array.from({ length: columnCount + 1 }, (_, columnNumber) => {
					const columnStyle = { [`--${prefix}editorTable-column`]: columnNumber } as React.CSSProperties
					return (
						<React.Fragment key={columnNumber}>
							{columnNumber < columnCount ? (
								<button
									type="button"
									onClick={() => deleteColumn(columnNumber)}
									className={cn(
										`${prefix}editorTable-columnControls-item`,
										columnNumber === 0 && `${prefix}editorTable-columnControls-item-first`,
										columnNumber === columnCount - 1 && `${prefix}editorTable-columnControls-item-last`,
									)}
									style={columnStyle}
								>
									<Icon blueprintIcon="trash" />
								</button>
							) : (
								<span className={cn(`${prefix}editorTable-stub`)} />
							)}
							<Button
								onClick={() => addColumn(columnNumber)}
								className={cn(`${prefix}editorTable-columnControls-add`)}
								flow="circular"
								size="small"
								distinction="seamless"
								style={columnStyle}
							>
								<Icon blueprintIcon="plus" />
							</Button>
							<div className={cn(`${prefix}editorTable-columnControls-line`)} style={columnStyle} />
						</React.Fragment>
					)
				})}
			</div>
			<div className={cn(`${prefix}editorTable-rowControls`)} contentEditable={false}>
				{Array.from({ length: rowCount + 1 }, (_, rowNumber) => {
					const rowStyle = { [`--${prefix}editorTable-row`]: rowNumber } as React.CSSProperties
					return (
						<React.Fragment key={rowNumber}>
							{rowNumber < rowCount ? (
								<button
									type="button"
									onClick={() => deleteRow(rowNumber)}
									className={cn(
										`${prefix}editorTable-rowControls-item`,
										rowNumber === 0 && `${prefix}editorTable-rowControls-item-first`,
										rowNumber === rowCount - 1 && `${prefix}editorTable-rowControls-item-last`,
									)}
									style={rowStyle}
								>
									<Icon blueprintIcon="trash" />
								</button>
							) : (
								<span className={cn(`${prefix}editorTable-stub`)} />
							)}
							<Button
								onClick={() => addRow(rowNumber)}
								className={cn(`${prefix}editorTable-rowControls-add`)}
								flow="circular"
								size="small"
								distinction="seamless"
								style={rowStyle}
							>
								<Icon blueprintIcon="plus" />
							</Button>
							<div className={cn(`${prefix}editorTable-rowControls-line`)} style={rowStyle} />
						</React.Fragment>
					)
				})}
			</div>
			<button
				type="button"
				className={cn(`${prefix}editorTable-appendColumn`)}
				onClick={() => addColumn()}
				contentEditable={false}
			>
				<Icon blueprintIcon="plus" />
			</button>
			<button
				type="button"
				className={cn(`${prefix}editorTable-appendRow`)}
				onClick={() => addRow()}
				contentEditable={false}
			>
				<Icon blueprintIcon="plus" />
			</button>
			{children}
		</div>
	)
})
