import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@contember/react-ui-lib-base'
import { PersonDetail, PersonsList, type PersonsListController } from '@contember/react-ui-lib-tenant'
import { useRef, useState } from 'react'
import { PanelSection } from '../../shell/screens.js'
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
		<>
			<PanelSlots.Title>Persons</PanelSlots.Title>
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
				<DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Person</DialogTitle>
					</DialogHeader>
					{selectedPersonId !== undefined && <PersonDetail personId={selectedPersonId} />}
				</DialogContent>
			</Dialog>
		</>
	)
}
