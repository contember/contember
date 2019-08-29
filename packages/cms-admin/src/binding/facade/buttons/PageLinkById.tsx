import * as React from 'react'
import { ReactNode } from 'react'
import { InnerProps } from '../../../components/Link'
import PageLink, { PageConfig } from '../../../components/pageRouting/PageLink'
import { DataContext } from '../../coreComponents'
import { DataBindingError, EntityAccessor, EntityForRemovalAccessor } from '../../dao'

interface PageLinkByIdProps {
	change: (id: string) => PageConfig
	Component?: React.ComponentType<InnerProps>
	children?: ReactNode
}

export const PageLinkById = React.memo(function(props: PageLinkByIdProps) {
	const data = React.useContext(DataContext)

	if (data instanceof EntityAccessor) {
		const id = data.primaryKey

		if (typeof id === 'string') {
			return (
				<PageLink to={() => props.change(id)} Component={props.Component}>
					{props.children}
				</PageLink>
			)
		}
		return null
	} else if (data instanceof EntityForRemovalAccessor) {
		return null // Do nothing
	}
	throw new DataBindingError('Corrupted data')
})
