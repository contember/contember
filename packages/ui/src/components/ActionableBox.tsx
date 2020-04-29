import * as React from 'react'
import { useClassNamePrefix } from '../auxiliary'
import { Dropdown } from './Dropdown'
import { Button, ButtonProps } from './forms'
import { Icon, IconProps } from './Icon'

export interface ActionableBoxProps {
	editContents?: React.ReactNode
	onRemove?: (e: React.MouseEvent<HTMLButtonElement>) => void
	children: React.ReactNode
}

const commonButtonProps: ButtonProps = {
	size: 'small',
	flow: 'circular',
}
const commonIconProps: IconProps = {
	size: 'small',
}

export const ActionableBox = React.memo(({ children, editContents, onRemove }: ActionableBoxProps) => {
	const prefix = useClassNamePrefix()

	if (editContents === undefined && onRemove === undefined) {
		return <>{children}</>
	}

	return (
		<div className={`${prefix}actionableBox`}>
			<div className={`${prefix}actionableBox-contents`}>{children}</div>
			<ul className={`${prefix}actionableBox-actions`}>
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
						<Button {...commonButtonProps} onClick={onRemove}>
							<Icon {...commonIconProps} blueprintIcon="trash" />
						</Button>
					</li>
				)}
			</ul>
		</div>
	)
})
ActionableBox.displayName = 'ActionableBox'
