import classNames from 'classnames'
import { HTMLAttributes, memo, MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { useClassNamePrefix } from '../auxiliary'
import { BoxContent } from './Box'
import { Dropdown } from './Dropdown'
import { Button, ButtonOwnProps } from './Forms'
import { Icon, IconProps } from './Icon'

export interface ActionableBoxProps extends HTMLAttributes<HTMLDivElement> {
	editContents?: ReactNode
	onRemove?: (e: ReactMouseEvent<HTMLButtonElement>) => void
	children: ReactNode
}

const commonButtonProps: ButtonOwnProps = {
	size: 'small',
	flow: 'circular',
}
const commonIconProps: IconProps = {
	size: 'small',
}

export const ActionableBox = memo(({ className, children, editContents, onRemove }: ActionableBoxProps) => {
	const prefix = useClassNamePrefix()

	if (editContents === undefined && onRemove === undefined) {
		return <>{children}</>
	}

	return (
		<BoxContent className={classNames(
			`${prefix}actionableBox`,
			className,
		)}>
			<div className={`${prefix}actionableBox-contents`}>{children}</div>
			<ul className={`${prefix}actionableBox-actions`} contentEditable={false}>
				{editContents && (
					<li className={`${prefix}actionableBox-action`}>
						<Dropdown
							buttonProps={{
								...commonButtonProps,
								children: <Icon {...commonIconProps} contemberIcon="pencil" />,
							}}
						>
							<>{editContents}</>
						</Dropdown>
					</li>
				)}
				{onRemove && (
					<li className={`${prefix}actionableBox-action`}>
						<Button intent="danger" {...commonButtonProps} onClick={onRemove}>
							<Icon {...commonIconProps} blueprintIcon="trash" />
						</Button>
					</li>
				)}
			</ul>
		</BoxContent>
	)
})
ActionableBox.displayName = 'ActionableBox'
