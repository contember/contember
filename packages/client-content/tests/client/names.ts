import { SchemaNames } from '@contember/client-content'
export const ContemberClientNames: SchemaNames = {
  "entities": {
    "Locale": {
      "name": "Locale",
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
    "Author": {
      "name": "Author",
      "fields": {
        "id": {
          "type": "column"
        },
        "name": {
          "type": "column"
        },
        "email": {
          "type": "column"
        },
        "posts": {
          "type": "many",
          "entity": "Post"
        }
      },
      "scalars": [
        "id",
        "name",
        "email"
      ]
    },
    "Post": {
      "name": "Post",
      "fields": {
        "id": {
          "type": "column"
        },
        "publishedAt": {
          "type": "column"
        },
        "tags": {
          "type": "many",
          "entity": "Tag"
        },
        "author": {
          "type": "one",
          "entity": "Author"
        },
        "locales": {
          "type": "many",
          "entity": "PostLocale"
        }
      },
      "scalars": [
        "id",
        "publishedAt"
      ]
    },
    "PostLocale": {
      "name": "PostLocale",
      "fields": {
        "id": {
          "type": "column"
        },
        "locale": {
          "type": "one",
          "entity": "Locale"
        },
        "title": {
          "type": "column"
        },
        "content": {
          "type": "column"
        },
        "post": {
          "type": "one",
          "entity": "Post"
        }
      },
      "scalars": [
        "id",
        "title",
        "content"
      ]
    },
    "Tag": {
      "name": "Tag",
      "fields": {
        "id": {
          "type": "column"
        },
        "name": {
          "type": "column"
        },
        "posts": {
          "type": "many",
          "entity": "Post"
        }
      },
      "scalars": [
        "id",
        "name"
      ]
    }
  }
}