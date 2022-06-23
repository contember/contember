import { h, Fragment } from 'preact'
import { Model } from '@contember/schema'
import { ReferenceMapEntry, ReferencesMap } from '../../schema/collectReferences.js'
import { FieldLink } from './FieldLink.js'
import { EntityLink } from './EntityLink.js'

const sortReferences = (a: ReferenceMapEntry, b: ReferenceMapEntry) =>
	a.owningRelation.joiningColumn.onDelete.localeCompare(b.owningRelation.joiningColumn.onDelete)
	|| a.owningEntity.name.localeCompare(b.owningEntity.name)
	|| a.owningRelation.name.localeCompare(b.owningRelation.name)

export const OnDelete = ({ references, entity, visited = [] }: { references: ReferencesMap; entity: Model.Entity; visited?: Model.Entity[] }) => {
	const referencedFrom = references[entity.name]
	if (referencedFrom.length === 0) {
		if (visited.length !== 0) {
			return null
		}
		return (
			<span class={'bg-green-200 text-gray-600 p-1 rounded'}>
				This entity is not referenced from any other entity.
			</span>
		)
	}

	if (visited.includes(entity)) {
		return (
			<ul class={'ml-4'}>
				<li class={'italic'}>(recursion)</li>
			</ul>
		)
	}

	return (
		<ul class={visited.length > 0 ? 'ml-4' : ''}>
			{referencedFrom
				.sort(sortReferences)
				.map(it => {
					const inverseDescr = it.targetRelation
						? <>see <FieldLink entity={entity.name} field={it.targetRelation.name} /></>
						: 'no inverse side'
					if (it.owningRelation.joiningColumn.onDelete === 'restrict') {
						return (
							<li>
								<span class={'bg-black text-white px-1'}>Fails</span> when referenced from
								{' '}<FieldLink entity={it.owningEntity.name} field={it.owningRelation.name} />
								{' '}({inverseDescr})
							</li>
						)
					}
					if (it.owningRelation.joiningColumn.onDelete === 'set null') {
						return (
							<li>
								<span class={'bg-blue-400 text-white px-1'}>Sets null</span> at
								{' '}<FieldLink entity={it.owningEntity.name} field={it.owningRelation.name} />
								{' '}({inverseDescr})
							</li>
						)
					}
					if (it.owningRelation.joiningColumn.onDelete === 'cascade') {
						return (
							<li>
								<span class={'bg-red-400 text-white px-1'}>Deletes</span> <EntityLink entity={it.owningEntity.name} />
								{' '}connected using
								{' '}<FieldLink entity={it.owningEntity.name} field={it.owningRelation.name} noEntityLabel />
								{' '}({inverseDescr})
								<OnDelete entity={it.owningEntity} visited={[...visited, entity]} references={references} />
							</li>
						)
					}
				})}
		</ul>)
}
