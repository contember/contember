import { AnchorHTMLAttributes, ComponentType } from 'react'
import { useSelector } from 'react-redux'
import type State from '../state'

export type PublicAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

interface SwitchProjectLinkProps {
	Component: ComponentType<AnchorHTMLAttributes<HTMLAnchorElement>>
}

export const SwitchProjectLink = ({ Component, ...props }: SwitchProjectLinkProps & PublicAnchorProps) => {
	const hasMoreProjects = useSelector<State, boolean>(state => !!(state.auth.identity && state.auth.identity.projects.length > 1))

	if (!hasMoreProjects) {
		return null
	}

	return <Component href="/" {...props}/>
}
