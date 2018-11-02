import { H1 } from '@blueprintjs/core'
import * as React from 'react'
import DataContext from '../../coreComponents/DataContext'
import EntityCollectionAccessor from '../../dao/EntityCollectionAccessor'
import { PersistButton } from '../buttons'
import { RendererProps } from './CommonRendererProps'

export default class DefaultRenderer extends React.Component<RendererProps> {
	public render() {
		const data = this.props.data

		if (!data) {
			return null // TODO display a message
		}

		const normalizedData = data.root instanceof EntityCollectionAccessor ? data.root.entities : [data.root]

		return (
			<>
				{DefaultRenderer.renderTitle(this.props.title)}
				{normalizedData.map((value, i) => (
					<DataContext.Provider value={value} key={i}>
						{this.props.children}
					</DataContext.Provider>
				))}
				<PersistButton />
			</>
		)
	}

	public static renderTitle(title: RendererProps['title']): React.ReactNode {
		return title && <H1>{title}</H1>
	}
}
