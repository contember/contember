import { ComponentType } from 'react'
import { useCurrentRequest } from '../../routing'

export interface PageProps {
	name: string
	children: ComponentType<any>
}

/**
 * Page specifies one page. It must have a `name` prop and it's child must be a function which takes page's params and returns React node to render.
 */
export const Page = (props: PageProps) => {
	const request = useCurrentRequest()

	if (request === null) {
		return null
	}

	return <props.children {...request.parameters} />
}

Page.displayName = 'Page'
Page.getPageName = (props: PageProps): string => props.name
