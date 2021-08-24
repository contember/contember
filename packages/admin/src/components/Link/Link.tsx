import { isSpecialLinkClick } from '@contember/ui'
import {
	AnchorHTMLAttributes,
	ComponentType,
	FunctionComponent,
	memo,
	MouseEvent as ReactMouseEvent,
	ReactNode,
	useCallback,
	useMemo,
} from 'react'
import type { RequestChange } from '../../state/request'
import { useDispatch, useSelector } from 'react-redux'
import { pushRequest } from '../../actions'
import State from '../../state'
import { requestStateToPath, useRouting } from '../../routing'

const defaultComponent: FunctionComponent <InnerLinkProps> = props => (
	// TODO do something with isActive?
	<a {...props}/>
)

export const Link = memo<LinkProps & PublicAnchorProps>(({ onClick, requestChange, ...props }) => {
	const dispatch = useDispatch()
	const routing = useRouting()
	const goTo = useCallback(() => {
		dispatch(pushRequest(routing, requestChange))
	}, [dispatch, requestChange, routing])
	const innerOnClick = useCallback((e?: ReactMouseEvent<HTMLAnchorElement, MouseEvent>) => {
		if (e) {
			if (onClick) {
				onClick(e)
			}
			if (e.isDefaultPrevented() || isSpecialLinkClick(e.nativeEvent)) {
				return
			}
			e.preventDefault()
		}
		goTo()
	}, [goTo, onClick])
	const request = useSelector<State, State['request']>(({ request }) => request)
	const href = useMemo(() => requestStateToPath(routing, requestChange(request)), [request, requestChange, routing])

	const { Component = defaultComponent, ...innerProps } = props
	return <Component isActive={location.pathname === href} href={href} {...innerProps} onClick={innerOnClick}/>
})
Link.displayName = 'Link'

export type PublicAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

export interface InnerLinkProps extends Omit<PublicAnchorProps, 'onClick'> {
	href: string
	isActive: boolean
	onClick: (e?: ReactMouseEvent<HTMLAnchorElement>) => void
}

export interface LinkProps {
	requestChange: RequestChange
	Component?: ComponentType<InnerLinkProps>
	children?: ReactNode
}
