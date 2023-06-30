import { createDirectiveContext } from '@contember/layout'
import { Intent } from '@contember/ui'
import { memo } from 'react'
import { LAYOUT_BREAKPOINT } from './Constants'
import { LayoutType } from './Layouts'

export type DirectivesType = {
	'brand-background-color': string | undefined;
	'brand-text-color': string | undefined;
	'content-basis': number | undefined;
	'content-max-width': number | false | null | undefined;
	'content-min-width': number | undefined;
	'layout': LayoutType | undefined;
	'layout.theme-content': Intent | null | undefined;
	'layout.theme-controls': Intent | null | undefined;
	'title': string | null | undefined,
}

export const initialDirectives: DirectivesType = Object.freeze({
	'brand-background-color': undefined,
	'brand-text-color': undefined,
	'content-basis': undefined,
	'content-max-width': LAYOUT_BREAKPOINT,
	'content-min-width': undefined,
	'layout': 'default',
	'layout.theme-content': 'default',
	'layout.theme-controls': 'primary',
	'title': undefined,
})

export const directivesList = Object.keys(initialDirectives) as (keyof DirectivesType)[]
export const [DirectivesProvider, Directive, DirectivesConsumer, useDirectives] = createDirectiveContext<DirectivesType>('Directives', initialDirectives)

export const Title = memo<{ children: string | null | undefined }>(({ children }) => (
	<Directive name="title" content={children} />
))
