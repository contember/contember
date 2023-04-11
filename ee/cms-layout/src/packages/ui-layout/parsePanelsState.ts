import { assert, isNonEmptyTrimmedString, isNonNegativeNumber, isNotNullish } from '../assert-types'
import { LayoutPanelBehavior, LayoutPanelConfig, LayoutPanelVisibility, MaybeLayoutPanelBehavior, MaybeLayoutPanelVisibility, isOneOfLayoutPanelBehaviors, isOneOfLayoutPanelVisibilities } from './Types'

export function parsePanelsState(currentlyActivePanel: string | undefined, panels: Map<string, LayoutPanelConfig>) {
	const requestedVisibilities: Map<string, MaybeLayoutPanelVisibility> = new Map
	const initialVisibilities: Map<string, MaybeLayoutPanelVisibility> = new Map
	const requestedBehaviors: Map<string, MaybeLayoutPanelBehavior> = new Map
	const initialBehaviors: Map<string, MaybeLayoutPanelBehavior> = new Map
	const resultingVisibilities: Map<string, LayoutPanelVisibility> = new Map
	const resultingBehaviors: Map<string, LayoutPanelBehavior> = new Map

	let sumStatic = 0
	let sumCollapsible = 0
	const staticPanels: LayoutPanelConfig[] = []
	const collapsiblePanels: LayoutPanelConfig[] = []
	const otherPanels: LayoutPanelConfig[] = []

	panels.forEach(panel => {
		const name = panel.name
		assert('name is present', name, isNonEmptyTrimmedString)

		const requestedBehavior = panel.behavior
		const defaultBehavior = panel.defaultBehavior
		if (requestedBehavior != null) {
			assert('behavior is present or nullish', requestedBehavior, isOneOfLayoutPanelBehaviors)
		}
		if (defaultBehavior != null) {
			assert('defaultBehavior is present or nullish', defaultBehavior, isOneOfLayoutPanelBehaviors)
		}
		requestedBehaviors.set(name, requestedBehavior)
		initialBehaviors.set(name, defaultBehavior)

		const behavior = requestedBehavior ?? defaultBehavior
		assert('behavior is not nullish', behavior, isNotNullish)

		const defaultVisibility = panel.defaultVisibility
		const requestedVisibility = panel.visibility ?? defaultVisibility
		if (requestedVisibility != null) {
			assert('visibility is present or nullish', requestedVisibility, isOneOfLayoutPanelVisibilities)
		}
		if (defaultVisibility != null) {
			assert('defaultVisibility is present or nullish', defaultVisibility, isOneOfLayoutPanelVisibilities)
		}

		requestedVisibilities.set(name, requestedVisibility)
		initialVisibilities.set(name, defaultVisibility)

		const visibility = requestedVisibility ?? defaultVisibility
		assert('visibility is not nullish', visibility, isNotNullish)

		resultingVisibilities.set(name, behavior === 'static' ? 'visible' : visibility)
		resultingBehaviors.set(name, behavior)

		const size = Math.max(panel.minWidth, panel.basis)
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
				const a_behavior: LayoutPanelBehavior | null | undefined = a.behavior ?? a.defaultBehavior
				const b_behavior: LayoutPanelBehavior | null | undefined = b.behavior ?? b.defaultBehavior

				assert('behavior is defined', a_behavior, isNotNullish)
				assert('behavior is defined', b_behavior, isNotNullish)

				let difference = layoutSpaceRequirement[b_behavior] ?? -layoutSpaceRequirement[a_behavior]

				if (difference !== 0) {
					return difference
				} else {
					difference = (b.priority ?? -1) - (a.priority ?? -1)

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

const layoutSpaceRequirement: Record<LayoutPanelBehavior, number> = {
	static: 2,
	collapsible: 1,
	overlay: 0,
	modal: 0,
}
