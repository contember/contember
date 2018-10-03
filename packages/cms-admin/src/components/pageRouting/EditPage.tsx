import * as React from 'react'
import { SingleEntityDataProvider, Entity } from '../../binding'
import { ParametersContext } from './Pages'

interface EditPageProps {
	entity: string
	layout: React.ComponentType<{ children: React.ReactNode }>
}

export default class EditPage extends React.Component<EditPageProps> {
	static getPageName(props: EditPageProps) {
		return `edit_${props.entity.toLowerCase()}`
	}

	render(): React.ReactNode {
		const Layout = this.props.layout
		return (
			<Layout>
				<ParametersContext.Consumer>
					{({ id }: { id: string }) => (
						<SingleEntityDataProvider where={{ id }} name={this.props.entity}>
							{this.props.children}
						</SingleEntityDataProvider>
					)}
				</ParametersContext.Consumer>
			</Layout>
		)
	}
}
