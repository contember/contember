import { Directives } from '@contember/layout'
import { Intent } from '@contember/ui'
import { LAYOUT_BREAKPOINT } from './Constants'
import { LayoutType } from './LayoutComponent'

export type DirectivesType = {
	// TODO:
	// 'brand-background-color': string | undefined;
	// 'brand-text-color': string | undefined;
	'content-max-width': number | false | null | undefined;
	'layout': LayoutType | undefined;
	'layout.theme-content': Intent | null | undefined;
	'layout.theme-controls': Intent | null | undefined;
	'safe-area-insets': number | undefined;
}

export const initialDirectives: DirectivesType = Object.freeze({
	// 'brand-background-color': undefined,
	// 'brand-text-color': undefined,
	'content-max-width': LAYOUT_BREAKPOINT,
	'layout': 'default',
	'layout.theme-content': 'default',
	'layout.theme-controls': 'accent',
	'safe-area-insets': 20,
})

// Local export with current DirectivesType specific to the project
export const Directive = Directives.Directive as unknown as Directives.DirectiveComponentType<DirectivesType>

// Local export with current DirectivesType specific to the project
export const useDirectives = Directives.useDirectives<DirectivesType>
