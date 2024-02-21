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
    }
  }
}