import { dataAttribute } from '@contember/utilities'
import { GetLayoutPanelsStateContextType } from './Contexts'

export function panelsStateAsDataAttributes(panels: GetLayoutPanelsStateContextType['panels']) {
	return Object.fromEntries([...panels.entries()].map(
		([name, panel]) => [
			[`data-panel-${name}`, dataAttribute(true)],
			[`data-panel-${name}-basis`, dataAttribute(panel.basis)],
			[`data-panel-${name}-behavior`, dataAttribute(panel.behavior)],
			[`data-panel-${name}-max-width`, dataAttribute(panel.maxWidth)],
			[`data-panel-${name}-min-width`, dataAttribute(panel.minWidth)],
			[`data-panel-${name}-visibility`, dataAttribute(panel.visibility)],
			[`data-panel-${name}-behavior`, dataAttribute(panel.behavior)],
		],
	).flat(1))
}
