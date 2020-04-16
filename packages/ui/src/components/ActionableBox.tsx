import * as React from 'react'
import { useClassNamePrefix } from '../auxiliary'
import { Dropdown } from './Dropdown'
import { Button, ButtonProps } from './forms'
import { Icon } from './Icon'

export interface ActionableBoxProps {
	editContents?: React.ReactNode
	onRemove?: () => void
	children: React.ReactNode
}

const commonButtonProps: ButtonProps = {
	size: 'small',
	flow: 'circular',
}

export const ActionableBox = React.memo(({ children, editContents, onRemove }: ActionableBoxProps) => {
	const prefix = useClassNamePrefix()

	if (!editContents && !onRemove) {
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
								children: <Icon contemberIcon="pencil" />,
							}}
						>
							<>{editContents}</>
						</Dropdown>
					</li>
				)}
				{onRemove && (
					<li className={`${prefix}actionableBox-action`}>
						<Button {...commonButtonProps} onClick={onRemove}>
							<Icon blueprintIcon="trash" />
						</Button>
					</li>
				)}
			</ul>
		</div>
	)
})
ActionableBox.displayName = 'ActionableBox'
