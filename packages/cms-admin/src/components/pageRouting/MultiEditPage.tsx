import { lcfirst } from 'cms-common'
import * as React from 'react'
import { DataRendererProps, EntityListDataProvider } from '../../binding/coreComponents'
import { MultiEditRenderer, MultiEditRendererProps } from '../../binding/facade/renderers'
import { SpecificPageProps } from './SpecificPageProps'
import { Input } from '@contember/schema'
import { CrudQueryBuilder } from 'cms-client'

interface MultiEditPageProps<DRP extends MultiEditRendererProps> extends SpecificPageProps<DRP> {
	orderBy?: Input.OrderBy<CrudQueryBuilder.OrderDirection>[]
}

export class MultiEditPage<DRP extends MultiEditRendererProps = MultiEditRendererProps> extends React.Component<
	MultiEditPageProps<DRP>
> {
	static getPageName(props: MultiEditPageProps<MultiEditRendererProps>) {
		return props.pageName || `multiEdit_${lcfirst(props.entity)}`
	}

	render(): React.ReactNode {
		return (
			<EntityListDataProvider<DRP>
				entityName={this.props.entity}
				orderBy={this.props.orderBy}
				renderer={
					this.props.renderer ||
					// The as any cast is necessary because MultiEditRenderer is also a namespace… 🙄
					((MultiEditRenderer as any) as React.ComponentType<DRP & DataRendererProps>)
				}
				rendererProps={this.props.rendererProps}
			>
				{this.props.children}
			</EntityListDataProvider>
		)
	}
}
