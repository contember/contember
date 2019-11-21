import { HasOneRelation } from './HasOneRelation'

export interface RelativeSingleEntity {
	hasOneRelationPath: HasOneRelation[]
}

// E.g. localesByLocale(locale.slug = en)
export type SugaredRelativeSingleEntity = RelativeSingleEntity | string
