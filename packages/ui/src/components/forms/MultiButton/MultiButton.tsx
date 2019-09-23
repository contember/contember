import * as React from 'react'
import { Dropdown } from '../../Dropdown'
import { Button } from '../Button'
import { ButtonGroup, ButtonGroupProps } from '../ButtonGroup'
import { FormGroup } from '../FormGroup'
import { buttonAnalyzer, ButtonFormGroupProps } from './buttonAnalyzer'

export interface MultiButtonProps extends ButtonGroupProps {
	triggerFromDropdown?: boolean
}

export const MultiButton = React.memo(({ triggerFromDropdown = false, ...props }: MultiButtonProps) => {
	const [currentButtonIndex, setCurrentButtonIndex] = React.useState(0)

	const augmentedButtons = React.useMemo(() => buttonAnalyzer.processChildren(props.children, undefined), [
		props.children,
	])
	const formGroupsPresent = React.useMemo(() => augmentedButtons.some(props => props instanceof ButtonFormGroupProps), [
		augmentedButtons,
	])
	const buttonFormGroupProps = React.useMemo(
		() =>
			augmentedButtons.map(item => {
				if (item instanceof ButtonFormGroupProps) {
					return new ButtonFormGroupProps(
						{
							...item.formGroupProps,
							useLabelElement: false,
						},
						item.buttonProps,
					)
				}
				return new ButtonFormGroupProps(
					{
						label: undefined,
						children: undefined,
						useLabelElement: false,
					},
					item.props,
				)
			}),
		[augmentedButtons],
	)
	if (buttonFormGroupProps.length === 0) {
		return null
	}
	const Wrapper = formGroupsPresent ? FormGroup : React.Fragment
	const activeButtonFormGroupProps = buttonFormGroupProps[currentButtonIndex]
	const activeWrapperProps = formGroupsPresent ? activeButtonFormGroupProps.formGroupProps : {}
	return (
		<Wrapper {...(activeWrapperProps as any)}>
			<ButtonGroup {...props}>
				<Button {...activeButtonFormGroupProps.buttonProps} />
				<Dropdown
					buttonProps={{
						intent: activeButtonFormGroupProps.buttonProps.intent,
						size: activeButtonFormGroupProps.buttonProps.size,
						distinction: activeButtonFormGroupProps.buttonProps.distinction,
						flow: activeButtonFormGroupProps.buttonProps.flow,
						isLoading: activeButtonFormGroupProps.buttonProps.isLoading,
						bland: activeButtonFormGroupProps.buttonProps.bland,
						children: '↓',
						className: 'button-group-last',
					}}
				>
					{({ requestClose }) => (
						<ButtonGroup orientation="vertical">
							{buttonFormGroupProps.map((buttonFormGroupProps, i) => (
								<Button
									{...buttonFormGroupProps.buttonProps}
									key={i}
									onClick={(e: React.MouseEvent<any>) => {
										triggerFromDropdown &&
											buttonFormGroupProps.buttonProps.onClick &&
											buttonFormGroupProps.buttonProps.onClick(e)
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
		</Wrapper>
	)
})
MultiButton.displayName = 'MultiButton'
