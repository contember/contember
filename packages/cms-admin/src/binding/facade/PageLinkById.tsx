import * as React from 'react'
import { InnerProps } from '../../components/Link'
import PageLink, { AnyParams, PageConfig } from '../../components/pageRouting/PageLink'
import DataContext, { DataContextValue } from '../coreComponents/DataContext'
import DataBindingError from '../dao/DataBindingError'
import EntityAccessor from '../dao/EntityAccessor'

interface PageLinkByIdProps<P extends AnyParams> {
	change: (id: string) => PageConfig<P, keyof P>
	Component?: React.ComponentType<InnerProps>
}

export default class PageLinkById<P extends AnyParams> extends React.Component<PageLinkByIdProps<P>> {
	public render() {
		return (
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityAccessor) {
						const id = data.primaryKey

						if (id) {
							return (
								<PageLink change={() => this.props.change(id)} Component={this.props.Component}>
									{this.props.children}
								</PageLink>
							)
						}
					}
					throw new DataBindingError('Corrupted data')
				}}
			</DataContext.Consumer>
		)
	}
}
