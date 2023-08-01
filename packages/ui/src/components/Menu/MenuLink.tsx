import { useClassNameFactory } from '@contember/react-utils'
import { ComponentClassNameProps, dataAttribute, deprecate, fallback, isDefined } from '@contember/utilities'
import { ReactNode, SyntheticEvent, useCallback } from 'react'
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
		/** @deprecated Use `active` instead */
		isActive?: boolean;
		onClick?: (e: SyntheticEvent<HTMLElement>) => void;
		/** @deprecated Handle event.preventDefault() in `onClick` */
		suppressTo?: boolean;
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
	isActive,
	onClick: onClickProp,
	suppressTo,
	...rest
}: MenuLinkProps) {
	deprecate('1.3.0', isDefined(suppressTo), '`suppressTo` prop', '`event.preventDefault()` within `onClick` handler')
	deprecate('1.3.0', isDefined(isActive), '`isActive` prop', '`active` prop')

	active = fallback(active, isDefined(isActive), isActive)

	const onClick = useCallback((event: SyntheticEvent<HTMLAnchorElement>) => {
		console.log('MenuLink onClick', event)

		if (event.nativeEvent instanceof MouseEvent && !isSpecialLinkClick(event.nativeEvent) && event.nativeEvent.button === 0) {
			onClickProp?.(event)

			// TODO: Remove in 1.3.0
			if (suppressTo) {
				event.preventDefault()
			}
		}
	}, [onClickProp, suppressTo])

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
