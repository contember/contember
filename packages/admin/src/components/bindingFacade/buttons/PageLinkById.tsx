import { EntityAccessor, useEntity } from '@contember/binding'
import { ComponentType, memo, ReactNode } from 'react'
import type { InnerProps } from '../../Link'
import PageLink, { PageConfig } from '../../pageRouting/PageLink'

interface PageLinkByIdProps {
	change: (id: string, entity: EntityAccessor) => PageConfig
	Component?: ComponentType<InnerProps>
	children?: ReactNode
}

export const PageLinkById = memo(function (props: PageLinkByIdProps) {
	const parentEntity = useEntity()
	const id = parentEntity.id

	if (typeof id === 'string') {
		return (
			<PageLink to={() => props.change(id, parentEntity)} Component={props.Component}>
				{props.children}
			</PageLink>
		)
	}
	return null
})
