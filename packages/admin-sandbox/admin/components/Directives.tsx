import { createDirectiveContext } from '@contember/layout'
import { Intent } from '@contember/ui'
import { memo } from 'react'
import { LayoutType } from './Layouts'

export type DirectivesType = {
	'layout': LayoutType;
	'layout.theme-content': Intent | null | undefined;
	'layout.theme-controls': Intent | null | undefined;
	'title': string | null | undefined,
}

const directivesDefaultValues: DirectivesType = Object.freeze({
	'layout': 'cms',
	'layout.theme-content': 'default',
	'layout.theme-controls': 'primary',
	'title': undefined,
})

export const directivesList = Object.keys(directivesDefaultValues) as (keyof DirectivesType)[]
export const [DirectivesProvider, Directive, DirectivesConsumer, useDirectives] = createDirectiveContext<DirectivesType>('Directives', directivesDefaultValues)

export const Title = memo<{ children: string | null | undefined }>(({ children }) => (
	<Directive name="title" content={children} />
))
