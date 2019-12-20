import cn from 'classnames'
import * as React from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { ButtonDistinction, ButtonFlow, Intent, Justification, Size } from '../../types'
import { toStateClass, toEnumViewClass, toViewClass } from '../../utils'
import { Spinner } from '../Spinner'

type PropBlackList = 'ref' | 'size'

interface ButtonBasedProps extends Omit<JSX.IntrinsicElements['button'], PropBlackList> {
	Component?: 'button' | undefined
}

interface AnchorBasedProps extends Omit<JSX.IntrinsicElements['a'], PropBlackList> {
	Component: 'a'
}

export interface ButtonOwnProps {
	intent?: Intent
	size?: Size
	flow?: ButtonFlow
	distinction?: ButtonDistinction
	justification?: Justification
	isLoading?: boolean
	isActive?: boolean
	disabled?: boolean
	bland?: boolean
	children?: React.ReactNode
}

export type ButtonBasedButtonProps = ButtonOwnProps & ButtonBasedProps
export type AnchorBasedButtonProps = ButtonOwnProps & AnchorBasedProps

export type ButtonProps = ButtonOwnProps & (ButtonBasedProps | AnchorBasedProps)

export const Button = React.memo(
	React.forwardRef<any, ButtonProps>((props, ref) => {
		const {
			Component,
			intent,
			size,
			flow,
			distinction,
			justification,
			isLoading,
			isActive,
			bland,
			children,
			...rest
		} = props

		if (props.disabled === true) {
			rest['aria-disabled'] = true
		}

		if (props.Component === 'button' || !props.Component) {
			;(rest as React.ButtonHTMLAttributes<HTMLButtonElement>).type = props.type !== undefined ? props.type : 'button'
		}
		const prefix = useClassNamePrefix()

		const attrs = {
			className: cn(
				rest.className,
				`${prefix}button`,
				toEnumViewClass(intent),
				toEnumViewClass(size),
				toEnumViewClass(distinction),
				toEnumViewClass(flow),
				toEnumViewClass(justification, 'justifyCenter'),
				toStateClass('loading', isLoading),
				toStateClass('active', isActive),
				toViewClass('bland', bland),
			),
			ref: ref,
		}
		const content = (
			<>
				<div className={`${prefix}button-content`}>{children}</div>
				{isLoading && (
					<span className={`${prefix}button-spinner`}>
						<Spinner />
					</span>
				)}
			</>
		)

		return React.createElement(Component || 'button', { ...rest, ...attrs }, content)
	}),
)
Button.displayName = 'Button'
