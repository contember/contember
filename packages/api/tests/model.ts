import { RelationType, Schema } from "../src/schema/model"

export default {
  enums: {
    siteVisibility: ["visible", "hidden"],
    locale: ["cs", "en"],
  },
  entities: {
    Author: {
      name: "Author",
      primary: "id",
      primaryColumn: "id",
      tableName: "Author",
      fields: {
        id: {name: "id", type: "uuid", columnName: "id"},
        name: {name: "name", type: "string", columnName: "name"},
        posts: {name: "posts", relation: RelationType.OneHasMany, target: "Post", ownedBy: "author"}
      }
    },
    Category: {
      name: "Category",
      pluralName: "Categories",
      primary: "id",
      primaryColumn: "id",
      tableName: "Category",
      fields: {
        id: {name: "id", type: "uuid", columnName: "id"},
        locales: {name: "locales", relation: RelationType.OneHasMany, target: "CategoryLocale", ownedBy: "category"},
        posts: {name: "posts", relation: RelationType.ManyHasMany, target: "Post", ownedBy: "categories"},
      }
    },
    CategoryLocale: {
      name: "CategoryLocale",
      primary: "id",
      primaryColumn: "id",
      tableName: "CategoryLocale",
      fields: {
        id: {name: "id", type: "uuid", columnName: "id"},
        name: {name: "name", type: "string", columnName: "name"},
        locale: {name: "locale", type: "locale", columnName: "locale"},
        category: {
          name: "category",
          relation: RelationType.ManyHasOne,
          target: "Category",
          inversedBy: "locales",
          joiningColumn: {
            columnName: "category_id",
            onDelete: "restrict",
          }
        },
      }
    },
    Post: {
      name: "Post",
      primary: "id",
      primaryColumn: "id",
      tableName: "Post",
      fields: {
        id: {name: "id", type: "uuid", columnName: "id"},
        publishedAt: {name: "publishedAt", type: "datetime", columnName: "publishedAt"},
        author: {
          name: "author",
          relation: RelationType.ManyHasOne,
          target: "Author",
          joiningColumn: {columnName: "author_id", onDelete: "cascade"},
          inversedBy: "posts"
        },
        locales: {name: "locales", relation: RelationType.OneHasMany, target: "PostLocale", ownedBy: "post"},
        sites: {name: "sites", relation: RelationType.OneHasMany, target: "PostSite", ownedBy: "post"},
        categories: {
          name: "categories",
          relation: RelationType.ManyHasMany,
          target: "Category",
          inversedBy: "posts",
          joiningTable: {
            tableName: "PostCategories",
            joiningColumn: {
              columnName: "post_id",
              onDelete: "cascade"
            },
            inverseJoiningColumn: {
              columnName: "category_id",
              onDelete: "cascade"
            }
          }
        },
      }
    },
    PostLocale: {
      name: "PostLocale",
      primary: "id",
      primaryColumn: "id",
      tableName: "PostLocale",
      unique: [{fields: ["post", "locale"]}],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id"},
        post: {
          name: "post",
          relation: RelationType.ManyHasOne,
          target: "Post",
          inversedBy: "locales",
          joiningColumn: {
            columnName: "post_id",
            onDelete: "cascade",
          }
        },
        locale: {name: "locale", type: "locale", columnName: "locale"},
        title: {name: "title", type: "string", columnName: "title"},
      }
    },
    PostSite: {
      name: "PostSite",
      primary: "id",
      primaryColumn: "id",
      tableName: "PostSite",
      fields: {
        id: {name: "id", type: "uuid", columnName: "id"},
        post: {
          name: "post",
          relation: RelationType.ManyHasOne,
          target: "Post",
          inversedBy: "sites",
          joiningColumn: {
            columnName: "post_id",
            onDelete: "cascade",
          }
        },
        site: {
          name: "site",
          relation: RelationType.ManyHasOne,
          target: "Site",
          joiningColumn: {
            columnName: "site_id",
            onDelete: "cascade"
          }
        },
        visibility: {name: "visibility", type: "siteVisibility", columnName: "visibility"},
      }
    },
    Site: {
      name: "Site",
      primary: "id",
      primaryColumn: "id",
      tableName: "Site",
      fields: {
        id: {name: "id", type: "uuid", columnName: "id"},
        name: {name: "name", type: "string", columnName: "name"},
        setting: {
          name: "setting", relation: RelationType.OneHasOne, inversedBy: "site", target: "SiteSetting", nullable: false, joiningColumn: {
            columnName: "setting_id",
            onDelete: "cascade"
          }
        }
      },
    },
    SiteSetting: {
      name: "SiteSetting",
      primary: "id",
      primaryColumn: "id",
      tableName: "SiteSetting",
      fields: {
        id: {name: "id", type: "uuid", columnName: "id"},
        url: {name: "url", type: "string", columnName: "url"},
        site: {name: "site", relation: RelationType.OneHasOne, ownedBy: "setting", target: "Site"}
      }
    },
  }
} as Schema
