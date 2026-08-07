import { useProjectSlug } from '@contember/react-client'
import { AddProjectMemberForm, InviteForm } from '@contember/react-client-tenant'
import { ToastContent, useShowToast } from '@contember/react-ui-lib-base'
import { AddProjectMemberFormFields, InviteFormFields, type MemberListController, PersonList } from '@contember/react-ui-lib-tenant'
import { UserPlusIcon } from 'lucide-react'
import { useRef } from 'react'
import { FormDialog } from '../../shell/FormDialog.js'
import { useProjectPermissions } from '../../shell/permissions.js'
import { formClassName, NoAccessState, PageHeader, PageStack, PanelSection } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'

/**
 * `PersonList` brings the per-row edit and delete affordances with it, so the page is that list
 * plus the two ways of getting into it. The list is empty rather than failing for a caller who may
 * not read the project's members.
 */
const Members = ({ projectSlug }: { projectSlug: string }) => {
	const showToast = useShowToast()
	const listController = useRef<MemberListController>(undefined)
	const permissions = useProjectPermissions()

	const invite = (
		<FormDialog label="Invite" title="Invite a member" description="Creates a new person and gives them access to this project.">
			{close => (
				<InviteForm
					projectSlug={projectSlug}
					allowUnmanaged
					onSuccess={({ result }) => {
						close()
						showToast(<ToastContent>Member created: {result.person?.email}</ToastContent>, { type: 'success' })
						listController.current?.refresh()
					}}
				>
					<form className={formClassName}>
						{/* allowUnmanaged offers the "no invitation e-mail" path, for seeding and air-gapped setups */}
						<InviteFormFields projectSlug={projectSlug} allowUnmanaged />
					</form>
				</InviteForm>
			)}
		</FormDialog>
	)

	const addExisting = (
		<FormDialog
			label="Add existing"
			title="Add an existing identity"
			description="For an identity that already exists elsewhere in the tenant — copy its identity ID from the person detail."
			icon={<UserPlusIcon className="size-4" />}
			variant="outline"
		>
			{close => (
				<AddProjectMemberForm
					projectSlug={projectSlug}
					onSuccess={() => {
						close()
						showToast(<ToastContent>Member added</ToastContent>, { type: 'success' })
						listController.current?.refresh()
					}}
				>
					<form className={formClassName}>
						<AddProjectMemberFormFields projectSlug={projectSlug} />
					</form>
				</AddProjectMemberForm>
			)}
		</FormDialog>
	)

	return (
		<PageStack>
			<PageHeader
				title="Members"
				description="People with access to this project. Roles and their variables come from the project's own schema, so what a member may see is decided there."
				actions={permissions?.canAddMember === false ? undefined : (
					<>
						{addExisting}
						{invite}
					</>
				)}
			/>
			{permissions?.canViewMembers === false
				? <NoAccessState description="Adding a member does not imply seeing who else is one; this account may do one and not the other." />
				: (
					<PanelSection>
						<PersonList
							controller={listController}
							canUpdateMember={permissions?.canUpdateMember}
							canRemoveMember={permissions?.canRemoveMember}
						/>
					</PanelSection>
				)}
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
