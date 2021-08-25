import { ComponentType, FunctionComponent, memo, useCallback } from 'react'
import { useLogout } from './Identity'

interface InnerProps {
	onClick: () => void
}

export interface LogoutLinkProps {
	Component?: ComponentType<InnerProps>
}


const defaultComponent: FunctionComponent<InnerProps> = ({ onClick, children }) => (
	<a href="#" onClick={onClick}>
		{children}
	</a>
)

export const LogoutLink = memo<LogoutLinkProps>(props => {
	const onLogout = useLogout()
	const onClick = useCallback(async () => {
		if (navigator.credentials && navigator.credentials.preventSilentAccess) {
			await navigator.credentials.preventSilentAccess()
		}
		onLogout()
	}, [onLogout])
	const Component = props.Component || defaultComponent
	return <Component onClick={onClick} children={props.children} />
})

LogoutLink.displayName = 'LogoutLink'
