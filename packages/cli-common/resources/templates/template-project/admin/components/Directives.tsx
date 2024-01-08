import { Directives } from '@contember/layout'
import { Intent } from '@contember/ui'
import { LAYOUT_BREAKPOINT } from './Constants'

export type DirectivesType = {
	'content-max-width': number | false | null | undefined
	'layout.theme-content': Intent | null | undefined
	'layout.theme-controls': Intent | null | undefined
}

export const initialDirectives: DirectivesType = Object.freeze({
	'content-max-width': LAYOUT_BREAKPOINT,
	'layout.theme-content': 'default',
	'layout.theme-controls': 'positive',
})

export const Directive = Directives.Directive as unknown as Directives.DirectiveComponentType<DirectivesType> // <DirectivesType>
export const useDirectives = Directives.useDirectives<DirectivesType>
