import * as React from 'react'
import { ReactNode } from 'react'
import { useEntityContext } from '../../../binding'
import { InnerProps } from '../../Link'
import PageLink, { PageConfig } from '../../pageRouting/PageLink'

interface PageLinkByIdProps {
	change: (id: string) => PageConfig
	Component?: React.ComponentType<InnerProps>
	children?: ReactNode
}

export const PageLinkById = React.memo(function(props: PageLinkByIdProps) {
	const data = useEntityContext()

	const id = data.primaryKey

	if (typeof id === 'string') {
		return (
			<PageLink to={() => props.change(id)} Component={props.Component}>
				{props.children}
			</PageLink>
		)
	}
	return null
})
