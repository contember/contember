import { ProjectMembersFilter } from '@contember/graphql-client-tenant'
import * as React from 'react'
import { ReactNode, useState } from 'react'
import { Loader } from '../../ui/loader'
import { Table, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table'
import { Button } from '../../ui/button'
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, RefreshCwIcon } from 'lucide-react'
import { ProjectMembersQueryResult, useProjectMembersQuery, useTenantQueryLoader } from '@contember/react-client-tenant'
import { useProjectSlug } from '@contember/react-client'
import { UpdateProjectMemberForm } from '@contember/interface'
import { ToastContent, useShowToast } from '../../toast'
import { dict } from '../../dict'
import { MemberDeleteDialog } from './member-delete-dialog'
import { Dialog, DialogContent, DialogTrigger } from '../../ui/dialog'
import { RolesConfig, UpdateProjectMemberFormFields } from '../forms'

const perPage = 20

export interface MemberListProps {
	filter: ProjectMembersFilter
	labels: {
		deleteConfirmation: string
		deleted: string
		deleteFailed: string
	}
	tableColumns: (it: ProjectMembersQueryResult[number]) => ReactNode
	tableHeaders: string[]
	controller?: { current?: MemberListController }
	roles?: RolesConfig
}

export interface MemberListController {
	refresh: () => void
}

export const MemberList = ({ filter, labels, tableColumns, controller, tableHeaders, roles }: MemberListProps) => {
	const projectSlug = useProjectSlug()!
	const [page, setPage] = useState(0)

	const [query, { refresh }] = useTenantQueryLoader(useProjectMembersQuery(), {
		projectSlug: projectSlug,
		filter: filter,
		offset: page * perPage,
		limit: perPage + 1,
	})
	if (controller) {
		controller.current = { refresh }
	}
	const showToast = useShowToast()

	const onDeleteMember = () => {
		refresh()
		showToast(<ToastContent>{labels.deleted}</ToastContent>, { type: 'success' })
	}
	const onDeleteError = () => {
		showToast(<ToastContent>{labels.deleteFailed}</ToastContent>, { type: 'error' })
	}

	switch (query.state) {
		case 'error':
			return <div className="text-destructive italic">{dict.tenant.memberList.failedToLoadData}</div>
		case 'loading':
		case 'refreshing':
		case 'success':
			return (
				<div className="relative">
					{query.state !== 'success' && <Loader position="absolute" />}
					<Table>
						<TableHeader>
							<TableRow>
								{tableHeaders.map(it => <TableHead key={it}>{it}</TableHead>)}
								<TableHead>{dict.tenant.memberList.roles}</TableHead>
								<TableHead className="w-32">
									<div className="flex gap-2 items-center">
										<span>
											{dict.tenant.memberList.action}
										</span>
										<Button variant="outline" onClick={refresh} className="ml-auto" size="sm"><RefreshCwIcon className="w-3 h-3" /></Button>
									</div>
								</TableHead>
							</TableRow>
						</TableHeader>
						{'data' in query && query.data.length === 0 &&
							<TableRow>
								<TableCell colSpan={tableHeaders.length + 2}>
									{dict.tenant.memberList.noResults}
								</TableCell>
							</TableRow>}
						{'data' in query && query.data.slice(0, perPage).map(it => (
							<TableRow key={it.identity.id}>
								{tableColumns(it)}
								<TableCell key="role">{it.memberships.map((m: any) => m.role).join(', ')}</TableCell>
								<TableCell className="space-x-2 whitespace-nowrap">
									<MemberDeleteDialog
										identityId={it.identity.id}
										projectSlug={projectSlug}
										onSuccess={onDeleteMember}
										onError={onDeleteError}
										title={labels.deleteConfirmation}
									/>
									<EditMembershipDialog projectSlug={projectSlug} identityId={it.identity.id} onSuccess={refresh} roles={roles} />

								</TableCell>
							</TableRow>
						))}
					</Table>
					<div className="flex gap-2 mt-4 justify-between">
						<Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
							<ChevronLeftIcon className="w-4 h-4" />
							<span className="sr-only">{dict.tenant.memberList.previous}</span>
						</Button>
						<Button variant="outline" disabled={'data' in query && query.data.length <= perPage} onClick={() => setPage(page + 1)}>
							<ChevronRightIcon className="w-4 h-4" />
							<span className="sr-only">{dict.tenant.memberList.next}</span>
						</Button>
					</div>
				</div>
			)
	}
}

const EditMembershipDialog = ({ projectSlug, identityId, onSuccess, roles }: { projectSlug: string; identityId: string; onSuccess: () => void; roles?: RolesConfig }) => {

	const showToast = useShowToast()
	const [open, setOpen] = useState(false)
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline"><PencilIcon className="w-3 h-3" /></Button>
			</DialogTrigger>
			<DialogContent>
				<UpdateProjectMemberForm
					projectSlug={projectSlug}
					identityId={identityId}
					onSuccess={args => {
						showToast(<ToastContent>{dict.tenant.updateProjectMember.updateSuccess}</ToastContent>)
						setOpen(false)
						onSuccess()
					}}
				>
					<form className="grid gap-4">
						<UpdateProjectMemberFormFields projectSlug={projectSlug} roles={roles} />
					</form>
				</UpdateProjectMemberForm>
			</DialogContent>
		</Dialog>
	)
}
