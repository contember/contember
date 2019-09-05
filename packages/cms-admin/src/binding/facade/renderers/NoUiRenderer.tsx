import * as React from 'react'
import { AccessorContext } from '../../coreComponents'
import { EntityCollectionAccessor } from '../../dao'
import { PersistButton } from '../buttons'
import { RendererProps } from './CommonRendererProps'
import { FeedbackRenderer } from './FeedbackRenderer'
import { DefaultRenderer } from './DefaultRenderer'

export class NoUiRenderer extends React.PureComponent<RendererProps> {
	public render() {
		return (
			<FeedbackRenderer data={this.props.data}>
				{data => {
					const normalizedData = data.root instanceof EntityCollectionAccessor ? data.root.entities : [data.root]

					return (
						<>
							{normalizedData.map(
								value =>
									value && (
										<AccessorContext.Provider value={value} key={value.getKey()}>
											{DefaultRenderer.renderTitleBar(this.props)}
											{this.props.children}
										</AccessorContext.Provider>
									),
							)}
							<PersistButton />
						</>
					)
				}}
			</FeedbackRenderer>
		)
	}
}
