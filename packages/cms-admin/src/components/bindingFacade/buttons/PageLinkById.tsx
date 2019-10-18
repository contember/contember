import * as React from 'react'
import { ReactNode } from 'react'
import { AccessorContext, EntityAccessor, useEntityContext } from '../../../binding'
import { InnerProps } from '../../Link'
import PageLink, { PageConfig } from '../../pageRouting/PageLink'

interface PageLinkByIdProps {
	change: (id: string) => PageConfig
	Component?: React.ComponentType<InnerProps>
	children?: ReactNode
}

export const PageLinkById = React.memo(function(props: PageLinkByIdProps) {
	const data = React.useContext(AccessorContext)

	if (!(data instanceof EntityAccessor)) {
		return null
	}

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
