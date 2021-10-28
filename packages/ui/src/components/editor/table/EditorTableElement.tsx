import cn from 'classnames'
import { CSSProperties, Fragment, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import { toStateClass } from '../../../utils'
import { Dropdown } from '../../Dropdown'
import { Button, ButtonGroup } from '../../Forms'
import { Icon } from '../../Icon'

export interface EditorTableElementProps {
	rowCount: number
	columnCount: number
	extendTable: (vector: 'row' | 'column', index?: number) => void
	shrinkTable: (vector: 'row' | 'column', index: number) => void
	toggleRowHeaderScope: (index: number, scope: 'table') => void // Only a few ops supported for now
	toggleColumnHeaderScope: (index: number, scope: 'row') => void // Only a few ops supported for now
	justifyColumn: (index: number, direction: 'start' | 'center' | 'end' | undefined) => void
	deleteTable: () => void
	//selectTable: () => void
	isSelected: boolean
	isFocused: boolean
	children: ReactNode
}

export const EditorTableElement = memo(function EditorTableElement({
	rowCount,
	columnCount,
	extendTable,
	shrinkTable,
	toggleRowHeaderScope,
	toggleColumnHeaderScope,
	justifyColumn,
	deleteTable,
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
				} as CSSProperties
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
					const columnStyle = { [`--${prefix}editorTable-column`]: columnNumber } as CSSProperties
					return (
						<Fragment key={columnNumber}>
							{columnNumber < columnCount ? (
								<Dropdown
									buttonProps={{
										className: cn(`${prefix}editorTable-columnControls-more`),
										flow: 'circular',
										size: 'small',
										distinction: 'seamless',
										style: columnStyle,
										children: <Icon blueprintIcon="more" />,
									}}
									styledContent={false}
								>
									<ButtonGroup>
										{columnNumber === 0 && (
											<Button flow="circular" size="small" onClick={() => toggleColumnHeaderScope(columnNumber, 'row')}>
												<Icon blueprintIcon="header" size="small" />
											</Button>
										)}
										<Button flow="circular" size="small" onClick={() => justifyColumn(columnNumber, 'start')}>
											<Icon blueprintIcon="align-left" size="small" />
										</Button>
										<Button flow="circular" size="small" onClick={() => justifyColumn(columnNumber, 'center')}>
											<Icon blueprintIcon="align-center" size="small" />
										</Button>
										<Button flow="circular" size="small" onClick={() => justifyColumn(columnNumber, 'end')}>
											<Icon blueprintIcon="align-right" size="small" />
										</Button>
									</ButtonGroup>
								</Dropdown>
							) : (
								<span className={cn(`${prefix}editorTable-stub`)} />
							)}
							{columnNumber < columnCount ? (
								<button
									type="button"
									onClick={() => shrinkTable('column', columnNumber)}
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
								onClick={() => extendTable('column', columnNumber)}
								className={cn(`${prefix}editorTable-columnControls-add`)}
								flow="circular"
								size="small"
								distinction="seamless"
								style={columnStyle}
							>
								<Icon blueprintIcon="plus" />
							</Button>
							<div className={cn(`${prefix}editorTable-columnControls-line`)} style={columnStyle} />
						</Fragment>
					)
				})}
			</div>
			<div className={cn(`${prefix}editorTable-rowControls`)} contentEditable={false}>
				{Array.from({ length: rowCount + 1 }, (_, rowNumber) => {
					const rowStyle = { [`--${prefix}editorTable-row`]: rowNumber } as CSSProperties
					return (
						<Fragment key={rowNumber}>
							{rowNumber < rowCount && rowNumber === 0 ? (
								<Dropdown
									buttonProps={{
										className: cn(`${prefix}editorTable-rowControls-more`),
										flow: 'circular',
										size: 'small',
										distinction: 'seamless',
										style: rowStyle,
										children: <Icon blueprintIcon="more" />,
									}}
									styledContent={false}
									alignment="right"
								>
									<Button flow="circular" size="small" onClick={() => toggleRowHeaderScope(rowNumber, 'table')}>
										<Icon blueprintIcon="header" size="small" />
									</Button>
								</Dropdown>
							) : (
								<span className={cn(`${prefix}editorTable-stub`)} />
							)}
							{rowNumber < rowCount ? (
								<button
									type="button"
									onClick={() => shrinkTable('row', rowNumber)}
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
								onClick={() => extendTable('row', rowNumber)}
								className={cn(`${prefix}editorTable-rowControls-add`)}
								flow="circular"
								size="small"
								distinction="seamless"
								style={rowStyle}
							>
								<Icon blueprintIcon="plus" />
							</Button>
							<div className={cn(`${prefix}editorTable-rowControls-line`)} style={rowStyle} />
						</Fragment>
					)
				})}
			</div>
			<button
				type="button"
				className={cn(`${prefix}editorTable-appendColumn`)}
				onClick={() => extendTable('column')}
				contentEditable={false}
			>
				<Icon blueprintIcon="plus" />
			</button>
			<button
				type="button"
				className={cn(`${prefix}editorTable-appendRow`)}
				onClick={() => extendTable('row')}
				contentEditable={false}
			>
				<Icon blueprintIcon="plus" />
			</button>
			{children}
		</div>
	)
})
