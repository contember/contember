import { Identity2023 } from '@contember/brand'
import { CommonSlotTargets, CommonSlots, commonSlotTargets, createLayoutSlotComponent, createLayoutSlotTargetComponent } from '@contember/layout'

export const slotTargets = Object.freeze({
	...commonSlotTargets,
	ContentFooter: 'cms-content-footer',
	ContentHeader: 'cms-content-header',
	HeaderCenter: 'cms-header-center',
	HeaderLeft: 'cms-header-left',
	HeaderRight: 'cms-header-right',
	SidebarLeftBody: 'cms-sidebar-left-body',
	SidebarLeftFooter: 'cms-sidebar-left-footer',
	SidebarLeftHeader: 'cms-sidebar-left-header',
	SidebarRightBody: 'cms-sidebar-right-body',
	SidebarRightFooter: 'cms-sidebar-right-footer',
	SidebarRightHeader: 'cms-sidebar-right-header',
})

export const slotTargetAliases = Object.freeze({
	ModalLogo: 'cms-modal-header-logo',
})

type SlotsMapType = Record<keyof typeof slotTargets, ReturnType<typeof createLayoutSlotComponent>>
type SlotTargetsMapType = Record<
	| keyof typeof slotTargets
	| keyof typeof slotTargetAliases,
	ReturnType<typeof createLayoutSlotTargetComponent>
>

export const Slots: SlotsMapType = {
	...CommonSlots,
	ContentFooter: createLayoutSlotComponent(slotTargets.ContentFooter, 'ContentFooter'),
	ContentHeader: createLayoutSlotComponent(slotTargets.ContentHeader, 'ContentHeader'),
	Logo: createLayoutSlotComponent([
		slotTargets.Logo,
		slotTargetAliases.ModalLogo,
	], 'Logo', (<a href="/">
		<Identity2023.Edit scale={1.5} className="cms-logo" />
	</a>
	)),
	HeaderCenter: createLayoutSlotComponent(slotTargets.HeaderCenter, 'HeaderCenter'),
	HeaderLeft: createLayoutSlotComponent(slotTargets.HeaderLeft, 'HeaderLeft'),
	HeaderRight: createLayoutSlotComponent(slotTargets.HeaderRight, 'HeaderRight'),
	SidebarLeftBody: createLayoutSlotComponent(slotTargets.SidebarLeftBody, 'SidebarLeftBody'),
	SidebarLeftFooter: createLayoutSlotComponent(slotTargets.SidebarLeftFooter, 'SidebarLeftFooter'),
	SidebarLeftHeader: createLayoutSlotComponent(slotTargets.SidebarLeftHeader, 'SidebarLeftHeader'),
	SidebarRightBody: createLayoutSlotComponent(slotTargets.SidebarRightBody, 'SidebarRightBody'),
	SidebarRightFooter: createLayoutSlotComponent(slotTargets.SidebarRightFooter, 'SidebarRightFooter'),
	SidebarRightHeader: createLayoutSlotComponent(slotTargets.SidebarRightHeader, 'SidebarRightHeader'),
}

export const SlotTargets: SlotTargetsMapType = {
	...CommonSlotTargets,
	HeaderLeft: createLayoutSlotTargetComponent(slotTargets.HeaderLeft, 'HeaderLeft'),
	HeaderCenter: createLayoutSlotTargetComponent(slotTargets.HeaderCenter, 'HeaderCenter'),
	HeaderRight: createLayoutSlotTargetComponent(slotTargets.HeaderRight, 'HeaderRight'),
	SidebarLeftHeader: createLayoutSlotTargetComponent(slotTargets.SidebarLeftHeader, 'SidebarLeftHeader'),
	ModalLogo: createLayoutSlotTargetComponent(slotTargetAliases.ModalLogo, 'ModalLogo'),
	SidebarLeftBody: createLayoutSlotTargetComponent(slotTargets.SidebarLeftBody, 'SidebarLeftBody'),
	SidebarLeftFooter: createLayoutSlotTargetComponent(slotTargets.SidebarLeftFooter, 'SidebarLeftFooter'),
	ContentHeader: createLayoutSlotTargetComponent(slotTargets.ContentHeader, 'ContentHeader'),
	ContentFooter: createLayoutSlotTargetComponent(slotTargets.ContentFooter, 'ContentFooter'),
	SidebarRightHeader: createLayoutSlotTargetComponent(slotTargets.SidebarRightHeader, 'SidebarRightHeader'),
	SidebarRightBody: createLayoutSlotTargetComponent(slotTargets.SidebarRightBody, 'SidebarRightBody'),
	SidebarRightFooter: createLayoutSlotTargetComponent(slotTargets.SidebarRightFooter, 'SidebarRightFooter'),
}
