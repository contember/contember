import { lcfirst } from 'cms-common'
import * as React from 'react'
import { DataRendererProps } from '../../binding/coreComponents/DataProvider'
import EntityListDataProvider from '../../binding/coreComponents/EntityListDataProvider'
import { MultiEditRenderer } from '../../binding/facade/renderers'
import CommonRendererProps from '../../binding/facade/renderers/CommonRendererProps'
import PageWithLayout from './PageWithLayout'
import SpecificPageProps from './SpecificPageProps'

interface MultiEditPageProps<DRP extends CommonRendererProps> extends SpecificPageProps<DRP> {}

export default class MultiEditPage<DRP extends CommonRendererProps = CommonRendererProps> extends React.Component<MultiEditPageProps<DRP>> {
	static getPageName(props: MultiEditPageProps<CommonRendererProps>) {
		return `multiEdit_${lcfirst(props.entity)}`
	}

	render(): React.ReactNode {
		return (
			<PageWithLayout layout={this.props.layout}>
				<EntityListDataProvider
					name={this.props.entity}
					renderer={this.props.renderer || (MultiEditRenderer as React.ComponentClass<DRP & DataRendererProps>)}
					rendererProps={this.props.rendererProps}
				>
					{this.props.children}
				</EntityListDataProvider>
			</PageWithLayout>
		)
	}
}
