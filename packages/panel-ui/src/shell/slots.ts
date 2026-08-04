import { createSlotComponents } from '@contember/react-slots'

/**
 * How a module contributes to the shell chrome without the shell knowing about it: a page renders
 * `<PanelSlots.Title>Persons</PanelSlots.Title>` and the layout header picks it up.
 */
export const [, PanelSlots, PanelSlotTargets] = createSlotComponents(['Title', 'Actions'])
