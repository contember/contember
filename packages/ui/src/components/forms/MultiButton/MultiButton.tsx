import * as React from 'react'
import { Dropdown } from '../../Dropdown'
import { Button, ButtonProps } from '../Button'
import { ButtonGroup, ButtonGroupProps } from '../ButtonGroup'
import { BoxedButtonProps, buttonAnalyzer } from './buttonAnalyzer'

export interface MultiButtonProps extends ButtonGroupProps {
	triggerFromDropdown?: boolean
}

export const MultiButton = React.memo(({ triggerFromDropdown = false, ...props }: MultiButtonProps) => {
	const [currentButtonIndex, setCurrentButtonIndex] = React.useState(0)

	const augmentedButtons = React.useMemo(() => buttonAnalyzer.processChildren(props.children, undefined), [
		props.children,
	])
	const buttonProps = React.useMemo(
		() =>
			augmentedButtons.map(item => {
				if (item instanceof BoxedButtonProps) {
					return item.props
				}
				return item.buttonProps
			}),
		[augmentedButtons],
	)
	if (buttonProps.length === 0) {
		return null
	}
	const activeButtonProps = buttonProps[currentButtonIndex]
	return (
		<ButtonGroup {...props}>
			<Button {...activeButtonProps} />
			<Dropdown
				buttonProps={{
					intent: activeButtonProps.intent,
					size: activeButtonProps.size,
					distinction: activeButtonProps.distinction,
					flow: activeButtonProps.flow,
					isLoading: activeButtonProps.isLoading,
					bland: activeButtonProps.bland,
					children: '↓',
					className: 'button-group-last',
				}}
			>
				{({ requestClose }) => (
					<ButtonGroup orientation="vertical">
						{buttonProps.map((buttonProps, i) => (
							<Button
								{...buttonProps}
								key={i}
								onClick={(e: React.MouseEvent<any>) => {
									triggerFromDropdown && buttonProps.onClick && buttonProps.onClick(e)
									setCurrentButtonIndex(i)
									requestClose()
								}}
								flow="block"
								distinction="seamless"
							/>
						))}
					</ButtonGroup>
				)}
			</Dropdown>
		</ButtonGroup>
	)
})
MultiButton.displayName = 'MultiButton'
