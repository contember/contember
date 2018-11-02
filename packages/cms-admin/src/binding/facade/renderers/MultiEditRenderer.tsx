import * as React from 'react'
import DataContext from '../../coreComponents/DataContext'
import EntityCollectionAccessor from '../../dao/EntityCollectionAccessor'
import EntityForRemovalAccessor from '../../dao/EntityForRemovalAccessor'
import { AddNewButton, PersistButton, UnlinkButton } from '../buttons'
import { RendererProps } from './CommonRendererProps'
import DefaultRenderer from './DefaultRenderer'

export default class MultiEditRenderer extends React.Component<RendererProps> {
	public render() {
		const data = this.props.data

		if (!data) {
			return null // TODO display a message
		}

		if (data.root instanceof EntityCollectionAccessor) {
			return (
				<>
					{DefaultRenderer.renderTitle(this.props.title)}
					{data.root.entities.map((value, i) => (
						<React.Fragment key={i}>
							{value && !(value instanceof EntityForRemovalAccessor) && (
								<DataContext.Provider value={value}>
									{this.props.children}
									{!!i && <UnlinkButton /> /* Can't delete the first one */}
								</DataContext.Provider>
							)}
						</React.Fragment>
					))}
					<AddNewButton addNew={data.root.addNew} />
					<PersistButton />
				</>
			)
		}
	}
}
