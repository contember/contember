import { useClassNameFactory } from '@contember/utilities'
import { memo, MouseEvent as ReactMouseEvent, ReactNode, useMemo } from 'react'
import { HTMLDivElementProps } from '../../types'
import { Box } from '../Box'
import { Dropdown, DropdownProps } from '../Dropdown'
import { Button, ButtonOwnProps } from '../Forms'
import { Icon, IconProps } from '../Icon'

export type ActionableBoxProps =
	& {
		editContents?: ReactNode
		onRemove?: (e: ReactMouseEvent<HTMLButtonElement>) => void
		children: ReactNode
	}
	& HTMLDivElementProps

const commonButtonProps: ButtonOwnProps = {
	size: 'small',
	flow: 'circular',
}
const commonIconProps: IconProps = {
	size: 'small',
}

/**
 * @group UI
 */
export const ActionableBox = memo<ActionableBoxProps>(({
	className,
	children,
	editContents,
	onRemove,
	...divProps
}) => {
	const buttonProps: DropdownProps['buttonProps'] = useMemo(() => ({
		...commonButtonProps,
		children: <Icon {...commonIconProps} contemberIcon="pencil" />,
	}), [])

	const componentClassName = useClassNameFactory('actionableBox')

	if (editContents === undefined && onRemove === undefined) {
		return <>{children}</>
	}

	return (
		<Box
			{...divProps}
			className={componentClassName(null, className)}
		>
			<div className={componentClassName('contents')}>{children}</div>
			<ul className={componentClassName('actions')} contentEditable={false}>
				{editContents && (
					<li className={componentClassName('action')}>
						<Dropdown buttonProps={buttonProps}>
							<>{editContents}</>
						</Dropdown>
					</li>
				)}
				{onRemove && (
					<li className={componentClassName('action')}>
						<Button intent="danger" {...commonButtonProps} onClick={onRemove}>
							<Icon {...commonIconProps} blueprintIcon="trash" />
						</Button>
					</li>
				)}
			</ul>
		</Box>
	)
})
ActionableBox.displayName = 'ActionableBox'
