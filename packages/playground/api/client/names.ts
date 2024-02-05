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
        }
      },
      "scalars": [
        "id",
        "title",
        "slug",
        "state",
        "locked",
        "publishedAt"
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
    }
  }
}