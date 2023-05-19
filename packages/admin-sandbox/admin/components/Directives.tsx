import { CMSLayoutRootProps, PublicContentProps, PublicSidebarProps } from '@contember/cms-layout'
import { createDirectiveContext } from '@contember/layout'
import { Intent } from '@contember/ui'
import { memo } from 'react'
import { LAYOUT_BREAKPOINT } from './Constants'
import { LayoutType } from './Layouts'

type DirectivesType = {
	'cms-layout.breakpoint': CMSLayoutRootProps['breakpoint'];
	'cms-layout.content.basis': PublicContentProps['basis'];
	'cms-layout.content.maxWidth': PublicContentProps['maxWidth'];
	'cms-layout.content.minWidth': PublicContentProps['minWidth'];
	'cms-layout.sidebarLeft.keepVisible': PublicSidebarProps['keepVisible'];
	'cms-layout.sidebarLeft.width': PublicSidebarProps['width'];
	'cms-layout.sidebarRight.keepVisible': PublicSidebarProps['keepVisible'];
	'cms-layout.sidebarRight.width': PublicSidebarProps['width'];
	'layout': LayoutType;
	'layout.theme': Intent | null | undefined;
	'title': string | null | undefined,
}

const directivesDefaultValues: DirectivesType = Object.freeze({
	'cms-layout.breakpoint': LAYOUT_BREAKPOINT,
	'cms-layout.content.basis': undefined,
	'cms-layout.content.maxWidth': LAYOUT_BREAKPOINT,
	'cms-layout.content.minWidth': undefined,
	'cms-layout.sidebarLeft.keepVisible': undefined,
	'cms-layout.sidebarLeft.width': undefined,
	'cms-layout.sidebarRight.keepVisible': undefined,
	'cms-layout.sidebarRight.width': undefined,
	'layout': 'cms',
	'layout.theme': undefined,
	'title': undefined,
})

export const directivesList = Object.keys(directivesDefaultValues) as (keyof DirectivesType)[]
export const [DirectivesProvider, Directive, DirectivesConsumer, useDirectives] = createDirectiveContext<DirectivesType>('Directives', directivesDefaultValues)

export const Title = memo<{ children: string | null | undefined }>(({ children }) => (
	<Directive name="title" content={children} />
))
