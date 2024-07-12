import { Model } from '@contember/schema'

export type ReferenceMapEntry = {
	owningEntity: Model.Entity
	owningRelation: Model.OneHasOneOwningRelation | Model.ManyHasOneRelation
	targetEntity: Model.Entity
	targetRelation: Model.OneHasOneInverseRelation | Model.OneHasManyRelation | null
}
export type ReferencesMap = Record<string, ReferenceMapEntry[]>

export const collectReferences = (model: Model.Schema): ReferencesMap => {
	const entityReferences: ReferencesMap = Object.fromEntries(Object.keys(model.entities).map(it => [it, []]))
	for (const entity of Object.values(model.entities)) {
		for (const field of Object.values(entity.fields)) {
			switch (field.type) {
				case 'OneHasOne':
					const targetEntity = model.entities[field.target]
					if (!('ownedBy' in field)) {
						entityReferences[field.target].push({
							owningEntity: entity,
							owningRelation: field,
							targetEntity: targetEntity,
							targetRelation: field.inversedBy ? targetEntity.fields[field.inversedBy] as Model.OneHasOneInverseRelation : null,
						})
					}
					break
				case 'ManyHasOne':
					const targetEntity2 = model.entities[field.target]
					entityReferences[field.target].push({
						owningEntity: entity,
						owningRelation: field,
						targetEntity: targetEntity2,
						targetRelation: field.inversedBy ? targetEntity2.fields[field.inversedBy] as Model.OneHasManyRelation : null,
					})
					break
			}
		}
	}
	return entityReferences
}
