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
        }
      },
      "scalars": [
        "id",
        "title",
        "description",
        "status"
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
        }
      },
      "scalars": [
        "id",
        "name",
        "username"
      ]
    }
  }
}