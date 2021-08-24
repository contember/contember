import { isSpecialLinkClick } from '@contember/ui'
import {
	AnchorHTMLAttributes,
	ComponentType,
	FunctionComponent,
	memo,
	MouseEvent as ReactMouseEvent,
	ReactNode,
	useCallback,
} from 'react'
import { LinkTarget, useLink } from './useLink'


const defaultComponent: FunctionComponent<InnerLinkProps> = ({ isActive, ...props }) => (
	// TODO do something with isActive?
	<a {...props}/>
)

export const Link = memo<LinkProps & PublicAnchorProps>(({ onClick, to, Component, ...props }) => {
	const { navigate, isActive, href } = useLink(to)

	const innerOnClick = useCallback((e?: ReactMouseEvent<HTMLAnchorElement, MouseEvent>) => {
		if (e) {
			if (onClick) {
				onClick(e)
			}
			if (e.isDefaultPrevented() || isSpecialLinkClick(e.nativeEvent)) {
				return
			}
		}
		navigate(e)
	}, [navigate, onClick])

	const InnerComponent = Component ?? defaultComponent
	return <InnerComponent isActive={isActive} href={href} {...props} onClick={innerOnClick}/>
})
Link.displayName = 'Link'

export type PublicAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

export interface InnerLinkProps extends Omit<PublicAnchorProps, 'onClick'> {
	href: string
	isActive: boolean
	onClick: (e?: ReactMouseEvent<HTMLAnchorElement>) => void
}


export interface LinkProps {
	Component?: ComponentType<InnerLinkProps>
	children?: ReactNode
	to: LinkTarget
}
