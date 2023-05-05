export * from './Contexts'
export type { LayoutSlotProps } from './LayoutSlotPortal'
export type { LayoutSlotTargetProps } from './LayoutSlotTarget'
export * from './LayoutSlotsProvider'
export * from './createLayoutSlotComponent'
export * from './createLayoutSlotTargetComponent'
export * from './wrapSlotWithStack'

import { LayoutSlotPortal as Portal } from './LayoutSlotPortal'
import { LayoutSlotTarget as Target } from './LayoutSlotTarget'

export const LayoutSlot = {
	Portal,
	Target,
}
