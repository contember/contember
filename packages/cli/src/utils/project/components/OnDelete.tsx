import { h } from 'preact'
import { Model } from '@contember/schema'
import { ReferencesMap } from '../../schema/collectReferences'
import { FieldLink } from './FieldLink'
import { EntityLink } from './EntityLink'

export const OnDelete = ({ references, entity, visited }: { references: ReferencesMap; entity: Model.Entity; visited: string[] }) => {
	const referencedFrom = references[entity.name]
	if (referencedFrom.length === 0) {
		return visited.length === 0
			? (
				<span class={'bg-green-200 text-gray-600 p-1 rounded'}>
					This entity is not referenced from any other entity.
				</span>
			)
			: null
	}
	if (visited.includes(entity.name)) {
		return (
			<ul>
				<li>(recursion)</li>
			</ul>
		)
	}
	return (
		<ul class={visited.length > 0 ? 'ml-4' : ''}>
			{referencedFrom
				.sort((a, b) =>
					a.owningRelation.joiningColumn.onDelete.localeCompare(b.owningRelation.joiningColumn.onDelete)
				|| a.owningEntity.name.localeCompare(b.owningEntity.name)
				|| a.owningRelation.name.localeCompare(b.owningRelation.name),
				).map(it => {
					const inverseDescr = it.targetRelation
						? <FieldLink entity={entity.name} field={it.targetRelation.name} />
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
								{' '}<FieldLink entity={it.owningEntity.name} field={it.owningRelation.name} />
								{' '}({inverseDescr})
								<OnDelete entity={it.owningEntity} visited={[...visited, entity.name]} references={references} />
							</li>
						)
					}
				})}
		</ul>)
}
