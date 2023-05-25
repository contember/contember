import { useClassNameFactory } from '@contember/utilities'
import { CSSProperties, Fragment, memo, ReactNode } from 'react'
import { toStateClass } from '../../../utils'
import { Dropdown } from '../../Dropdown/Dropdown'
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
	const componentClassName = useClassNameFactory('editorTable')

	return (
		<div
			className={componentClassName(null, [toStateClass('focused', isFocused), toStateClass('selected', isSelected)])}
			style={
				{
					['--cui-editorTable-rowCount']: rowCount,
					['--cui-editorTable-columnCount']: columnCount,
				} as CSSProperties
			}
		>
			<div className={componentClassName('handle')} contentEditable={false}>
				{/*<Button onClick={selectTable} flow="circular" size="small" distinction="seamless">*/}
				{/*	<Icon blueprintIcon="selection" />*/}
				{/*</Button>*/}
			</div>
			<div className={componentClassName('remove')} contentEditable={false}>
				<Button onClick={deleteTable} flow="circular" size="small" distinction="seamless">
					<Icon blueprintIcon="trash" />
				</Button>
			</div>
			<div className={componentClassName('columnControls')} contentEditable={false}>
				{Array.from({ length: columnCount + 1 }, (_, columnNumber) => {
					const columnStyle = { ['--cui-editorTable-column']: columnNumber } as CSSProperties
					return (
						<Fragment key={columnNumber}>
							{columnNumber < columnCount ? (
								<Dropdown
									buttonProps={{
										className: componentClassName('columnControls-more'),
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
								<span className={componentClassName('stub')} />
							)}
							{columnNumber < columnCount ? (
								<button
									type="button"
									onClick={() => shrinkTable('column', columnNumber)}
									className={componentClassName('columnControls-item', [
										columnNumber === 0 && componentClassName('columnControls-item-first'),
										columnNumber === columnCount - 1 && componentClassName('columnControls-item-last'),
									])}
									style={columnStyle}
								>
									<Icon blueprintIcon="trash" />
								</button>
							) : (
								<span className={componentClassName('stub')} />
							)}
							<Button
								onClick={() => extendTable('column', columnNumber)}
								className={componentClassName('columnControls-add')}
								flow="circular"
								size="small"
								distinction="seamless"
								style={columnStyle}
							>
								<Icon blueprintIcon="plus" />
							</Button>
							<div className={componentClassName('columnControls-line')} style={columnStyle} />
						</Fragment>
					)
				})}
			</div>
			<div className={componentClassName('rowControls')} contentEditable={false}>
				{Array.from({ length: rowCount + 1 }, (_, rowNumber) => {
					const rowStyle = { ['--cui-editorTable-row']: rowNumber } as CSSProperties
					return (
						<Fragment key={rowNumber}>
							{rowNumber < rowCount && rowNumber === 0 ? (
								<Dropdown
									buttonProps={{
										className: componentClassName('rowControls-more'),
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
								<span className={componentClassName('stub')} />
							)}
							{rowNumber < rowCount ? (
								<button
									type="button"
									onClick={() => shrinkTable('row', rowNumber)}
									className={componentClassName('rowControls-item', [
										rowNumber === 0 && componentClassName('rowControls-item-first'),
										rowNumber === rowCount - 1 && componentClassName('rowControls-item-last'),
									])}
									style={rowStyle}
								>
									<Icon blueprintIcon="trash" />
								</button>
							) : (
								<span className={componentClassName('stub')} />
							)}
							<Button
								onClick={() => extendTable('row', rowNumber)}
								className={componentClassName('rowControls-add')}
								flow="circular"
								size="small"
								distinction="seamless"
								style={rowStyle}
							>
								<Icon blueprintIcon="plus" />
							</Button>
							<div className={componentClassName('rowControls-line')} style={rowStyle} />
						</Fragment>
					)
				})}
			</div>
			<button
				type="button"
				className={componentClassName('appendColumn')}
				onClick={() => extendTable('column')}
				contentEditable={false}
			>
				<Icon blueprintIcon="plus" />
			</button>
			<button
				type="button"
				className={componentClassName('appendRow')}
				onClick={() => extendTable('row')}
				contentEditable={false}
			>
				<Icon blueprintIcon="plus" />
			</button>
			{children}
		</div>
	)
})
