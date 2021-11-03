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
	const Component = props.Component || defaultComponent
	return <Component onClick={onLogout} children={props.children} />
})

LogoutLink.displayName = 'LogoutLink'
