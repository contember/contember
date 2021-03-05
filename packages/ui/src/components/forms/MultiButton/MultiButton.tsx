import { Fragment, memo, MouseEvent as ReactMouseEvent, useMemo, useState } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import { Dropdown } from '../../Dropdown'
import { Button } from '../Button'
import { ButtonGroup, ButtonGroupProps } from '../ButtonGroup'
import { FormGroup } from '../FormGroup'
import { buttonAnalyzer, ButtonFormGroupProps } from './buttonAnalyzer'

export interface MultiButtonProps extends ButtonGroupProps {
	triggerFromDropdown?: boolean
}

export const MultiButton = memo(({ triggerFromDropdown = false, ...props }: MultiButtonProps) => {
	const [currentButtonIndex, setCurrentButtonIndex] = useState(0)

	const augmentedButtons = useMemo(() => buttonAnalyzer.processChildren(props.children, undefined), [props.children])
	const formGroupsPresent = useMemo(() => augmentedButtons.some(props => props instanceof ButtonFormGroupProps), [
		augmentedButtons,
	])
	const buttonFormGroupProps = useMemo(
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
	const prefix = useClassNamePrefix()
	if (buttonFormGroupProps.length === 0) {
		return null
	}
	const Wrapper = formGroupsPresent ? FormGroup : Fragment
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
						children: <span style={{ fontSize: '.7em' }}>▼</span>,
						className: `${prefix}button-group-last`,
					}}
				>
					{({ requestClose }) => (
						<ButtonGroup orientation="vertical">
							{buttonFormGroupProps.map((buttonFormGroupProps, i) => (
								<Button
									{...buttonFormGroupProps.buttonProps}
									key={i}
									onClick={(e: ReactMouseEvent<any>) => {
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
