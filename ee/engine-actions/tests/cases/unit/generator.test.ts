import { TriggerListenerBuilder, TriggerListeners } from '../../../src/triggers'
import { SchemaDefinition as def } from '@contember/schema-definition'
import { Actions, Model } from '@contember/schema'
import { assert, test } from 'vitest'


const createTrigger = (watchNode: Actions.SelectionNode): Actions.AnyTrigger => ({
	type: 'watch',
	entity: 'Author',
	name: 'author_trigger',
	watch: watchNode,
	target: null as any,
})

const testBuilder = (watchNode: Actions.SelectionNode): TriggerListeners => {
	const generator = new TriggerListenerBuilder(schema)
	generator.add(createTrigger(watchNode))
	return (generator.createStore() as any).listeners
}

test('watch column', () => {
	const node = ['name']
	const trigger = createTrigger(node)
	const listeners = createEmptyListeners(['name'], trigger)

	assert.deepStrictEqual(testBuilder(node), listeners)
})

test('first level many-has-many owning', () => {
	const node = [['topics', {}, ['name']]] as const
	const trigger = createTrigger(node)
	const listeners = createEmptyListeners([], trigger)
	listeners.junctionListeners.set('Author', new Map([
		['topics', [
			{
				type: 'junction',
				path: [],
				rootEntity: schema.entities.Author,
				context: {
					type: 'owning',
					entity: schema.entities.Author,
					relation: schema.entities.Author.fields.topics as Model.ManyHasManyOwningRelation,
				},
				trigger,
			},
		]],
	]))

	listeners.indirectListeners.set('AuthorTopic', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['name']),
		relations: new Set(),
		path: ['topics'],
	}])


	assert.deepStrictEqual(testBuilder(node), listeners)
})

test('first level many-has-many inverse', () => {

	const node = [['followers', {}, ['name']]] as const
	const trigger = createTrigger(node)

	const listeners = createEmptyListeners([], trigger)
	listeners.junctionListeners.set('User', new Map([
		['following', [
			{
				type: 'junction',
				path: [],
				rootEntity: schema.entities.Author,
				context: {
					type: 'inverse',
					entity: schema.entities.Author,
					relation: schema.entities.Author.fields.followers as Model.ManyHasManyInverseRelation,
				},
				trigger,
			},
		]],
	]))
	listeners.indirectListeners.set('User', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['name']),
		relations: new Set(),
		path: ['followers'],
	}])
	assert.deepStrictEqual(testBuilder(node), listeners)
})


test('first level one-has-one owning', () => {
	const node = [['avatar', {}, ['url']]] as const
	const trigger = createTrigger(node)
	const listeners = createEmptyListeners(['avatar'], trigger)
	listeners.indirectListeners.set('Image', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['url']),
		relations: new Set(),
		path: ['avatar'],
	}])

	assert.deepStrictEqual(testBuilder(node), listeners)
})

test('first level one-has-one inverse', () => {
	const node = [['bio', {}, ['content']]] as const
	const trigger = createTrigger(node)
	const listeners = createEmptyListeners([], trigger)
	listeners.indirectListeners.set('AuthorBio', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['content', 'author']),
		relations: new Set(['author']),
		path: ['bio'],
	}])

	assert.deepStrictEqual(testBuilder(node), listeners)
})

test('first level many-has-one', () => {
	const node = [['supervisor', {}, ['name']]] as const
	const trigger = createTrigger(node)
	const listeners = createEmptyListeners(['supervisor'], trigger)
	listeners.indirectListeners.set('Author', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['name']),
		relations: new Set(),
		path: ['supervisor'],
	}])

	assert.deepStrictEqual(testBuilder(node), listeners)
})

test('first level one-has-many', () => {
	const node = [['articles', {}, ['title']]] as const
	const trigger = createTrigger(node)
	const listeners = createEmptyListeners([], trigger)
	listeners.indirectListeners.set('Article', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['title', 'author']),
		relations: new Set(['author']),
		path: ['articles'],
	}])

	assert.deepStrictEqual(testBuilder(node), listeners)
})


