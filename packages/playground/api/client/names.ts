import { SchemaNames } from '@contember/client-content'
export const ContemberClientNames: SchemaNames = {
  "entities": {
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
    "InputRoot": {
      "name": "InputRoot",
      "fields": {
        "id": {
          "type": "column"
        },
        "unique": {
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
        "unique": {
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
        "unique",
        "notNullValue",
        "uniqueValue",
        "validationValue"
      ]
    },
    "RepeaterItem": {
      "name": "RepeaterItem",
      "fields": {
        "id": {
          "type": "column"
        },
        "title": {
          "type": "column"
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
        "unique"
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
  }
}