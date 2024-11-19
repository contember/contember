import { ActivityCommonForm } from '@app/lib-extra/gantt/table/activity-common-form'
import { SlotsLengthType } from '@app/lib-extra/gantt/utils/types'
import { Binding, usePersistWithFeedback } from '@app/lib/binding'
import { dict } from '@app/lib/dict'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter } from '@app/lib/ui/alert-dialog'
import { Button } from '@app/lib/ui/button'
import { Component, EntityAccessor, EntitySubTree, PersistTrigger } from '@contember/interface'
import { useDataViewEntityListProps, useDataViewReload } from '@contember/react-dataview'
import React, { ReactNode } from 'react'

export type ActivityModalProps = {
	startTimeField: string
	endTimeField: string
	slotsLength: SlotsLengthType
	discriminationField: string
	discriminationLabel: ReactNode
	timeSlots: string[]
	form: ReactNode
}

export type CreateActivityModalProps = {
	newActivity: { discriminator: EntityAccessor; time: string } | null
	setNewActivity: (newActivity: { discriminator: EntityAccessor; time: string } | null) => void
} & ActivityModalProps

export const CreateActivityModal = Component(({ newActivity, setNewActivity, ...props }: CreateActivityModalProps) => {
	const newEntityName = useDataViewEntityListProps().entityName
	const persist = usePersistWithFeedback()
	const reloadDataview = useDataViewReload()

	const handleSave = () => {
		persist()
		setNewActivity(null)
		reloadDataview()
	}

	return (
		<AlertDialog open={!!newActivity}>
			<AlertDialogContent>
				<Binding>
					<EntitySubTree entity={newEntityName} isCreating>
						{newActivity && <ActivityCommonForm discriminator={newActivity.discriminator} time={newActivity.time} {...props} />}
					</EntitySubTree>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setNewActivity(null)}>{dict.deleteEntityDialog.cancelButton}</AlertDialogCancel>
						<PersistTrigger onPersistSuccess={handleSave}>
							<Button>{dict.persist.persistButton}</Button>
						</PersistTrigger>
					</AlertDialogFooter>
				</Binding>
			</AlertDialogContent>
		</AlertDialog>
	)
})

export type EditActivityModalProps = {
	editedActivity: EntityAccessor | null
	setEditedActivity: (editedActivity: EntityAccessor | null) => void
} & ActivityModalProps

export const EditActivityModal = Component(({ editedActivity, setEditedActivity, ...props }: EditActivityModalProps) => {
	const newEntityName = useDataViewEntityListProps().entityName
	const persist = usePersistWithFeedback()
	const reloadDataview = useDataViewReload()

	const handleSave = () => {
		persist()
		setEditedActivity(null)
		reloadDataview()
	}

	if (!editedActivity) {
		return null
	}

	return (
		<AlertDialog open={!!editedActivity}>
			<AlertDialogContent>
				<Binding>
					<EntitySubTree entity={`${newEntityName}(id='${editedActivity.id}')`} isCreating={false}>
						<ActivityCommonForm {...props} />
					</EntitySubTree>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setEditedActivity(null)}>{dict.deleteEntityDialog.cancelButton}</AlertDialogCancel>
						<PersistTrigger onPersistSuccess={handleSave}>
							<Button>{dict.persist.persistButton}</Button>
						</PersistTrigger>
					</AlertDialogFooter>
				</Binding>
			</AlertDialogContent>
		</AlertDialog>
	)
})
