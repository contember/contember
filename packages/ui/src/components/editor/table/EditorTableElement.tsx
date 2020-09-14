import * as React from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import cn from 'classnames'
import { Icon } from '../../Icon'
import { Button } from '../../forms'

export interface EditorTableElementProps {
	rowCount: number
	columnCount: number
	addRow?: (index?: number) => void
	addColumn?: (index?: number) => void
	deleteRow?: (index: number) => void
	deleteColumn?: (index: number) => void
	showControls?: boolean
	children: React.ReactNode
}

export const EditorTableElement = React.memo(function EditorTableElement({
	rowCount,
	columnCount,
	addRow,
	addColumn,
	deleteRow,
	deleteColumn,
	showControls,
	children,
}: EditorTableElementProps) {
	const prefix = useClassNamePrefix()
	return (
		<div
			className={cn(`${prefix}editorTable`)}
			style={
				{
					[`--${prefix}editorTable-rowCount`]: rowCount,
					[`--${prefix}editorTable-columnCount`]: columnCount,
				} as React.CSSProperties
			}
		>
			<div className={cn(`${prefix}editorTable-handle`)} contentEditable={false} />
			<div className={cn(`${prefix}editorTable-columnControls`)} contentEditable={false}>
				{Array.from({ length: columnCount + 1 }, (_, columnNumber) => (
					<div
						className={cn(`${prefix}editorTable-columnControls-in`)}
						style={{ [`--${prefix}editorTable-column`]: columnNumber } as React.CSSProperties}
						key={columnNumber}
					>
						{columnNumber < columnCount && (
							// TODO select column
							<div className={cn(`${prefix}editorTable-columnControls-item`)} key={columnNumber} />
						)}
						<Button
							onClick={() => 0}
							className={cn(`${prefix}editorTable-columnControls-add`)}
							flow="circular"
							size="small"
							distinction="seamless"
						>
							<Icon blueprintIcon="plus" />
						</Button>
						<div className={cn(`${prefix}editorTable-columnControls-line`)} />
					</div>
				))}
			</div>
			<div className={cn(`${prefix}editorTable-rowControls`)} contentEditable={false}>
				{Array.from({ length: rowCount + 1 }, (_, rowNumber) => (
					<div
						className={cn(`${prefix}editorTable-rowControls-in`)}
						style={{ [`--${prefix}editorTable-row`]: rowNumber } as React.CSSProperties}
						key={rowNumber}
					>
						{rowNumber < rowCount && (
							// TODO select row
							<div className={cn(`${prefix}editorTable-rowControls-item`)} />
						)}
						<Button
							onClick={() => 0}
							className={cn(`${prefix}editorTable-rowControls-add`)}
							flow="circular"
							size="small"
							distinction="seamless"
						>
							<Icon blueprintIcon="plus" />
						</Button>
						<div className={cn(`${prefix}editorTable-rowControls-line`)} />
					</div>
				))}
			</div>
			<button type="button" className={cn(`${prefix}editorTable-appendColumn`)} contentEditable={false}>
				<Icon blueprintIcon="plus" />
			</button>
			<button type="button" className={cn(`${prefix}editorTable-appendRow`)} contentEditable={false}>
				<Icon blueprintIcon="plus" />
			</button>
			{children}
		</div>
	)
})
