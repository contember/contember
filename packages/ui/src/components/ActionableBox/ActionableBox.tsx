import { memo, MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { BoxContent } from '..'
import { useClassNamePrefix } from '../../auxiliary'
import { Dropdown } from '../Dropdown'
import { Button, ButtonOwnProps } from '../Forms'
import { Icon, IconProps } from '../Icon'

export interface ActionableBoxProps {
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

export const ActionableBox = memo(({ children, editContents, onRemove }: ActionableBoxProps) => {
	const prefix = useClassNamePrefix()

	if (editContents === undefined && onRemove === undefined) {
		return <>{children}</>
	}

	return (
		<BoxContent gap="large" className={`${prefix}actionableBox`}>
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
						<Button {...commonButtonProps} onClick={onRemove}>
							<Icon {...commonIconProps} blueprintIcon="trash" />
						</Button>
					</li>
				)}
			</ul>
		</BoxContent>
	)
})
ActionableBox.displayName = 'ActionableBox'