test('second level one-has-one owning', () => {

	const node = [['articles', {}, [['image', {}, ['url']]]]] as const

	const trigger = createTrigger(node)
	const listeners = createEmptyListeners([], trigger)
	listeners.indirectListeners.set('Image', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['url']),
		relations: new Set(),
		path: ['articles', 'image'],
	}])

	listeners.indirectListeners.set('Article', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['author', 'image']),
		relations: new Set(['author', 'image']),
		path: ['articles'],
	}])

	assert.deepStrictEqual(testBuilder(node), listeners)
})


test('second level one-has-one inverse', () => {
	const node = [['articles', {}, [['settings', {}, ['visible']]]]] as const

	const trigger = createTrigger(node)
	const listeners = createEmptyListeners([], trigger)
	listeners.indirectListeners.set('ArticleSettings', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['visible', 'article']),
		relations: new Set(['article']),
		path: ['articles', 'settings'],
	}])

	listeners.indirectListeners.set('Article', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['author']),
		relations: new Set(['author']),
		path: ['articles'],
	}])


	assert.deepStrictEqual(testBuilder(node), listeners)
})


test('second level one-has-many', () => {
	const node = [['articles', {}, [['comments', {}, ['content']]]]] as const

	const trigger = createTrigger(node)

	const listeners = createEmptyListeners([], trigger)
	listeners.indirectListeners.set('Comment', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['article', 'content']),
		relations: new Set(['article']),
		path: ['articles', 'comments'],
	}])

	listeners.indirectListeners.set('Article', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['author']),
		relations: new Set(['author']),
		path: ['articles'],
	}])

	assert.deepStrictEqual(testBuilder(node), listeners)
})


test('third level many-has-one', () => {

	const node = [['articles', {}, [['comments', {}, [['author', {}, ['name']]]]]]] as const
	const trigger = createTrigger(node)

	const listeners = createEmptyListeners([], trigger)
	listeners.indirectListeners.set('User', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['name']),
		relations: new Set(),
		path: ['articles', 'comments', 'author'],
	}])

	listeners.indirectListeners.set('Comment', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['article', 'author']),
		relations: new Set(['article', 'author']),
		path: ['articles', 'comments'],
	}])

	listeners.indirectListeners.set('Article', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['author']),
		relations: new Set(['author']),
		path: ['articles'],
	}])

	assert.deepStrictEqual(testBuilder(node), listeners)
})


test('second level many-has-one', () => {


	const node = [['articles', {}, [['category', {}, ['name']]]]] as const
	const trigger = createTrigger(node)
	const listeners = createEmptyListeners([], trigger)
	listeners.indirectListeners.set('Category', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['name']),
		relations: new Set(),
		path: ['articles', 'category'],
	}])

	listeners.indirectListeners.set('Article', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['author', 'category']),
		relations: new Set(['author', 'category']),
		path: ['articles'],
	}])

	assert.deepStrictEqual(testBuilder(node), listeners)
})


test('second level many-has-many owning', () => {

	const node = [['articles', {}, [['tags', {}, ['name']]]]] as const
	const trigger = createTrigger(node)
	const listeners = createEmptyListeners([], trigger)
	listeners.junctionListeners.set('Article', new Map([
		['tags', [
			{
				type: 'junction',
				path: ['articles'],
				rootEntity: schema.entities.Author,
				context: {
					entity: schema.entities.Article,
					relation: schema.entities.Article.fields.tags as Model.ManyHasManyOwningRelation,
					type: 'owning',
				},
				trigger,
			},
		]],
	]))

	listeners.indirectListeners.set('Tag', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['name']),
		relations: new Set(),
		path: ['articles', 'tags'],
	}])


	listeners.indirectListeners.set('Article', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['author']),
		relations: new Set(['author']),
		path: ['articles'],
	}])

	assert.deepStrictEqual(testBuilder(node), listeners)
})

