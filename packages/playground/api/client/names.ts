import { SchemaNames } from '@contember/client-content'
export const ContemberClientNames: SchemaNames = {
  "entities": {
    "AclBranch": {
      "name": "AclBranch",
      "fields": {
        "id": {
          "type": "column"
        },
        "code": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "code"
      ]
    },
    "Block": {
      "name": "Block",
      "fields": {
        "id": {
          "type": "column"
        },
        "list": {
          "type": "one",
          "entity": "BlockList"
        },
        "order": {
          "type": "column"
        },
        "type": {
          "type": "column"
        },
        "title": {
          "type": "column"
        },
        "content": {
          "type": "column"
        },
        "image": {
          "type": "one",
          "entity": "BlockImage"
        },
        "imagePosition": {
          "type": "column"
        },
        "color": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "order",
        "type",
        "title",
        "content",
        "imagePosition",
        "color"
      ]
    },
    "BlockImage": {
      "name": "BlockImage",
      "fields": {
        "id": {
          "type": "column"
        },
        "url": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "url"
      ]
    },
    "BlockList": {
      "name": "BlockList",
      "fields": {
        "id": {
          "type": "column"
        },
        "unique": {
          "type": "column"
        },
        "blocks": {
          "type": "many",
          "entity": "Block"
        }
      },
      "scalars": [
        "id",
        "unique"
      ]
    },
    "BoardTag": {
      "name": "BoardTag",
      "fields": {
        "id": {
          "type": "column"
        },
        "name": {
          "type": "column"
        },
        "slug": {
          "type": "column"
        },
        "color": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "name",
        "slug",
        "color"
      ]
    },
    "BoardTask": {
      "name": "BoardTask",
      "fields": {
        "id": {
          "type": "column"
        },
        "title": {
          "type": "column"
        },
        "description": {
          "type": "column"
        },
        "status": {
          "type": "column"
        },
        "assignee": {
          "type": "one",
          "entity": "BoardUser"
        },
        "tags": {
          "type": "many",
          "entity": "BoardTag"
        },
        "order": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "title",
        "description",
        "status",
        "order"
      ]
    },
    "BoardUser": {
      "name": "BoardUser",
      "fields": {
        "id": {
          "type": "column"
        },
        "name": {
          "type": "column"
        },
        "username": {
          "type": "column"
        },
        "order": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "name",
        "username",
        "order"
      ]
    },
    "DimensionsItem": {
      "name": "DimensionsItem",
      "fields": {
        "id": {
          "type": "column"
        },
        "unique": {
          "type": "column"
        },
        "locales": {
          "type": "many",
          "entity": "DimensionsItemLocale"
        }
      },
      "scalars": [
        "id",
        "unique"
      ]
    },
    "DimensionsItemLocale": {
      "name": "DimensionsItemLocale",
      "fields": {
        "id": {
          "type": "column"
        },
        "item": {
          "type": "one",
          "entity": "DimensionsItem"
        },
        "locale": {
          "type": "one",
          "entity": "DimensionsLocale"
        },
        "title": {
          "type": "column"
        },
        "content": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "title",
        "content"
      ]
    },
    "DimensionsLocale": {
      "name": "DimensionsLocale",
      "fields": {
        "id": {
          "type": "column"
        },
        "code": {
          "type": "column"
        },
        "label": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "code",
        "label"
      ]
    },
    "EditorContent": {
      "name": "EditorContent",
      "fields": {
        "id": {
          "type": "column"
        },
        "unique": {
          "type": "column"
        },
        "data": {
          "type": "column"
        },
        "references": {
          "type": "many",
          "entity": "EditorReference"
        }
      },
      "scalars": [
        "id",
        "unique",
        "data"
      ]
    },
    "EditorImage": {
      "name": "EditorImage",
      "fields": {
        "id": {
          "type": "column"
        },
        "url": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "url"
      ]
    },
    "EditorLink": {
      "name": "EditorLink",
      "fields": {
        "id": {
          "type": "column"
        },
        "url": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "url"
      ]
    },
    "EditorReference": {
      "name": "EditorReference",
      "fields": {
        "id": {
          "type": "column"
        },
        "content": {
          "type": "one",
          "entity": "EditorContent"
        },
        "type": {
          "type": "column"
        },
        "image": {
          "type": "one",
          "entity": "EditorImage"
        },
        "link": {
          "type": "one",
          "entity": "EditorLink"
        }
      },
      "scalars": [
        "id",
        "type"
      ]
    },
    "EditorTextArea": {
      "name": "EditorTextArea",
      "fields": {
        "id": {
          "type": "column"
        },
        "unique": {
          "type": "column"
        },
        "data": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "unique",
        "data"
      ]
    },
    "ExtendTreeMany": {
      "name": "ExtendTreeMany",
      "fields": {
        "id": {
          "type": "column"
        },
        "value": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "value"
      ]
    },
    "ExtendTreeSingle": {
      "name": "ExtendTreeSingle",
      "fields": {
        "id": {
          "type": "column"
        },
        "unique": {
          "type": "column"
        },
        "value": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "unique",
        "value"
      ]
    },
    "Folder": {
      "name": "Folder",
      "fields": {
        "id": {
          "type": "column"
        },
        "name": {
          "type": "column"
        },
        "parent": {
          "type": "one",
          "entity": "Folder"
        },
        "children": {
          "type": "many",
          "entity": "Folder"
        }
      },
      "scalars": [
        "id",
        "name"
      ]
    },
    "FormArticle": {
      "name": "FormArticle",
      "fields": {
        "id": {
          "type": "column"
        },
        "state": {
          "type": "column"
        },
        "locked": {
          "type": "column"
        },
        "internalName": {
          "type": "column"
        },
        "publishedAt": {
          "type": "column"
        },
        "author": {
          "type": "one",
          "entity": "FormAuthor"
        },
        "tags": {
          "type": "many",
          "entity": "FormTag"
        },
        "locales": {
          "type": "many",
          "entity": "FormArticleLocale"
        },
        "notes": {
          "type": "many",
          "entity": "FormNote"
        }
      },
      "scalars": [
        "id",
        "state",
        "locked",
        "internalName",
        "publishedAt"
      ]
    },
    "FormArticleLocale": {
      "name": "FormArticleLocale",
      "fields": {
        "id": {
          "type": "column"
        },
        "locale": {
          "type": "column"
        },
        "article": {
          "type": "one",
          "entity": "FormArticle"
        },
        "title": {
          "type": "column"
        },
        "content": {
          "type": "column"
        },
        "slug": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "locale",
        "title",
        "content",
        "slug"
      ]
    },
    "FormAuthor": {
      "name": "FormAuthor",
      "fields": {
        "id": {
          "type": "column"
        },
        "name": {
          "type": "column"
        },
        "slug": {
          "type": "column"
        },
        "articles": {
          "type": "many",
          "entity": "FormArticle"
        }
      },
      "scalars": [
        "id",
        "name",
        "slug"
      ]
    },
    "FormNote": {
      "name": "FormNote",
      "fields": {
        "id": {
          "type": "column"
        },
        "article": {
          "type": "one",
          "entity": "FormArticle"
        },
        "createdAt": {
          "type": "column"
        },
        "text": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "createdAt",
        "text"
      ]
    },
    "FormTag": {
      "name": "FormTag",
      "fields": {
        "id": {
          "type": "column"
        },
        "name": {
          "type": "column"
        },
        "slug": {
          "type": "column"
        },
        "articles": {
          "type": "many",
          "entity": "FormArticle"
        }
      },
      "scalars": [
        "id",
        "name",
        "slug"
      ]
    },
    "GanttActivity": {
      "name": "GanttActivity",
      "fields": {
        "id": {
          "type": "column"
        },
        "name": {
          "type": "column"
        },
        "startTime": {
          "type": "column"
        },
        "endTime": {
          "type": "column"
        },
        "discriminator": {
          "type": "one",
          "entity": "GanttDiscriminator"
        },
        "category": {
          "type": "one",
          "entity": "GanttCategory"
        }
      },
      "scalars": [
        "id",
        "name",
        "startTime",
        "endTime"
      ]
    },
    "GanttCategory": {
      "name": "GanttCategory",
      "fields": {
        "id": {
          "type": "column"
        },
        "name": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "name"
      ]
    },
    "GanttDiscriminator": {
      "name": "GanttDiscriminator",
      "fields": {
        "id": {
          "type": "column"
        },
        "slug": {
          "type": "column"
        },
        "name": {
          "type": "column"
        },
        "activities": {
          "type": "many",
          "entity": "GanttActivity"
        }
      },
      "scalars": [
        "id",
        "slug",
        "name"
      ]
    },
    "GridArticle": {
      "name": "GridArticle",
      "fields": {
        "id": {
          "type": "column"
        },
        "title": {
          "type": "column"
        },
        "slug": {
          "type": "column"
        },
        "state": {
          "type": "column"
        },
        "locked": {
          "type": "column"
        },
        "publishedAt": {
          "type": "column"
        },
        "publishDate": {
          "type": "column"
        },
        "author": {
          "type": "one",
          "entity": "GridAuthor"
        },
        "category": {
          "type": "one",
          "entity": "GridCategory"
        },
        "tags": {
          "type": "many",
          "entity": "GridTag"
        },
        "views": {
          "type": "column"
        },
        "comments": {
          "type": "many",
          "entity": "GridArticleComment"
        },
        "details": {
          "type": "one",
          "entity": "GridArticleDetail"
        }
      },
      "scalars": [
        "id",
        "title",
        "slug",
        "state",
        "locked",
        "publishedAt",
        "publishDate",
        "views"
      ]
    },
    "GridArticleComment": {
      "name": "GridArticleComment",
      "fields": {
        "id": {
          "type": "column"
        },
        "article": {
          "type": "one",
          "entity": "GridArticle"
        },
        "author": {
          "type": "one",
          "entity": "GridAuthor"
        },
        "content": {
          "type": "column"
        },
        "createdAt": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "content",
        "createdAt"
      ]
    },
    "GridArticleDetail": {
      "name": "GridArticleDetail",
      "fields": {
        "id": {
          "type": "column"
        },
        "article": {
          "type": "one",
          "entity": "GridArticle"
        },
        "commentsCount": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "commentsCount"
      ]
    },
    "GridAuthor": {
      "name": "GridAuthor",
      "fields": {
        "id": {
          "type": "column"
        },
        "name": {
          "type": "column"
        },
        "slug": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "name",
        "slug"
      ]
    },
    "GridCategory": {
      "name": "GridCategory",
      "fields": {
        "id": {
          "type": "column"
        },
        "name": {
          "type": "column"
        },
        "slug": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "name",
        "slug"
      ]
    },
    "GridTag": {
      "name": "GridTag",
      "fields": {
        "id": {
          "type": "column"
        },
        "name": {
          "type": "column"
        },
        "slug": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "name",
        "slug"
      ]
    },
    "HooksValue": {
      "name": "HooksValue",
      "fields": {
        "id": {
          "type": "column"
        },
        "createdAt": {
          "type": "column"
        },
        "value": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "createdAt",
        "value"
      ]
    },
    "InputRoot": {
      "name": "InputRoot",
      "fields": {
        "id": {
          "type": "column"
        },
        "unique": {
          "type": "column"
        },
        "dummy": {
          "type": "column"
        },
        "textValue": {
          "type": "column"
        },
        "intValue": {
          "type": "column"
        },
        "floatValue": {
          "type": "column"
        },
        "boolValue": {
          "type": "column"
        },
        "dateValue": {
          "type": "column"
        },
        "datetimeValue": {
          "type": "column"
        },
        "jsonValue": {
          "type": "column"
        },
        "enumValue": {
          "type": "column"
        },
        "uuidValue": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "unique",
        "dummy",
        "textValue",
        "intValue",
        "floatValue",
        "boolValue",
        "dateValue",
        "datetimeValue",
        "jsonValue",
        "enumValue",
        "uuidValue"
      ]
    },
    "InputRules": {
      "name": "InputRules",
      "fields": {
        "id": {
          "type": "column"
        },
        "notNullValue": {
          "type": "column"
        },
        "uniqueValue": {
          "type": "column"
        },
        "validationValue": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "notNullValue",
        "uniqueValue",
        "validationValue"
      ]
    },
    "LegacyEditorBlock": {
      "name": "LegacyEditorBlock",
      "fields": {
        "id": {
          "type": "column"
        },
        "content": {
          "type": "one",
          "entity": "LegacyEditorContent"
        },
        "order": {
          "type": "column"
        },
        "data": {
          "type": "column"
        },
        "references": {
          "type": "many",
          "entity": "LegacyEditorReference"
        }
      },
      "scalars": [
        "id",
        "order",
        "data"
      ]
    },
    "LegacyEditorContent": {
      "name": "LegacyEditorContent",
      "fields": {
        "id": {
          "type": "column"
        },
        "unique": {
          "type": "column"
        },
        "blocks": {
          "type": "many",
          "entity": "LegacyEditorBlock"
        }
      },
      "scalars": [
        "id",
        "unique"
      ]
    },
    "LegacyEditorEmbed": {
      "name": "LegacyEditorEmbed",
      "fields": {
        "id": {
          "type": "column"
        },
        "type": {
          "type": "column"
        },
        "youtubeId": {
          "type": "column"
        },
        "vimeoId": {
          "type": "column"
        },
        "reference": {
          "type": "one",
          "entity": "LegacyEditorReference"
        }
      },
      "scalars": [
        "id",
        "type",
        "youtubeId",
        "vimeoId"
      ]
    },
    "LegacyEditorImage": {
      "name": "LegacyEditorImage",
      "fields": {
        "id": {
          "type": "column"
        },
        "url": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "url"
      ]
    },
    "LegacyEditorLink": {
      "name": "LegacyEditorLink",
      "fields": {
        "id": {
          "type": "column"
        },
        "url": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "url"
      ]
    },
    "LegacyEditorReference": {
      "name": "LegacyEditorReference",
      "fields": {
        "id": {
          "type": "column"
        },
        "block": {
          "type": "one",
          "entity": "LegacyEditorBlock"
        },
        "type": {
          "type": "column"
        },
        "target": {
          "type": "one",
          "entity": "LegacyEditorLink"
        },
        "embed": {
          "type": "one",
          "entity": "LegacyEditorEmbed"
        },
        "image": {
          "type": "one",
          "entity": "LegacyEditorImage"
        }
      },
      "scalars": [
        "id",
        "type"
      ]
    },
    "PlateEditorContent": {
      "name": "PlateEditorContent",
      "fields": {
        "id": {
          "type": "column"
        },
        "unique": {
          "type": "column"
        },
        "data": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "unique",
        "data"
      ]
    },
    "RepeaterItem": {
      "name": "RepeaterItem",
      "fields": {
        "id": {
          "type": "column"
        },
        "root": {
          "type": "one",
          "entity": "RepeaterRoot"
        },
        "title": {
          "type": "column"
        },
        "relation": {
          "type": "one",
          "entity": "RepeaterRelation"
        },
        "order": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "title",
        "order"
      ]
    },
    "RepeaterRelation": {
      "name": "RepeaterRelation",
      "fields": {
        "id": {
          "type": "column"
        },
        "name": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "name"
      ]
    },
    "RepeaterRoot": {
      "name": "RepeaterRoot",
      "fields": {
        "id": {
          "type": "column"
        },
        "unique": {
          "type": "column"
        },
        "items": {
          "type": "many",
          "entity": "RepeaterItem"
        }
      },
      "scalars": [
        "id",
        "unique"
      ]
    },
    "SelectItem": {
      "name": "SelectItem",
      "fields": {
        "id": {
          "type": "column"
        },
        "root": {
          "type": "one",
          "entity": "SelectRoot"
        },
        "value": {
          "type": "one",
          "entity": "SelectValue"
        },
        "order": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "order"
      ]
    },
    "SelectRoot": {
      "name": "SelectRoot",
      "fields": {
        "id": {
          "type": "column"
        },
        "unique": {
          "type": "column"
        },
        "dummy": {
          "type": "column"
        },
        "hasOne": {
          "type": "one",
          "entity": "SelectValue"
        },
        "hasMany": {
          "type": "many",
          "entity": "SelectValue"
        },
        "hasManySorted": {
          "type": "many",
          "entity": "SelectItem"
        }
      },
      "scalars": [
        "id",
        "unique",
        "dummy"
      ]
    },
    "SelectValue": {
      "name": "SelectValue",
      "fields": {
        "id": {
          "type": "column"
        },
        "name": {
          "type": "column"
        },
        "slug": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "name",
        "slug"
      ]
    },
    "Slug": {
      "name": "Slug",
      "fields": {
        "id": {
          "type": "column"
        },
        "unique": {
          "type": "column"
        },
        "slug": {
          "type": "column"
        },
        "title": {
          "type": "column"
        },
        "category": {
          "type": "one",
          "entity": "SlugCategory"
        }
      },
      "scalars": [
        "id",
        "unique",
        "slug",
        "title"
      ]
    },
    "SlugCategory": {
      "name": "SlugCategory",
      "fields": {
        "id": {
          "type": "column"
        },
        "name": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "name"
      ]
    },
    "UploadAudio": {
      "name": "UploadAudio",
      "fields": {
        "id": {
          "type": "column"
        },
        "url": {
          "type": "column"
        },
        "duration": {
          "type": "column"
        },
        "meta": {
          "type": "one",
          "entity": "UploadFileMetadata"
        }
      },
      "scalars": [
        "id",
        "url",
        "duration"
      ]
    },
    "UploadFile": {
      "name": "UploadFile",
      "fields": {
        "id": {
          "type": "column"
        },
        "url": {
          "type": "column"
        },
        "meta": {
          "type": "one",
          "entity": "UploadFileMetadata"
        }
      },
      "scalars": [
        "id",
        "url"
      ]
    },
    "UploadFileMetadata": {
      "name": "UploadFileMetadata",
      "fields": {
        "id": {
          "type": "column"
        },
        "fileName": {
          "type": "column"
        },
        "lastModified": {
          "type": "column"
        },
        "fileSize": {
          "type": "column"
        },
        "fileType": {
          "type": "column"
        }
      },
      "scalars": [
        "id",
        "fileName",
        "lastModified",
        "fileSize",
        "fileType"
      ]
    },
    "UploadGallery": {
      "name": "UploadGallery",
      "fields": {
        "id": {
          "type": "column"
        },
        "items": {
          "type": "many",
          "entity": "UploadGalleryItem"
        }
      },
      "scalars": [
        "id"
      ]
    },
    "UploadGalleryItem": {
      "name": "UploadGalleryItem",
      "fields": {
        "id": {
          "type": "column"
        },
        "gallery": {
          "type": "one",
          "entity": "UploadGallery"
        },
        "type": {
          "type": "column"
        },
        "image": {
          "type": "one",
          "entity": "UploadImage"
        },
        "video": {
          "type": "one",
          "entity": "UploadVideo"
        },
        "audio": {
          "type": "one",
          "entity": "UploadAudio"
        },
        "file": {
          "type": "one",
          "entity": "UploadFile"
        }
      },
      "scalars": [
        "id",
        "type"
      ]
    },
    "UploadImage": {
      "name": "UploadImage",
      "fields": {
        "id": {
          "type": "column"
        },
        "url": {
          "type": "column"
        },
        "width": {
          "type": "column"
        },
        "height": {
          "type": "column"
        },
        "alt": {
          "type": "column"
        },
        "meta": {
          "type": "one",
          "entity": "UploadFileMetadata"
        }
      },
      "scalars": [
        "id",
        "url",
        "width",
        "height",
        "alt"
      ]
    },
    "UploadImageList": {
      "name": "UploadImageList",
      "fields": {
        "id": {
          "type": "column"
        },
        "items": {
          "type": "many",
          "entity": "UploadImageListItem"
        }
      },
      "scalars": [
        "id"
      ]
    },
    "UploadImageListItem": {
      "name": "UploadImageListItem",
      "fields": {
        "id": {
          "type": "column"
        },
        "list": {
          "type": "one",
          "entity": "UploadImageList"
        },
        "order": {
          "type": "column"
        },
        "image": {
          "type": "one",
          "entity": "UploadImage"
        }
      },
      "scalars": [
        "id",
        "order"
      ]
    },
    "UploadList": {
      "name": "UploadList",
      "fields": {
        "id": {
          "type": "column"
        },
        "items": {
          "type": "many",
          "entity": "UploadListItem"
        }
      },
      "scalars": [
        "id"
      ]
    },
    "UploadListItem": {
      "name": "UploadListItem",
      "fields": {
        "id": {
          "type": "column"
        },
        "list": {
          "type": "one",
          "entity": "UploadList"
        },
        "order": {
          "type": "column"
        },
        "item": {
          "type": "one",
          "entity": "UploadMedium"
        }
      },
      "scalars": [
        "id",
        "order"
      ]
    },
    "UploadMedium": {
      "name": "UploadMedium",
      "fields": {
        "id": {
          "type": "column"
        },
        "type": {
          "type": "column"
        },
        "image": {
          "type": "one",
          "entity": "UploadImage"
        },
        "video": {
          "type": "one",
          "entity": "UploadVideo"
        },
        "audio": {
          "type": "one",
          "entity": "UploadAudio"
        },
        "file": {
          "type": "one",
          "entity": "UploadFile"
        }
      },
      "scalars": [
        "id",
        "type"
      ]
    },
    "UploadRoot": {
      "name": "UploadRoot",
      "fields": {
        "id": {
          "type": "column"
        },
        "unique": {
          "type": "column"
        },
        "image": {
          "type": "one",
          "entity": "UploadImage"
        },
        "audio": {
          "type": "one",
          "entity": "UploadAudio"
        },
        "video": {
          "type": "one",
          "entity": "UploadVideo"
        },
        "file": {
          "type": "one",
          "entity": "UploadFile"
        },
        "imageTrivial": {
          "type": "one",
          "entity": "UploadImage"
        },
        "imageList": {
          "type": "one",
          "entity": "UploadImageList"
        },
        "medium": {
          "type": "one",
          "entity": "UploadMedium"
        },
        "gallery": {
          "type": "one",
          "entity": "UploadGallery"
        },
        "list": {
          "type": "one",
          "entity": "UploadList"
        }
      },
      "scalars": [
        "id",
        "unique"
      ]
    },
    "UploadVideo": {
      "name": "UploadVideo",
      "fields": {
        "id": {
          "type": "column"
        },
        "url": {
          "type": "column"
        },
        "width": {
          "type": "column"
        },
        "height": {
          "type": "column"
        },
        "duration": {
          "type": "column"
        },
        "meta": {
          "type": "one",
          "entity": "UploadFileMetadata"
        }
      },
      "scalars": [
        "id",
        "url",
        "width",
        "height",
        "duration"
      ]
    }
  },
  "enums": {
    "BlockType": [
      "text",
      "image",
      "textWithImage",
      "hero"
    ],
    "BoardTaskStatus": [
      "backlog",
      "todo",
      "inProgress",
      "done"
    ],
    "ContentEmbedType": [
      "youtube",
      "vimeo"
    ],
    "EditorReferenceType": [
      "image",
      "link",
      "quote"
    ],
    "ExtendTreeUnique": [
      "unique"
    ],
    "FormArticleState": [
      "published",
      "draft",
      "archived"
    ],
    "GridArticleState": [
      "published",
      "draft",
      "archived"
    ],
    "InputUnique": [
      "unique"
    ],
    "LegacyEditorReferenceType": [
      "link",
      "quote",
      "image",
      "embed"
    ],
    "SelectUnique": [
      "unique"
    ],
    "UploadMediaType": [
      "image",
      "video",
      "audio",
      "file"
    ],
    "UploadOne": [
      "unique"
    ],
    "BlockImagePosition": [
      "left",
      "right"
    ],
    "BlockListUnique": [
      "unique"
    ],
    "DimensionsItemUnique": [
      "unique"
    ],
    "EditorContentUnique": [
      "unique"
    ],
    "EditorTextAreaUnique": [
      "unique"
    ],
    "FormArticleLocaleLocale": [
      "cs",
      "en"
    ],
    "InputRootEnumValue": [
      "a",
      "b",
      "c"
    ],
    "LegacyEditorContentUnique": [
      "unique"
    ],
    "PlateEditorContentUnique": [
      "unique"
    ],
    "RepeaterRootUnique": [
      "unique"
    ],
    "SlugUnique": [
      "unique"
    ]
  }
}