import { SchemaDefinition as def, AclDefinition as acl } from '@contember/schema-definition'

export class Article {
	title = def.stringColumn()
	category = def.manyHasOne(Category, 'articles')
	tags = def.manyHasMany(Tag, 'articles')
}

export class Category {
	name = def.stringColumn()
	articles = def.oneHasMany(Article, 'category')
}

export class Tag {
	name = def.stringColumn()
	tags = def.manyHasManyInverse(Article, 'tags')
}
