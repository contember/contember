import { createDirectiveContext } from '@contember/layout'
import { Intent } from '@contember/ui'
import { memo } from 'react'
import { Layout } from './Layout'

type DirectivesType = {
	title: string | null | undefined,
	layout: typeof Layout.types[number];
	'layout.theme': Intent | null | undefined;
	'layouts.cms.contentProps.maxWidth': false | number | null | undefined;
}

export const [DirectivesProvider, Directive, DirectivesConsumer, useDirectives] = createDirectiveContext<DirectivesType>('MetaDirectives', {
	'layout': 'cms',
	'layout.theme': undefined,
	'title': undefined,
	'layouts.cms.contentProps.maxWidth': undefined,
})

export const Title = memo<{ children: string | null | undefined }>(({ children }) => (
	<Directive name="title" content={children} />
))
