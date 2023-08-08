import { useClassNameFactory } from '@contember/react-utils'
import { ComponentClassNameProps, dataAttribute } from '@contember/utilities'
import { MouseEventHandler, ReactNode, SyntheticEvent, useCallback } from 'react'
import { HTMLAnchorElementProps } from '../../types'
import { isSpecialLinkClick } from '../../utils'
import { Label } from '../Typography'

export type MenuLinkProps =
	& HTMLAnchorElementProps
	& ComponentClassNameProps
	& {
		active?: boolean;
		children?: ReactNode;
		disabled?: boolean;
		external?: boolean | undefined;
		href?: string;
		icon?: ReactNode;
		onClick?: (e: SyntheticEvent<HTMLElement>) => void;
	}

export function MenuLink({
	active,
	className: classNameProp,
	componentClassName = 'menu-link',
	disabled,
	children,
	external,
	href,
	icon,
	onClick: onClickProp,
	...rest
}: MenuLinkProps) {
	const onClick: MouseEventHandler<HTMLAnchorElement> = useCallback(event => {
		console.log('MenuLink onClick', event)

		if (event.nativeEvent instanceof MouseEvent && !isSpecialLinkClick(event.nativeEvent) && event.nativeEvent.button === 0) {
			onClickProp?.(event)
		}
	}, [onClickProp])

	const className = useClassNameFactory(componentClassName)

	return (
		<a
			tabIndex={-1}
			data-active={dataAttribute(active)}
			data-disabled={dataAttribute(disabled)}
			className={className(null, classNameProp)}
			onClick={onClick}
			{...(href ? {
				href,
				target: external ? '_blank' : undefined,
				rel: external ? 'noopener noreferrer' : undefined,
			} : {
			})}
			{...rest}
		>
			<Label>
				{icon}
				{children}
			</Label>
		</a>
	)
}
