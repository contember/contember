import { createDirectiveContext } from '@contember/cms-layout'
import { Layout } from './Layout'

type DirectivesType = {
	title: string | null | undefined,
	layout: typeof Layout.types[number];
	'layouts.cms.contentProps.maxWidth': false | number | null | undefined;
}

export const [MetaDirectivesProvider, MetaDirective, MetaDirectivesConsumer, useMetaDirectives] = createDirectiveContext<DirectivesType>('MetaDirectives', {
	'layout': 'cms',
	'title': undefined,
	'layouts.cms.contentProps.maxWidth': undefined,
})
