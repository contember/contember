import { Slots } from '../components/slots'
import { PersistButton } from '../components/binding/PersistButton'
import { Binding, CmdS } from '../components/binding/Binding'
import { EntitySubTree } from '@contember/interface'
import * as React from 'react'
import { Field } from '@contember/react-binding'
import { MultiSelectField, SelectField, SortableMultiSelectField } from '../components/form'


export const hasOne = () => <>
	<Binding>
		<CmdS />
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>
		<EntitySubTree entity={'SelectRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
			<div className={'space-y-4'}>
				<SelectField field={'hasOne'} options={'SelectValue'} filterField={'name'} label="Has one value">
					<Field field={'name'} />
				</SelectField>
			</div>
		</EntitySubTree>
	</Binding>
</>
export const hasMany = () => <>
	<Binding>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>
		<EntitySubTree entity={'SelectRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
			<div className={'space-y-4'}>
				<MultiSelectField field={'hasMany'} options={'SelectValue'} filterField={'name'} label="Has many values">
					<Field field={'name'} />
				</MultiSelectField>
			</div>
		</EntitySubTree>
	</Binding>
</>
export const hasManySortable = () => <>
	<Binding>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>
		<EntitySubTree entity={'SelectRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
			<div className={'space-y-4'}>
				<SortableMultiSelectField field={'hasManySorted'} options={'SelectValue'} filterField={'name'} connectAt={'value'} sortableBy={'order'} label="Has many sortable values">
					<Field field={'name'} />
				</SortableMultiSelectField>
			</div>
		</EntitySubTree>
	</Binding>
</>
