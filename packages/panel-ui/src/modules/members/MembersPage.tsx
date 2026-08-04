import { useProjectSlug } from '@contember/react-client'
import { InviteForm } from '@contember/react-client-tenant'
import { ToastContent, useShowToast } from '@contember/react-ui-lib-base'
import { InviteFormFields, type MemberListController, PersonList } from '@contember/react-ui-lib-tenant'
import { useRef } from 'react'
import { formClassName, PageStack, PanelSection } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'

/**
 * `PersonList` brings the per-row edit and delete affordances with it, so membership management is
 * the list plus the invite form. The list is empty rather than failing for a caller who may not
 * read the project's members.
 */
const Members = ({ projectSlug }: { projectSlug: string }) => {
	const showToast = useShowToast()
	const listController = useRef<MemberListController>(undefined)

	return (
		<PageStack>
			<PanelSection title="Members">
				<PersonList controller={listController} />
			</PanelSection>

			<PanelSection title="Invite a member">
				<InviteForm
					projectSlug={projectSlug}
					allowUnmanaged
					onSuccess={({ result }) => {
						showToast(<ToastContent>Member created: {result.person?.email}</ToastContent>, { type: 'success' })
						listController.current?.refresh()
					}}
				>
					<form className={formClassName}>
						{/* allowUnmanaged offers the "no invitation e-mail" path, for seeding and air-gapped setups */}
						<InviteFormFields projectSlug={projectSlug} allowUnmanaged />
					</form>
				</InviteForm>
			</PanelSection>
		</PageStack>
	)
}

export const MembersPage = () => {
	const projectSlug = useProjectSlug()

	return (
		<>
			<PanelSlots.Title>Members</PanelSlots.Title>
			{/* The router mounts project pages inside `ProjectScopeProvider` only, so the slug is always set. */}
			{projectSlug !== undefined && <Members projectSlug={projectSlug} />}
		</>
	)
}
