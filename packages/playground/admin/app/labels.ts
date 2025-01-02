import { BoardTaskStatus, ContemberClientEntities, ContemberClientEnums, GridArticleState, ContemberClientNames } from '../../api/client'
import { createEnumFormatter } from '~/lib/formatting'
import { ReactNode } from 'react'
import { EnumOptionsFormatter, FieldLabelFormatter } from '~/lib/labels'

export const BoardTaskStatusLabels: Record<BoardTaskStatus, string> = {
	backlog: 'Backlog',
	done: 'Done',
	todo: 'To Do',
	inProgress: 'In Progress',
}
export const formatBoardTaskStatus = createEnumFormatter(BoardTaskStatusLabels)

export const GridArticleStateLabels: Record<GridArticleState, string> = {
	published: 'Published',
	draft: 'Draft',
	archived: 'Archived',
}

export const formatGridArticleState = createEnumFormatter(GridArticleStateLabels)

export const fieldLabels = {
	FormArticle: {
		internalName: 'Internal Name',
		author: 'Author',
		locked: 'Locked',
		notes: 'Notes',
		state: 'State',
		publishedAt: 'Published At',
		locales: 'Locales',
		tags: 'Tags',
	},
	FormTag: {
		name: 'Name',
		articles: 'Articles',
		slug: 'Slug',
	},
	FormNote: {
		article: 'Article',
		createdAt: 'Created At',
		text: 'Text',
	},
	FormAuthor: {
		articles: 'Articles',
		name: 'Name',
		slug: 'Slug',
	},
	FormArticleLocale: {
		article: 'Article',
		slug: 'Slug',
		content: 'Content',
		title: 'Title',
		locale: 'Locale',
	},
	GridArticle: {
		state: 'State',
		author: 'Author',
	},
} satisfies {
	[E in keyof ContemberClientEntities]?: {
		[F in (keyof ContemberClientEntities[E]['columns']) | (keyof ContemberClientEntities[E]['hasOne']) | (keyof ContemberClientEntities[E]['hasMany'])]?: ReactNode
	}
}

export const fieldLabelFormatter: FieldLabelFormatter = (entityName, fieldName) => {
	return (fieldLabels as any)[entityName]?.[fieldName] ?? fieldName
}


export const enumLabels = {
	GridArticleState: {
		published: 'Published',
		draft: 'Draft',
		archived: 'Archived',
	},
	InputRootEnumValue: {
		a: 'A',
		b: 'B',
		c: 'C',
	},
	FormArticleState: {
		archived: 'Archived',
		draft: 'Draft',
		published: 'Published',
	},
} satisfies {
	[E in keyof ContemberClientEnums]?: {
		[K in ContemberClientEnums[E]]?: string
	}
}

export const enumOptionsFormatter: EnumOptionsFormatter = enumName => {
	if (!(enumName in enumLabels)) {
		return Object.fromEntries(Object.values(ContemberClientNames.enums[enumName]).map(value => [value, value]))
	}
	return (enumLabels as any)[enumName] ?? {}
}
