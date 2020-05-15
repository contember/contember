import { useParentEntityAccessor } from '@contember/binding'
import * as React from 'react'
import { ReactNode } from 'react'
import { InnerProps } from '../../Link'
import PageLink, { PageConfig } from '../../pageRouting/PageLink'

interface PageLinkByIdProps {
	change: (id: string) => PageConfig
	Component?: React.ComponentType<InnerProps>
	children?: ReactNode
}

export const PageLinkById = React.memo(function(props: PageLinkByIdProps) {
	const parentEntity = useParentEntityAccessor()
	const id = parentEntity.primaryKey

	if (typeof id === 'string') {
		return (
			<PageLink to={() => props.change(id)} Component={props.Component}>
				{props.children}
			</PageLink>
		)
	}
	return null
})
