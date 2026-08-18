import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@contember/react-ui-lib-base'
import { PersonDetail, PersonsList, type PersonsListController } from '@contember/react-ui-lib-tenant'
import { useRef, useState } from 'react'
import { PageHeader, PageStack, PanelSection } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'

/**
 * The tenant-wide person list, with the administrator's view of one person behind a dialog.
 *
 * No permission handling of its own: `persons` answers an empty list to a caller who may not read
 * it, and every row action is a tenant mutation that reports its own failure.
 */
export const PersonsPage = () => {
	const listController = useRef<PersonsListController>(undefined)
	const [selectedPersonId, setSelectedPersonId] = useState<string>()

	return (
		<PageStack>
			<PanelSlots.Title>Persons</PanelSlots.Title>
			<PageHeader
				title="Persons"
				description="Everyone with an account in this tenant. A super admin sees all of them; anyone else sees the members of the projects they administer."
			/>
			<PanelSection>
				<PersonsList controller={listController} onSelectPerson={setSelectedPersonId} />
			</PanelSection>
			<Dialog
				open={selectedPersonId !== undefined}
				onOpenChange={open => {
					if (!open) {
						setSelectedPersonId(undefined)
						// The detail writes to the person, so the row it was opened from is stale by now.
						listController.current?.refresh()
					}
				}}
			>
				<DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Person</DialogTitle>
						<DialogDescription>Profile, password, two-factor state, global roles and sessions.</DialogDescription>
					</DialogHeader>
					{selectedPersonId !== undefined && <PersonDetail personId={selectedPersonId} />}
				</DialogContent>
			</Dialog>
		</PageStack>
	)
}
