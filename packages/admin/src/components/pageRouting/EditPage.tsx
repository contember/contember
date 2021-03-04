import {
	DataBindingProvider,
	EntitySubTree,
	EntitySubTreeAdditionalProps,
	SugaredQualifiedSingleEntity,
} from '@contember/binding'
import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { FeedbackRenderer, MutableContentLayoutRendererProps, MutableSingleEntityRenderer } from '../bindingFacade'
import { PageProvider } from './PageProvider'

export interface EditPageProps extends SugaredQualifiedSingleEntity, EntitySubTreeAdditionalProps {
	pageName: string
	children: ReactNode
	rendererProps?: Omit<MutableContentLayoutRendererProps, 'accessor'>
}

const EditPage: Partial<PageProvider<EditPageProps>> & ComponentType<EditPageProps> = memo(
	({ pageName, children, rendererProps, ...entityProps }: EditPageProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntitySubTree {...entityProps} entityComponent={MutableSingleEntityRenderer} entityProps={rendererProps}>
				{children}
			</EntitySubTree>
		</DataBindingProvider>
	),
)

EditPage.displayName = 'EditPage'
EditPage.getPageName = (props: EditPageProps) => props.pageName

export { EditPage }
