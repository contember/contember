import { assert, fallback, isNonEmptyTrimmedString, isNonNegativeNumber, isNotNullish, numberOrFallback } from '@contember/utilities'
import { MaybePanelBehavior, MaybePanelVisibility, PanelBehavior, PanelConfig, PanelVisibility, isOneOfPanelBehaviors, isOneOfPanelVisibilities } from './Types'

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
		assert('name is present', name, isNonEmptyTrimmedString)

		const requestedBehavior = panel.behavior
		const defaultBehavior = panel.defaultBehavior
		if (requestedBehavior != null) {
			assert('behavior is present or nullish', requestedBehavior, isOneOfPanelBehaviors)
		}
		if (defaultBehavior != null) {
			assert('defaultBehavior is present or nullish', defaultBehavior, isOneOfPanelBehaviors)
		}
		requestedBehaviors.set(name, requestedBehavior)
		initialBehaviors.set(name, defaultBehavior)

		const behavior = requestedBehavior ?? defaultBehavior
		assert('behavior is not nullish', behavior, isNotNullish)

		const defaultVisibility = panel.defaultVisibility
		const requestedVisibility = panel.visibility ?? defaultVisibility
		if (requestedVisibility != null) {
			assert('visibility is present or nullish', requestedVisibility, isOneOfPanelVisibilities)
		}
		if (defaultVisibility != null) {
			assert('defaultVisibility is present or nullish', defaultVisibility, isOneOfPanelVisibilities)
		}

		requestedVisibilities.set(name, requestedVisibility)
		initialVisibilities.set(name, defaultVisibility)

		const visibility = requestedVisibility ?? defaultVisibility
		assert('visibility is not nullish', visibility, isNotNullish)

		resultingVisibilities.set(name, behavior === 'static' ? 'visible' : visibility)
		resultingBehaviors.set(name, behavior)

		const size = Math.max(numberOrFallback(panel.minWidth, 0), panel.basis)
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

				assert('behavior is defined', a_behavior, isNotNullish)
				assert('behavior is defined', b_behavior, isNotNullish)

				let difference = layoutSpaceRequirement[b_behavior] ?? -layoutSpaceRequirement[a_behavior]

				if (difference !== 0) {
					return difference
				} else {
					difference = numberOrFallback(b.priority, -1) - numberOrFallback(a.priority, -1)

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