test('second level many-has-many inverse', () => {

	const node = [['articles', {}, [['likedBy', {}, ['name']]]]] as const
	const trigger = createTrigger(node)
	const listeners = createEmptyListeners([], trigger)
	listeners.junctionListeners.set('User', new Map([
		['likes', [
			{
				type: 'junction',
				path: ['articles'],
				rootEntity: schema.entities.Author,
				context: {
					type: 'inverse',
					entity: schema.entities.Article,
					relation: schema.entities.Article.fields.likedBy as Model.ManyHasManyInverseRelation,
				},
				trigger,
			},
		]],
	]))

	listeners.indirectListeners.set('User', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['name']),
		relations: new Set(),
		path: ['articles', 'likedBy'],
	}])


	listeners.indirectListeners.set('Article', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['author']),
		relations: new Set(['author']),
		path: ['articles'],
	}])

	assert.deepStrictEqual(testBuilder(node), listeners)
})


test('all above', () => {
	const node = [
		'name',
		['topics', {}, ['name']],
		['followers', {}, ['name']],
		['avatar', {}, ['url']],
		['bio', {}, ['content']],
		['supervisor', {}, ['name']],
		['articles', {}, [
			'title',
			['image', {}, ['url']],
			['settings', {}, ['visible']],
			['comments', {}, ['content', ['author', {}, ['name']]]],
			['category', {}, ['name']],
			['tags', {}, ['name']],
			['likedBy', {}, ['name']],

		]],
	] as const
	const trigger = createTrigger(node)
	const listeners = createEmptyListeners(['name', 'avatar', 'supervisor'], trigger)
	listeners.junctionListeners.set('Author', new Map([
		['topics', [
			{
				type: 'junction',
				path: [],
				rootEntity: schema.entities.Author,
				context: {
					type: 'owning',
					entity: schema.entities.Author,
					relation: schema.entities.Author.fields.topics as Model.ManyHasManyOwningRelation,
				},
				trigger,
			},
		]],
	]))
	listeners.junctionListeners.set('User', new Map([
		['following', [
			{
				type: 'junction',
				path: [],
				rootEntity: schema.entities.Author,
				context: {
					type: 'inverse',
					entity: schema.entities.Author,
					relation: schema.entities.Author.fields.followers as Model.ManyHasManyInverseRelation,
				},
				trigger,
			},
		]],
		['likes', [
			{
				type: 'junction',
				path: ['articles'],
				rootEntity: schema.entities.Author,
				context: {
					type: 'inverse',
					entity: schema.entities.Article,
					relation: schema.entities.Article.fields.likedBy as Model.ManyHasManyInverseRelation,
				},
				trigger,
			},
		]],
	]))

	listeners.junctionListeners.set('Article', new Map([
		['tags', [
			{
				type: 'junction',
				path: ['articles'],
				rootEntity: schema.entities.Author,
				context: {
					type: 'owning',
					entity: schema.entities.Article,
					relation: schema.entities.Article.fields.tags as Model.ManyHasManyOwningRelation,
				},
				trigger,
			},
		]],
	]))

	listeners.indirectListeners.set('AuthorTopic', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['name']),
		relations: new Set(),
		path: ['topics'],
	}])

	listeners.indirectListeners.set('User', [
		{
			type: 'indirect',
			rootEntity: schema.entities.Author,
			trigger,
			fields: new Set(['name']),
			relations: new Set(),
			path: ['followers'],
		},
		{
			type: 'indirect',
			rootEntity: schema.entities.Author,
			trigger,
			fields: new Set(['name']),
			relations: new Set(),
			path: ['articles', 'comments', 'author'],
		},
		{
			type: 'indirect',
			rootEntity: schema.entities.Author,
			trigger,
			fields: new Set(['name']),
			relations: new Set(),
			path: ['articles', 'likedBy'],
		},
	])

	listeners.indirectListeners.set('Image', [
		{
			type: 'indirect',
			rootEntity: schema.entities.Author,
			trigger,
			fields: new Set(['url']),
			relations: new Set(),
			path: ['avatar'],
		},
		{
			type: 'indirect',
			rootEntity: schema.entities.Author,
			trigger,
			fields: new Set(['url']),
			relations: new Set(),
			path: ['articles', 'image'],
		},
	])

	listeners.indirectListeners.set('AuthorBio', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['content', 'author']),
		relations: new Set(['author']),
		path: ['bio'],
	}])

	listeners.indirectListeners.set('Author', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['name']),
		relations: new Set(),
		path: ['supervisor'],
	}])

	listeners.indirectListeners.set('ArticleSettings', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['visible', 'article']),
		relations: new Set(['article']),
		path: ['articles', 'settings'],
	}])

	listeners.indirectListeners.set('Comment', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['article', 'content', 'author']),
		relations: new Set(['author', 'article']),
		path: ['articles', 'comments'],
	}])


	listeners.indirectListeners.set('Category', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['name']),
		relations: new Set(),
		path: ['articles', 'category'],
	}])
	listeners.indirectListeners.set('Tag', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['name']),
		relations: new Set(),
		path: ['articles', 'tags'],
	}])

	listeners.indirectListeners.set('Article', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['title', 'image', 'category', 'author']),
		relations: new Set(['image', 'category', 'author']),
		path: ['articles'],
	}])


	listeners.indirectListeners.set('AuthorTopic', [{
		type: 'indirect',
		rootEntity: schema.entities.Author,
		trigger,
		fields: new Set(['name']),
		relations: new Set(),
		path: ['topics'],
	}])

	assert.deepStrictEqual(testBuilder(node), listeners)
})


