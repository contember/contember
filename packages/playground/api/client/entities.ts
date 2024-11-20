import type { BlockType } from './enums'
import type { BoardTaskStatus } from './enums'
import type { ContentEmbedType } from './enums'
import type { EditorReferenceType } from './enums'
import type { ExtendTreeUnique } from './enums'
import type { GridArticleState } from './enums'
import type { InputUnique } from './enums'
import type { LegacyEditorReferenceType } from './enums'
import type { SelectUnique } from './enums'
import type { UploadMediaType } from './enums'
import type { UploadOne } from './enums'
import type { BlockImagePosition } from './enums'
import type { BlockListUnique } from './enums'
import type { DimensionsItemUnique } from './enums'
import type { EditorContentUnique } from './enums'
import type { EditorTextAreaUnique } from './enums'
import type { InputRootEnumValue } from './enums'
import type { LegacyEditorContentUnique } from './enums'
import type { PlateEditorContentUnique } from './enums'
import type { RepeaterRootUnique } from './enums'
import type { SlugUnique } from './enums'

export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { readonly [K in string]?: JSONValue }
export type JSONArray = readonly JSONValue[]

export type AclBranch <OverRelation extends string | never = never> = {
	name: 'AclBranch'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ code: string}, OverRelation>
	columns: {
		id: string
		code: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
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
export type EditorContent <OverRelation extends string | never = never> = {
	name: 'EditorContent'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ unique: EditorContentUnique}, OverRelation>
		| Omit<{ references: EditorReference['unique']}, OverRelation>
	columns: {
		id: string
		unique: EditorContentUnique
		data: JSONValue
	}
	hasOne: {
	}
	hasMany: {
		references: EditorReference<'content'>
	}
	hasManyBy: {
	}
}
export type EditorImage <OverRelation extends string | never = never> = {
	name: 'EditorImage'
	unique:
		| Omit<{ id: string}, OverRelation>
	columns: {
		id: string
		url: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type EditorLink <OverRelation extends string | never = never> = {
	name: 'EditorLink'
	unique:
		| Omit<{ id: string}, OverRelation>
	columns: {
		id: string
		url: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type EditorReference <OverRelation extends string | never = never> = {
	name: 'EditorReference'
	unique:
		| Omit<{ id: string}, OverRelation>
	columns: {
		id: string
		type: EditorReferenceType
	}
	hasOne: {
		content: EditorContent
		image: EditorImage
		link: EditorLink
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type EditorTextArea <OverRelation extends string | never = never> = {
	name: 'EditorTextArea'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ unique: EditorTextAreaUnique}, OverRelation>
	columns: {
		id: string
		unique: EditorTextAreaUnique
		data: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type ExtendTreeMany <OverRelation extends string | never = never> = {
	name: 'ExtendTreeMany'
	unique:
		| Omit<{ id: string}, OverRelation>
	columns: {
		id: string
		value: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type ExtendTreeSingle <OverRelation extends string | never = never> = {
	name: 'ExtendTreeSingle'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ unique: ExtendTreeUnique}, OverRelation>
	columns: {
		id: string
		unique: ExtendTreeUnique
		value: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type Folder <OverRelation extends string | never = never> = {
	name: 'Folder'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ children: Folder['unique']}, OverRelation>
	columns: {
		id: string
		name: string
	}
	hasOne: {
		parent: Folder
	}
	hasMany: {
		children: Folder<'parent'>
	}
	hasManyBy: {
		childrenByChildren: { entity: Folder; by: {children: Folder['unique']}  }
	}
}
export type GridArticle <OverRelation extends string | never = never> = {
	name: 'GridArticle'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ slug: string}, OverRelation>
		| Omit<{ comments: GridArticleComment['unique']}, OverRelation>
		| Omit<{ details: GridArticleDetail['unique']}, OverRelation>
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
		details: GridArticleDetail
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
export type GridArticleDetail <OverRelation extends string | never = never> = {
	name: 'GridArticleDetail'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ article: GridArticle['unique']}, OverRelation>
	columns: {
		id: string
		commentsCount: number
	}
	hasOne: {
		article: GridArticle
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
		dummy: string | null
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
		| Omit<{ uniqueValue: string}, OverRelation>
	columns: {
		id: string
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
export type LegacyEditorBlock <OverRelation extends string | never = never> = {
	name: 'LegacyEditorBlock'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ references: LegacyEditorReference['unique']}, OverRelation>
	columns: {
		id: string
		order: number
		data: string
	}
	hasOne: {
		content: LegacyEditorContent
	}
	hasMany: {
		references: LegacyEditorReference<'block'>
	}
	hasManyBy: {
		referencesByTarget: { entity: LegacyEditorReference; by: {target: LegacyEditorLink['unique']}  }
		referencesByEmbed: { entity: LegacyEditorReference; by: {embed: LegacyEditorEmbed['unique']}  }
	}
}
export type LegacyEditorContent <OverRelation extends string | never = never> = {
	name: 'LegacyEditorContent'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ unique: LegacyEditorContentUnique}, OverRelation>
		| Omit<{ blocks: LegacyEditorBlock['unique']}, OverRelation>
	columns: {
		id: string
		unique: LegacyEditorContentUnique
	}
	hasOne: {
	}
	hasMany: {
		blocks: LegacyEditorBlock<'content'>
	}
	hasManyBy: {
		blocksByReferences: { entity: LegacyEditorBlock; by: {references: LegacyEditorReference['unique']}  }
	}
}
export type LegacyEditorEmbed <OverRelation extends string | never = never> = {
	name: 'LegacyEditorEmbed'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ reference: LegacyEditorReference['unique']}, OverRelation>
	columns: {
		id: string
		type: ContentEmbedType
		youtubeId: string | null
		vimeoId: string | null
	}
	hasOne: {
		reference: LegacyEditorReference
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type LegacyEditorImage <OverRelation extends string | never = never> = {
	name: 'LegacyEditorImage'
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
export type LegacyEditorLink <OverRelation extends string | never = never> = {
	name: 'LegacyEditorLink'
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
export type LegacyEditorReference <OverRelation extends string | never = never> = {
	name: 'LegacyEditorReference'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ target: LegacyEditorLink['unique']}, OverRelation>
		| Omit<{ embed: LegacyEditorEmbed['unique']}, OverRelation>
	columns: {
		id: string
		type: LegacyEditorReferenceType
	}
	hasOne: {
		block: LegacyEditorBlock
		target: LegacyEditorLink
		embed: LegacyEditorEmbed
		image: LegacyEditorImage
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type PlateEditorContent <OverRelation extends string | never = never> = {
	name: 'PlateEditorContent'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ unique: PlateEditorContentUnique}, OverRelation>
	columns: {
		id: string
		unique: PlateEditorContentUnique
		data: JSONValue
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
		root: RepeaterRoot
		relation: RepeaterRelation
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type RepeaterRelation <OverRelation extends string | never = never> = {
	name: 'RepeaterRelation'
	unique:
		| Omit<{ id: string}, OverRelation>
	columns: {
		id: string
		name: string
	}
	hasOne: {
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type RepeaterRoot <OverRelation extends string | never = never> = {
	name: 'RepeaterRoot'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ unique: RepeaterRootUnique}, OverRelation>
		| Omit<{ items: RepeaterItem['unique']}, OverRelation>
	columns: {
		id: string
		unique: RepeaterRootUnique
	}
	hasOne: {
	}
	hasMany: {
		items: RepeaterItem<'root'>
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
		dummy: string | null
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
export type Slug <OverRelation extends string | never = never> = {
	name: 'Slug'
	unique:
		| Omit<{ id: string}, OverRelation>
		| Omit<{ unique: SlugUnique}, OverRelation>
	columns: {
		id: string
		unique: SlugUnique
		slug: string
		title: string
	}
	hasOne: {
		category: SlugCategory
	}
	hasMany: {
	}
	hasManyBy: {
	}
}
export type SlugCategory <OverRelation extends string | never = never> = {
	name: 'SlugCategory'
	unique:
		| Omit<{ id: string}, OverRelation>
	columns: {
		id: string
		name: string
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
	AclBranch: AclBranch
	Block: Block
	BlockImage: BlockImage
	BlockList: BlockList
	BoardTag: BoardTag
	BoardTask: BoardTask
	BoardUser: BoardUser
	DimensionsItem: DimensionsItem
	DimensionsItemLocale: DimensionsItemLocale
	DimensionsLocale: DimensionsLocale
	EditorContent: EditorContent
	EditorImage: EditorImage
	EditorLink: EditorLink
	EditorReference: EditorReference
	EditorTextArea: EditorTextArea
	ExtendTreeMany: ExtendTreeMany
	ExtendTreeSingle: ExtendTreeSingle
	Folder: Folder
	GridArticle: GridArticle
	GridArticleComment: GridArticleComment
	GridArticleDetail: GridArticleDetail
	GridAuthor: GridAuthor
	GridCategory: GridCategory
	GridTag: GridTag
	InputRoot: InputRoot
	InputRules: InputRules
	LegacyEditorBlock: LegacyEditorBlock
	LegacyEditorContent: LegacyEditorContent
	LegacyEditorEmbed: LegacyEditorEmbed
	LegacyEditorImage: LegacyEditorImage
	LegacyEditorLink: LegacyEditorLink
	LegacyEditorReference: LegacyEditorReference
	PlateEditorContent: PlateEditorContent
	RepeaterItem: RepeaterItem
	RepeaterRelation: RepeaterRelation
	RepeaterRoot: RepeaterRoot
	SelectItem: SelectItem
	SelectRoot: SelectRoot
	SelectValue: SelectValue
	Slug: Slug
	SlugCategory: SlugCategory
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
