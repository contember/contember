import { AnchorHTMLAttributes, ComponentType } from 'react'
import { useIdentity } from './Identity'

export type PublicAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

interface SwitchProjectLinkProps {
	Component: ComponentType<AnchorHTMLAttributes<HTMLAnchorElement>>
}

export const SwitchProjectLink = ({ Component, ...props }: SwitchProjectLinkProps & PublicAnchorProps) => {
	const hasMoreProjects = useIdentity().projects.length > 1

	if (!hasMoreProjects) {
		return null
	}

	return <Component href="/" {...props} />
}
