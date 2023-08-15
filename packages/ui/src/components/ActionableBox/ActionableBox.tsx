import { useClassNameFactory } from '@contember/react-utils'
import { ComponentClassNameProps, flatClassNameList } from '@contember/utilities'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { MouseEvent as ReactMouseEvent, ReactNode, memo, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { HTMLDivElementProps } from '../../types'
import { Box, BoxOwnProps } from '../Box'
import { Dropdown, DropdownProps } from '../Dropdown/Dropdown'
import { Button, ButtonOwnProps } from '../Forms'

export interface ActionableBoxOwnProps extends ComponentClassNameProps {
	editContents?: ReactNode
	onRemove?: (e: ReactMouseEvent<HTMLButtonElement>) => void
	children: ReactNode
}

export interface ActionableBoxProps
	extends Omit<HTMLDivElementProps, keyof ActionableBoxOwnProps | keyof BoxOwnProps>,
	Omit<BoxOwnProps, keyof ActionableBoxOwnProps>,
	ActionableBoxOwnProps { }

/**
 * @group UI
 */
export const ActionableBox = memo<ActionableBoxProps>(({
	children,
	editContents,
	className: classNameProp,
	componentClassName = 'actionableBox',
	onRemove,
	...rest
}) => {
	const className = useClassNameFactory(componentClassName)
	const boxComponentClassName = useMemo(() => [...flatClassNameList(componentClassName), 'box'], [componentClassName])
	const boxRef = useRef<HTMLDivElement>(null)

	if (editContents === undefined && onRemove === undefined) {
		return <>{children}</>
	}

	return (
		<Box
			ref={boxRef}
			{...rest}
			className={className(null, classNameProp)}
			componentClassName={boxComponentClassName}
		>
			{children}
			{boxRef.current
				? createPortal((
					<ul className={className('actions')} contentEditable={false}>
						{editContents && (
							<li className={className('action')}>
								<Dropdown buttonProps={buttonProps}>
									<>{editContents}</>
								</Dropdown>
							</li>
						)}
						{onRemove && (
							<li className={className('action')}>
								<Button intent="danger" {...commonButtonProps} onClick={onRemove}>
									<Trash2Icon />
								</Button>
							</li>
						)}
					</ul>
				), boxRef.current)
				: null}
		</Box>
	)
})
ActionableBox.displayName = 'ActionableBox'

const commonButtonProps: ButtonOwnProps = {
	borderRadius: 'full',
	square: true,
	size: 'small',
}

const buttonProps: DropdownProps['buttonProps'] = {
	...commonButtonProps,
	children: <PencilIcon />,
}
