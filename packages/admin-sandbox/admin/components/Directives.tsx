import { CommonSlotSources, Directives } from '@contember/layout'
import { useDocumentTitle } from '@contember/react-utils'
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
	'safe-area-insets': number | undefined;
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
	'safe-area-insets': 20,
	'title': undefined,
})

export const Directive = Directives.Directive as unknown as Directives.DirectiveComponentType<DirectivesType> // <DirectivesType>
export const useDirectives = Directives.useDirectives<DirectivesType>

export const Title = memo<{ children: string | null | undefined }>(({ children }) => {
	useDocumentTitle(children)

	return (
		<CommonSlotSources.Title>{children}</CommonSlotSources.Title>
	)
})

// export const Title = CommonSlotSources.Title
