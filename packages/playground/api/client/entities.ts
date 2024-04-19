import type { BlockType } from './enums'
import type { BoardTaskStatus } from './enums'
import type { GridArticleState } from './enums'
import type { InputUnique } from './enums'
import type { SelectUnique } from './enums'
import type { UploadMediaType } from './enums'
import type { UploadOne } from './enums'
import type { BlockImagePosition } from './enums'
import type { BlockListUnique } from './enums'
import type { DimensionsItemUnique } from './enums'
import type { InputRootEnumValue } from './enums'

export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { readonly [K in string]?: JSONValue }
export type JSONArray = readonly JSONValue[]

export type Block <OverRelation extends string | never = never> = {
	name: 'Block'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ image: BlockImage['unique']}, OverRelation>
	columns: {
		id: string
		order: number
		type: BlockType
		title: string
		content: string | null
		imagePosition: BlockImagePosition | null
		color: string | null
	}
	hasOne: {
		list: BlockList
		image: BlockImage
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type BlockImage <OverRelation extends string | never = never> = {
	name: 'BlockImage'
	unique:
		| Omit<{ id: string}, OverRelation>
	columns: {
		id: string
		url: string | null
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type BlockList <OverRelation extends string | never = never> = {
	name: 'BlockList'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ unique: BlockListUnique}, OverRelation>
		| Omit<{ blocks: Block['unique']}, OverRelation>
	columns: {
		id: string
		unique: BlockListUnique
	}
	hasOne: {
	}
	hasMany: {
		blocks: Block<'list'>
	}
	hasManyBy: {
		blocksByImage: { entity: Block; by: {image: BlockImage['unique']}  }
	}
}
export type BoardTag <OverRelation extends string | never = never> = {
	name: 'BoardTag'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ slug: string}, OverRelation>
	columns: {
		id: string
		name: string
		slug: string
		color: string | null
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type BoardTask <OverRelation extends string | never = never> = {
	name: 'BoardTask'
	unique:
		| Omit<{ id: string}, OverRelation>
	columns: {
		id: string
		title: string
		description: string | null
		status: BoardTaskStatus | null
		order: number | null
	}
	hasOne: {
		assignee: BoardUser
	}
	hasMany: {
		tags: BoardTag
	}
	hasManyBy: {
	}
}
export type BoardUser <OverRelation extends string | never = never> = {
	name: 'BoardUser'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ username: string}, OverRelation>
	columns: {
		id: string
		name: string
		username: string
		order: number | null
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type DimensionsItem <OverRelation extends string | never = never> = {
	name: 'DimensionsItem'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ unique: DimensionsItemUnique}, OverRelation>
		| Omit<{ locales: DimensionsItemLocale['unique']}, OverRelation>
	columns: {
		id: string
		unique: DimensionsItemUnique
	}
	hasOne: {
	}
	hasMany: {
		locales: DimensionsItemLocale<'item'>
	}
	hasManyBy: {
		localesByLocale: { entity: DimensionsItemLocale; by: {locale: DimensionsLocale['unique']}  }
	}
}
export type DimensionsItemLocale <OverRelation extends string | never = never> = {
	name: 'DimensionsItemLocale'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ item: DimensionsItem['unique'], locale: DimensionsLocale['unique']}, OverRelation>
	columns: {
		id: string
		title: string
		content: string | null
	}
	hasOne: {
		item: DimensionsItem
		locale: DimensionsLocale
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type DimensionsLocale <OverRelation extends string | never = never> = {
	name: 'DimensionsLocale'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ code: string}, OverRelation>
	columns: {
		id: string
		code: string
		label: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type GridArticle <OverRelation extends string | never = never> = {
	name: 'GridArticle'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ slug: string}, OverRelation>
		| Omit<{ comments: GridArticleComment['unique']}, OverRelation>
	columns: {
		id: string
		title: string | null
		slug: string
		state: GridArticleState | null
		locked: boolean | null
		publishedAt: string | null
		publishDate: string | null
		views: number | null
	}
	hasOne: {
		author: GridAuthor
		category: GridCategory
	}
	hasMany: {
		tags: GridTag
		comments: GridArticleComment<'article'>
	}
	hasManyBy: {
	}
}
export type GridArticleComment <OverRelation extends string | never = never> = {
	name: 'GridArticleComment'
	unique:
		| Omit<{ id: string}, OverRelation>
	columns: {
		id: string
		content: string | null
		createdAt: string | null
	}
	hasOne: {
		article: GridArticle
		author: GridAuthor
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type GridAuthor <OverRelation extends string | never = never> = {
	name: 'GridAuthor'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ slug: string}, OverRelation>
	columns: {
		id: string
		name: string
		slug: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type GridCategory <OverRelation extends string | never = never> = {
	name: 'GridCategory'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ slug: string}, OverRelation>
	columns: {
		id: string
		name: string
		slug: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type GridTag <OverRelation extends string | never = never> = {
	name: 'GridTag'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ slug: string}, OverRelation>
	columns: {
		id: string
		name: string
		slug: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type InputRoot <OverRelation extends string | never = never> = {
	name: 'InputRoot'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ unique: InputUnique}, OverRelation>
	columns: {
		id: string
		unique: InputUnique
		textValue: string | null
		intValue: number | null
		floatValue: number | null
		boolValue: boolean | null
		dateValue: string | null
		datetimeValue: string | null
		jsonValue: JSONValue | null
		enumValue: InputRootEnumValue | null
		uuidValue: string | null
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type InputRules <OverRelation extends string | never = never> = {
	name: 'InputRules'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ unique: InputUnique}, OverRelation>
		| Omit<{ uniqueValue: string}, OverRelation>
	columns: {
		id: string
		unique: InputUnique
		notNullValue: string
		uniqueValue: string | null
		validationValue: string | null
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type RepeaterItem <OverRelation extends string | never = never> = {
	name: 'RepeaterItem'
	unique:
		| Omit<{ id: string}, OverRelation>
	columns: {
		id: string
		title: string
		order: number | null
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type SelectItem <OverRelation extends string | never = never> = {
	name: 'SelectItem'
	unique:
		| Omit<{ id: string}, OverRelation>
	columns: {
		id: string
		order: number | null
	}
	hasOne: {
		root: SelectRoot
		value: SelectValue
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type SelectRoot <OverRelation extends string | never = never> = {
	name: 'SelectRoot'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ unique: SelectUnique}, OverRelation>
		| Omit<{ hasOne: SelectValue['unique']}, OverRelation>
		| Omit<{ hasManySorted: SelectItem['unique']}, OverRelation>
	columns: {
		id: string
		unique: SelectUnique
	}
	hasOne: {
		hasOne: SelectValue
	}
	hasMany: {
		hasMany: SelectValue
		hasManySorted: SelectItem<'root'>
	}
	hasManyBy: {
	}
}
export type SelectValue <OverRelation extends string | never = never> = {
	name: 'SelectValue'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ slug: string}, OverRelation>
	columns: {
		id: string
		name: string
		slug: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type UploadAudio <OverRelation extends string | never = never> = {
	name: 'UploadAudio'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ meta: UploadFileMetadata['unique']}, OverRelation>
	columns: {
		id: string
		url: string | null
		duration: number | null
	}
	hasOne: {
		meta: UploadFileMetadata
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type UploadFile <OverRelation extends string | never = never> = {
	name: 'UploadFile'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ meta: UploadFileMetadata['unique']}, OverRelation>
	columns: {
		id: string
		url: string | null
	}
	hasOne: {
		meta: UploadFileMetadata
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type UploadFileMetadata <OverRelation extends string | never = never> = {
	name: 'UploadFileMetadata'
	unique:
		| Omit<{ id: string}, OverRelation>
	columns: {
		id: string
		fileName: string | null
		lastModified: string | null
		fileSize: number | null
		fileType: string | null
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type UploadGallery <OverRelation extends string | never = never> = {
	name: 'UploadGallery'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ items: UploadGalleryItem['unique']}, OverRelation>
	columns: {
		id: string
	}
	hasOne: {
	}
	hasMany: {
		items: UploadGalleryItem<'gallery'>
	}
	hasManyBy: {
		itemsByImage: { entity: UploadGalleryItem; by: {image: UploadImage['unique']}  }
		itemsByVideo: { entity: UploadGalleryItem; by: {video: UploadVideo['unique']}  }
		itemsByAudio: { entity: UploadGalleryItem; by: {audio: UploadAudio['unique']}  }
		itemsByFile: { entity: UploadGalleryItem; by: {file: UploadFile['unique']}  }
	}
}
export type UploadGalleryItem <OverRelation extends string | never = never> = {
	name: 'UploadGalleryItem'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ image: UploadImage['unique']}, OverRelation>
		| Omit<{ video: UploadVideo['unique']}, OverRelation>
		| Omit<{ audio: UploadAudio['unique']}, OverRelation>
		| Omit<{ file: UploadFile['unique']}, OverRelation>
	columns: {
		id: string
		type: UploadMediaType
	}
	hasOne: {
		gallery: UploadGallery
		image: UploadImage
		video: UploadVideo
		audio: UploadAudio
		file: UploadFile
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type UploadImage <OverRelation extends string | never = never> = {
	name: 'UploadImage'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ meta: UploadFileMetadata['unique']}, OverRelation>
	columns: {
		id: string
		url: string | null
		width: number | null
		height: number | null
		alt: string | null
	}
	hasOne: {
		meta: UploadFileMetadata
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type UploadImageList <OverRelation extends string | never = never> = {
	name: 'UploadImageList'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ items: UploadImageListItem['unique']}, OverRelation>
	columns: {
		id: string
	}
	hasOne: {
	}
	hasMany: {
		items: UploadImageListItem<'list'>
	}
	hasManyBy: {
		itemsByImage: { entity: UploadImageListItem; by: {image: UploadImage['unique']}  }
	}
}
export type UploadImageListItem <OverRelation extends string | never = never> = {
	name: 'UploadImageListItem'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ image: UploadImage['unique']}, OverRelation>
	columns: {
		id: string
		order: number
	}
	hasOne: {
		list: UploadImageList
		image: UploadImage
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type UploadList <OverRelation extends string | never = never> = {
	name: 'UploadList'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ items: UploadListItem['unique']}, OverRelation>
	columns: {
		id: string
	}
	hasOne: {
	}
	hasMany: {
		items: UploadListItem<'list'>
	}
	hasManyBy: {
	}
}
export type UploadListItem <OverRelation extends string | never = never> = {
	name: 'UploadListItem'
	unique:
		| Omit<{ id: string}, OverRelation>
	columns: {
		id: string
		order: number
	}
	hasOne: {
		list: UploadList
		item: UploadMedium
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type UploadMedium <OverRelation extends string | never = never> = {
	name: 'UploadMedium'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ image: UploadImage['unique']}, OverRelation>
		| Omit<{ video: UploadVideo['unique']}, OverRelation>
		| Omit<{ audio: UploadAudio['unique']}, OverRelation>
		| Omit<{ file: UploadFile['unique']}, OverRelation>
	columns: {
		id: string
		type: UploadMediaType
	}
	hasOne: {
		image: UploadImage
		video: UploadVideo
		audio: UploadAudio
		file: UploadFile
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type UploadRoot <OverRelation extends string | never = never> = {
	name: 'UploadRoot'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ unique: UploadOne}, OverRelation>
		| Omit<{ image: UploadImage['unique']}, OverRelation>
		| Omit<{ audio: UploadAudio['unique']}, OverRelation>
		| Omit<{ video: UploadVideo['unique']}, OverRelation>
		| Omit<{ file: UploadFile['unique']}, OverRelation>
		| Omit<{ imageTrivial: UploadImage['unique']}, OverRelation>
		| Omit<{ imageList: UploadImageList['unique']}, OverRelation>
		| Omit<{ medium: UploadMedium['unique']}, OverRelation>
		| Omit<{ gallery: UploadGallery['unique']}, OverRelation>
		| Omit<{ list: UploadList['unique']}, OverRelation>
	columns: {
		id: string
		unique: UploadOne
	}
	hasOne: {
		image: UploadImage
		audio: UploadAudio
		video: UploadVideo
		file: UploadFile
		imageTrivial: UploadImage
		imageList: UploadImageList
		medium: UploadMedium
		gallery: UploadGallery
		list: UploadList
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type UploadVideo <OverRelation extends string | never = never> = {
	name: 'UploadVideo'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ meta: UploadFileMetadata['unique']}, OverRelation>
	columns: {
		id: string
		url: string | null
		width: number | null
		height: number | null
		duration: number | null
	}
	hasOne: {
		meta: UploadFileMetadata
	}
	hasMany: {
	}
	hasManyBy: {
	}
}

export type ContemberClientEntities = {
	Block: Block
	BlockImage: BlockImage
	BlockList: BlockList
	BoardTag: BoardTag
	BoardTask: BoardTask
	BoardUser: BoardUser
	DimensionsItem: DimensionsItem
	DimensionsItemLocale: DimensionsItemLocale
	DimensionsLocale: DimensionsLocale
	GridArticle: GridArticle
	GridArticleComment: GridArticleComment
	GridAuthor: GridAuthor
	GridCategory: GridCategory
	GridTag: GridTag
	InputRoot: InputRoot
	InputRules: InputRules
	RepeaterItem: RepeaterItem
	SelectItem: SelectItem
	SelectRoot: SelectRoot
	SelectValue: SelectValue
	UploadAudio: UploadAudio
	UploadFile: UploadFile
	UploadFileMetadata: UploadFileMetadata
	UploadGallery: UploadGallery
	UploadGalleryItem: UploadGalleryItem
	UploadImage: UploadImage
	UploadImageList: UploadImageList
	UploadImageListItem: UploadImageListItem
	UploadList: UploadList
	UploadListItem: UploadListItem
	UploadMedium: UploadMedium
	UploadRoot: UploadRoot
	UploadVideo: UploadVideo
}

export type ContemberClientSchema = {
	entities: ContemberClientEntities
}
