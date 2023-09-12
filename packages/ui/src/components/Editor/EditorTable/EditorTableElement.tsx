import { useClassNameFactory } from '@contember/react-utils'
import { dataAttribute, range } from '@contember/utilities'
import {
	AlignCenterIcon,
	AlignLeftIcon,
	AlignRightIcon,
	HeadingIcon,
	MoreHorizontalIcon,
	MoreVerticalIcon,
	Trash2Icon,
	TrashIcon,
} from 'lucide-react'
import { CSSProperties, Fragment, memo, MouseEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { toStateClass } from '../../../utils'
import { Divider } from '../../Divider'
import { Dropdown } from '../../Dropdown'
import { Button, ButtonGroup, ButtonProps } from '../../Forms'
import { AddColumnAfterIcon, AddColumnBeforeIcon, AddRowAboveIcon, AddRowBelowIcon } from '../../LucideIcons'

export interface EditorTableElementProps {
	rowCount: number
	columnCount: number
	extendTable: (vector: 'row' | 'column', index?: number) => void
	shrinkTable: (vector: 'row' | 'column', index: number) => void
	toggleRowHeaderScope: (index: number, scope: 'table') => void // Only a few ops supported for now
	toggleColumnHeaderScope: (index: number, scope: 'row') => void // Only a few ops supported for now
	justifyColumn: (index: number, direction: 'start' | 'center' | 'end' | undefined) => void
	deleteTable: () => void
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
	isSelected,
	isFocused,
	children,
}: EditorTableElementProps) {
	const componentClassName = useClassNameFactory('editorTable')
	const [hover, onMouseMoveCapture] = useHoverOnSlowMove()

	return (
		<div
			data-hover={dataAttribute(hover)}
			className={componentClassName(null, [toStateClass('focused', isFocused), toStateClass('selected', isSelected)])}
			style={
				{
					['--cui-editorTable-rowCount']: rowCount,
					['--cui-editorTable-columnCount']: columnCount,
				} as CSSProperties
			}
			onMouseMoveCapture={onMouseMoveCapture}
		>
			{range(0, columnCount).map(columnNumber => (
				<Fragment key={columnNumber}>
					<div
						contentEditable={false}
						className={componentClassName('columnLineControls')}
						style={{ ['--cui-editorTable-column']: columnNumber } as CSSProperties}
					>
						<div className={componentClassName('columnLineControls-before')} />
						<div className={componentClassName('columnLineControls-line')} onClick={() => extendTable('column', columnNumber)}>
							<div className={componentClassName('columnLineControls-line-inner')} />
						</div>
					</div>

					{columnNumber < columnCount && (
						<div
							className={componentClassName('columnControls')}
							contentEditable={false}
							style={{ ['--cui-editorTable-column']: columnNumber } as CSSProperties}
						>
							<Dropdown
								buttonProps={moreHorizontalButtonProps}
								styledContent={false}
							>
								<ButtonGroup display="block">
									{columnNumber === 0 && (
										<>
											<Button {...commonButtonProps} onClick={() => toggleColumnHeaderScope(columnNumber, 'row')}>
												<HeadingIcon scale={0.75} />
											</Button>
											<Divider gap={false} padding="gap" />
										</>
									)}
									<Button {...commonButtonProps} onClick={() => justifyColumn(columnNumber, 'start')}>
										<AlignLeftIcon scale={0.75} />
									</Button>
									<Button {...commonButtonProps} onClick={() => justifyColumn(columnNumber, 'center')}>
										<AlignCenterIcon scale={0.75} />
									</Button>
									<Button {...commonButtonProps} onClick={() => justifyColumn(columnNumber, 'end')}>
										<AlignRightIcon scale={0.75} />
									</Button>

									<Divider gap={false} padding="gap" />

									<Button {...commonButtonProps} onClick={() => extendTable('column', columnNumber)}>
										<AddColumnBeforeIcon />
									</Button>
									<Button {...commonButtonProps} onClick={() => extendTable('column', columnNumber + 1)}>
										<AddColumnAfterIcon />
									</Button>


									<Divider gap={false} padding="gap" />

									<Button {...commonButtonProps} intent="danger" onClick={() => shrinkTable('column', columnNumber)}>
										<TrashIcon scale={0.75} />
									</Button>
								</ButtonGroup>
							</Dropdown>
						</div>
					)}
				</Fragment>
			))}

			<div className={componentClassName('remove')} contentEditable={false}>
				{!isSelected && (
					<Button {...commonButtonProps} onClick={deleteTable} intent="danger">
						<Trash2Icon />
					</Button>
				)}
			</div>

			{range(0, rowCount).map(rowNumber => (
				<Fragment key={rowNumber}>
					<div
						className={componentClassName('rowLineControls')}
						contentEditable={false}
						style={{ ['--cui-editorTable-row']: rowNumber } as CSSProperties}
					>
						<div className={componentClassName('rowLineControls-line')} onClick={() => extendTable('row', rowNumber)}>
							<div className={componentClassName('rowLineControls-line-inner')} />
						</div>
						<div className={componentClassName('rowLineControls-after')} />
					</div>

					{rowNumber < rowCount && (
						<div
							className={componentClassName('rowControls')}
							contentEditable={false}
							style={{ ['--cui-editorTable-row']: rowNumber } as CSSProperties}
						>
							<div className={componentClassName('rowControls-after')}>
								<Dropdown
									buttonProps={moreVerticalButtonProps}
									styledContent={false}
									placement="left"
								>
									<ButtonGroup display="block">
										{rowNumber === 0 && (
											<>
												<Button {...commonButtonProps} onClick={() => toggleRowHeaderScope(rowNumber, 'table')}>
													<HeadingIcon scale={0.75} />
												</Button>
												<Divider gap={false} padding="gap" />
											</>
										)}
										<Button {...commonButtonProps} onClick={() => extendTable('row', rowNumber)}>
											<AddRowAboveIcon />
										</Button>
										<Button {...commonButtonProps} onClick={() => extendTable('row', rowNumber + 1)}>
											<AddRowBelowIcon />
										</Button>

										<Divider gap={false} padding="gap" />
										<Button
											{...commonButtonProps}
											intent="danger"
											onClick={() => shrinkTable('row', rowNumber)}
										>
											<TrashIcon scale={0.8} />
										</Button>
									</ButtonGroup>
								</Dropdown>
							</div>
						</div>
					)}
				</Fragment>
			))}
			{children}
		</div >
	)
})

