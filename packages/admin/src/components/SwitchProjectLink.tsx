import { ComponentType } from 'react'
import { useSelector } from 'react-redux'
import type State from '../state'
import { InnerProps } from './Link'

interface SwitchProjectLinkProps {
	Component: ComponentType<InnerProps>
}

export const SwitchProjectLink = (props: SwitchProjectLinkProps) => {
	const hasMoreProjects = useSelector<State, boolean>(state => !!(state.auth.identity && state.auth.identity.projects.length > 1))

	if (!hasMoreProjects) {
		return null
	}

	// TODO: better routing to loginPage?
	return <props.Component href="/" isActive={false} />
}
