import { ComponentType, FunctionComponent, memo, ReactNode } from 'react'
import { useLogout } from './Identity'

export interface LogoutLinkInnerProps {
	onClick: () => void
	children?: ReactNode
}

export interface LogoutLinkProps {
	Component?: ComponentType<LogoutLinkInnerProps>
	children?: ReactNode
}


const defaultComponent: FunctionComponent<LogoutLinkInnerProps> = ({ onClick, children }) => (
	<a href="#" onClick={onClick}>
		{children}
	</a>
)

/**
 * @group Tenant
 */
export const LogoutLink = memo<LogoutLinkProps>(props => {
	const onLogout = useLogout()
	const Component = props.Component || defaultComponent
	return <Component onClick={onLogout} children={props.children} />
})

LogoutLink.displayName = 'LogoutLink'
