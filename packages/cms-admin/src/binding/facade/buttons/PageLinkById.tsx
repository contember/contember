import * as React from 'react'
import { InnerProps } from '../../../components/Link'
import PageLink, { AnyParams, PageConfig } from '../../../components/pageRouting/PageLink'
import { DataContext, DataContextValue } from '../../coreComponents'
import { DataBindingError, EntityAccessor, EntityForRemovalAccessor } from '../../dao'

interface PageLinkByIdProps<P extends AnyParams> {
	change: (id: string) => PageConfig<P, keyof P>
	Component?: React.ComponentType<InnerProps>
}

export class PageLinkById<P extends AnyParams> extends React.PureComponent<PageLinkByIdProps<P>> {
	public render() {
		return (
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityAccessor) {
						const id = data.primaryKey

						if (typeof id === 'string') {
							return (
								<PageLink change={() => this.props.change(id)} Component={this.props.Component}>
									{this.props.children}
								</PageLink>
							)
						}
					} else if (data instanceof EntityForRemovalAccessor) {
						// Do nothing
					} else {
						throw new DataBindingError('Corrupted data')
					}
				}}
			</DataContext.Consumer>
		)
	}
}
