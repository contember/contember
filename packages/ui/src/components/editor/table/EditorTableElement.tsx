import * as React from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import cn from 'classnames'

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
			<div className={cn(`${prefix}editorTable-columnControls`)} contentEditable={false}>
				{Array.from({ length: columnCount + 1 }, (_, columnNumber) => (
					<React.Fragment key={columnNumber}>
						{columnNumber < columnCount && (
							<div
								className={cn(`${prefix}editorTable-columnControls-item`)}
								style={{ [`--${prefix}editorTable-column`]: columnNumber } as React.CSSProperties}
								key={columnNumber}
							>
								cc
							</div>
						)}
						<div
							className={cn(`${prefix}editorTable-columnControls-columnLine`)}
							style={{ [`--${prefix}editorTable-column`]: columnNumber } as React.CSSProperties}
						/>
					</React.Fragment>
				))}
			</div>
			<div className={cn(`${prefix}editorTable-rowControls`)} contentEditable={false}>
				{Array.from({ length: rowCount + 1 }, (_, rowNumber) => (
					<React.Fragment key={rowNumber}>
						{rowNumber < rowCount && (
							<div
								className={cn(`${prefix}editorTable-rowControls-item`)}
								style={{ [`--${prefix}editorTable-row`]: rowNumber } as React.CSSProperties}
							>
								rc
							</div>
						)}
						<div
							className={cn(`${prefix}editorTable-rowControls-rowLine`)}
							style={{ [`--${prefix}editorTable-row`]: rowNumber } as React.CSSProperties}
						/>
					</React.Fragment>
				))}
			</div>
			{children}
			{/*<div className={cn(`${prefix}editorTable-addColumn`)}>+</div>*/}
			{/*<div className={cn(`${prefix}editorTable-addRow`)}>+</div>*/}
		</div>
	)
})
