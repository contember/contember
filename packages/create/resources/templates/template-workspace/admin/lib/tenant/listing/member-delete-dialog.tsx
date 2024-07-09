import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../ui/alert-dialog'
import { Button } from '../../ui/button'
import { TrashIcon } from 'lucide-react'
import { dict } from '../../dict'
import * as React from 'react'
import { ReactNode } from 'react'
import { RemoveProjectMemberTrigger } from '@contember/interface'

export interface MemberDeleteProps {
	title: ReactNode
	identityId: string
	projectSlug: string
	onSuccess: () => void
	onError: (e: unknown) => void
}

export const MemberDeleteDialog = ({ onError, title, identityId, onSuccess, projectSlug }: MemberDeleteProps) => {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="destructive"><TrashIcon className="w-3 h-3" /></Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{dict.tenant.memberDelete.cancel}</AlertDialogCancel>
					<RemoveProjectMemberTrigger projectSlug={projectSlug} identityId={identityId} onSuccess={onSuccess} onError={onError}>
						<AlertDialogAction asChild>
							<Button variant={'destructive'}>{dict.tenant.memberDelete.confirm}</Button>
						</AlertDialogAction>
					</RemoveProjectMemberTrigger>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
