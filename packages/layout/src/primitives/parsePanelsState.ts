import { assert, isNonNegativeNumber } from '@contember/utilities'
import { MaybePanelBehavior, MaybePanelVisibility, PanelBehavior, PanelConfig, PanelVisibility } from './Types'

export function parsePanelsState(currentlyActivePanel: string | undefined, panels: Map<string, PanelConfig>) {
	const requestedVisibilities: Map<string, MaybePanelVisibility> = new Map
	const initialVisibilities: Map<string, MaybePanelVisibility> = new Map
	const requestedBehaviors: Map<string, MaybePanelBehavior> = new Map
	const initialBehaviors: Map<string, MaybePanelBehavior> = new Map
	const resultingVisibilities: Map<string, PanelVisibility> = new Map
	const resultingBehaviors: Map<string, PanelBehavior> = new Map

	let sumStatic = 0
	let sumCollapsible = 0
	const staticPanels: PanelConfig[] = []
	const collapsiblePanels: PanelConfig[] = []
	const otherPanels: PanelConfig[] = []

	panels.forEach(panel => {
		const name = panel.name

		const requestedBehavior = panel.behavior
		const defaultBehavior = panel.defaultBehavior
		requestedBehaviors.set(name, requestedBehavior)
		initialBehaviors.set(name, defaultBehavior)

		const behavior = requestedBehavior ?? defaultBehavior
		if (!behavior) {
			throw new Error(`Panel ${name} has no behavior`)
		}

		const defaultVisibility = panel.defaultVisibility
		const requestedVisibility = panel.visibility ?? defaultVisibility

		requestedVisibilities.set(name, requestedVisibility)
		initialVisibilities.set(name, defaultVisibility)

		const visibility = requestedVisibility ?? defaultVisibility
		if (!visibility) {
			throw new Error(`Panel ${name} has no visibility`)
		}

		resultingVisibilities.set(name, behavior === 'static' ? 'visible' : visibility)
		resultingBehaviors.set(name, behavior)

		const size = Math.max(panel.minWidth || 0, panel.basis)
		assert('panel size is is non negative number', size, isNonNegativeNumber)

		switch (behavior) {
			case 'static':
				sumStatic += size
				staticPanels.push(panel)
				break
			case 'collapsible':
				sumCollapsible += size
				collapsiblePanels.push(panel)
				break
			case 'overlay':
			case 'modal':
				otherPanels.push(panel)
				break
			default: throw new Error(`Exhaustive error: Unexpected ${behavior} behavior`)
		}
	})

	collapsiblePanels.sort(
		(a, b) => {
			if (a.name === currentlyActivePanel) {
				return Number.NEGATIVE_INFINITY
			} else if (b.name === currentlyActivePanel) {
				return Number.POSITIVE_INFINITY
			} else {
				const a_behavior: PanelBehavior | null | undefined = a.behavior ?? a.defaultBehavior
				const b_behavior: PanelBehavior | null | undefined = b.behavior ?? b.defaultBehavior

				if (!a_behavior) {
					throw new Error(`Panel ${a.name} has no behavior`)
				}
				if (!b_behavior) {
					throw new Error(`Panel ${b.name} has no behavior`)
				}

				let difference = layoutSpaceRequirement[b_behavior] ?? -layoutSpaceRequirement[a_behavior]

				if (difference !== 0) {
					return difference
				} else {
					difference = (b.priority || -1) - (a.priority || -1)

					return difference
				}
			}
		},
	)

	return {
		sumStatic,
		sumCollapsible,
		maps: {
			requestedVisibilities,
			initialVisibilities,
			requestedBehaviors,
			initialBehaviors,
			resultingVisibilities,
			resultingBehaviors,
		},
		groups: {
			staticPanels,
			collapsiblePanels,
			otherPanels,
		},
	}
}

const layoutSpaceRequirement: Record<PanelBehavior, number> = {
	static: 2,
	collapsible: 1,
	overlay: 0,
	modal: 0,
}
