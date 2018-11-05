import * as React from 'react'
import { DataContext, DataRendererProps } from '../../coreComponents'
import { EntityCollectionAccessor, EntityForRemovalAccessor } from '../../dao'
import { AddNewButton, PersistButton, UnlinkButton } from '../buttons'
import { CommonRendererProps } from './CommonRendererProps'
import { DefaultRenderer } from './DefaultRenderer'

export interface MultiEditRendererProps extends CommonRendererProps {
	displayAddNewButton?: boolean
	displayPersistButton?: boolean
	entrySeparator?: React.ReactNode
}

export class MultiEditRenderer extends React.Component<MultiEditRendererProps & DataRendererProps> {
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
							{value &&
								!(value instanceof EntityForRemovalAccessor) && (
									<DataContext.Provider value={value}>
										{(!!i && this.props.entrySeparator) || <hr />}
										{this.props.children}
										{!!i && <UnlinkButton /> /* Can't delete the first one */}
									</DataContext.Provider>
								)}
						</React.Fragment>
					))}
					{this.props.displayAddNewButton !== false && <AddNewButton addNew={data.root.addNew} />}
					{this.props.displayPersistButton !== false && <PersistButton />}
				</>
			)
		}
	}
}