function useHoverOnSlowMove(maxDistanceChange: number = 4) {
	const timeoutId = useRef<ReturnType<typeof setTimeout> | undefined>()
	const [hoverActive, setHoverActive] = useState(true)

	useEffect(() => () => {
		clearTimeout(timeoutId.current)
	}, [])

	const onMouseMoveCapture = useCallback((event: MouseEvent<HTMLDivElement>) => {
		const distance = Math.sqrt(event.movementX ** 2 + event.movementY ** 2)

		if (distance > maxDistanceChange) {
			clearTimeout(timeoutId.current)
			setHoverActive(false)
			timeoutId.current = setTimeout(() => setHoverActive(true), 300)
		}
	}, [maxDistanceChange])

	return [hoverActive, onMouseMoveCapture] as const
}

const commonButtonProps: ButtonProps = {
	borderRadius: 'full',
	padding: 'gap',
	square: true,
} as const

const moreVerticalButtonProps: ButtonProps = {
	...commonButtonProps,
	accent: false,
	children: <MoreVerticalIcon />,
	distinction: 'seamless',
	size: 'small',
} as const

const moreHorizontalButtonProps: ButtonProps = {
	...commonButtonProps,
	accent: false,
	children: <MoreHorizontalIcon />,
	distinction: 'seamless',
	size: 'small',
} as const