namespace WatchModel {
	export class Author {
		name = def.stringColumn()
		topics = def.manyHasMany(AuthorTopic)
		followers = def.manyHasManyInverse(User, 'following')
		avatar = def.oneHasOne(Image)
		bio = def.oneHasOneInverse(AuthorBio, 'author')
		supervisor = def.manyHasOne(Author)
		articles = def.oneHasMany(Article, 'author')
	}

	export class AuthorBio {
		content = def.stringColumn()
		author = def.oneHasOne(Author, 'bio')
	}

	export class AuthorTopic {
		name = def.stringColumn()
	}

	export class Image {
		url = def.stringColumn()
	}

	export class User {
		name = def.stringColumn()
		following = def.manyHasMany(Author, 'followers')
		likes = def.manyHasOne(Article, 'likedBy')
	}

	export class Article {
		author = def.manyHasOne(Author, 'articles')
		title = def.stringColumn()
		image = def.oneHasOne(Image)
		settings = def.oneHasOneInverse(ArticleSettings, 'article')
		comments = def.oneHasMany(Comment, 'article')
		category = def.manyHasOne(Category)
		tags = def.manyHasMany(Tag)
		likedBy = def.manyHasManyInverse(User, 'likes')
	}

	export class ArticleSettings {
		article = def.oneHasOne(Article, 'settings')
		visible = def.boolColumn()
	}

	export class Comment {
		article = def.manyHasOne(Article, 'comments')
		content = def.stringColumn()
		author = def.manyHasOne(User)
	}

	export class Category {
		name = def.stringColumn()
	}

	export class Tag {
		name = def.stringColumn()
	}
}

const schema = def.createModel(WatchModel)

const createEmptyListeners = (rootFields: string[], trigger: Actions.AnyTrigger) => {
	const listeners: TriggerListeners = {
		createListeners: new Map(),
		updateListeners: new Map(),
		deleteListeners: new Map(),
		indirectListeners: new Map(),
		junctionListeners: new Map(),
	}
	listeners.createListeners.set('Author', [{ type: 'create', entity: schema.entities.Author, trigger }])
	listeners.deleteListeners.set('Author', [{ type: 'delete', entity: schema.entities.Author, trigger }])
	listeners.updateListeners.set('Author', [{
		type: 'update',
		entity: schema.entities.Author,
		trigger,
		fields: new Set(rootFields),
	}])
	return listeners
}
