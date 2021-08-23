import { isSpecialLinkClick } from '@contember/ui'
import {
	AnchorHTMLAttributes,
	ComponentType,
	FunctionComponent, memo,
	MouseEvent as ReactMouseEvent,
	ReactNode, useCallback,
} from 'react'
import type { RequestChange } from '../../state/request'
import { useDispatch, useSelector } from 'react-redux'
import { pushRequest } from '../../actions'
import State from '../../state'
import { requestStateToPath } from '../../routing'

const defaultComponent: FunctionComponent <InnerLinkProps> = props => (
	// TODO do something with isActive?
	<a {...props}/>
)

export const Link = memo<LinkProps & PublicAnchorProps>(({ onClick, requestChange, ...props }) => {
	const dispatch = useDispatch()
	const goTo = useCallback(() => {
		dispatch(pushRequest(requestChange))
	}, [dispatch, requestChange])
	const innerOnClick = useCallback((e: ReactMouseEvent<HTMLAnchorElement, MouseEvent>) => {
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
	const href = useSelector<State, string>(({ basePath, projectConfig, request }) =>
			requestStateToPath(basePath, projectConfig, requestChange(request)),
	)

	const { Component = defaultComponent, ...innerProps } = props
	return <Component isActive={location.pathname === href} href={href} {...innerProps} onClick={innerOnClick}/>
})
Link.displayName = 'Link'

export type PublicAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

export interface InnerLinkProps extends PublicAnchorProps {
	href: string
	isActive: boolean
}

export interface LinkProps {
	requestChange: RequestChange
	Component?: ComponentType<InnerLinkProps>
	children?: ReactNode
}
