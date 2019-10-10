import { lcfirst } from 'cms-common'
import * as React from 'react'
import { SingleEntityDataProvider } from '../../binding/coreComponents'
import { SingleEntityPageProps } from './SingleEntityPageProps'

interface EditPageProps extends SingleEntityPageProps {}

export class EditPage extends React.Component<EditPageProps> {
	static getPageName(props: EditPageProps) {
		return props.pageName || `edit_${lcfirst(props.entityName)}`
	}

	render(): React.ReactNode {
		return (
			<SingleEntityDataProvider where={this.props.where} entityName={this.props.entityName}>
				{this.props.children}
			</SingleEntityDataProvider>
		)
	}
}
