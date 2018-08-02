import { OnDelete, RelationType, Schema } from "../src/content-schema/model"

const schema: Schema = {
  enums: {
    siteVisibility: ["visible", "hidden"],
    locale: ["cs", "en"],
  },
  entities: {
    Author: {
      name: "Author",
      pluralName: "Authors",
      primary: "id",
      primaryColumn: "id",
      tableName: "Author",
      unique: [],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id", nullable: false},
        name: {name: "name", type: "string", columnName: "name", nullable: false},
        posts: {name: "posts", relation: RelationType.OneHasMany, target: "Post", ownedBy: "author"}
      }
    },
    Category: {
      name: "Category",
      pluralName: "Categories",
      primary: "id",
      primaryColumn: "id",
      tableName: "Category",
      unique: [],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id", nullable: false},
        locales: {name: "locales", relation: RelationType.OneHasMany, target: "CategoryLocale", ownedBy: "category"},
        posts: {name: "posts", relation: RelationType.ManyHasMany, target: "Post", ownedBy: "categories"},
      }
    },
    CategoryLocale: {
      name: "CategoryLocale",
      pluralName: "CategoryLocales",
      primary: "id",
      primaryColumn: "id",
      tableName: "CategoryLocale",
      unique: [],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id", nullable: false},
        name: {name: "name", type: "string", columnName: "name", nullable: false},
        locale: {name: "locale", type: "locale", columnName: "locale", nullable: false},
        category: {
          name: "category",
          relation: RelationType.ManyHasOne,
          target: "Category",
          inversedBy: "locales",
          nullable: false,
          joiningColumn: {
            columnName: "category_id",
            onDelete: OnDelete.restrict,
          }
        },
      }
    },
    Post: {
      name: "Post",
      pluralName: "Posts",
      primary: "id",
      primaryColumn: "id",
      tableName: "Post",
      unique: [],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id", nullable: false},
        publishedAt: {name: "publishedAt", type: "datetime", columnName: "publishedAt", nullable: false},
        author: {
          name: "author",
          relation: RelationType.ManyHasOne,
          target: "Author",
          nullable: false,
          joiningColumn: {columnName: "author_id", onDelete: OnDelete.cascade},
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
              onDelete: OnDelete.cascade
            },
            inverseJoiningColumn: {
              columnName: "category_id",
              onDelete: OnDelete.cascade
            }
          }
        },
      }
    },
    PostLocale: {
      name: "PostLocale",
      pluralName: "PostLocales",
      primary: "id",
      primaryColumn: "id",
      tableName: "PostLocale",
      unique: [{fields: ["post", "locale"], name: "post_locale"}],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id", nullable: false},
        post: {
          name: "post",
          relation: RelationType.ManyHasOne,
          target: "Post",
          inversedBy: "locales",
          nullable: false,
          joiningColumn: {
            columnName: "post_id",
            onDelete: OnDelete.cascade,
          }
        },
        locale: {name: "locale", type: "locale", columnName: "locale", nullable: false},
        title: {name: "title", type: "string", columnName: "title", nullable: false},
      }
    },
    PostSite: {
      name: "PostSite",
      pluralName: "PostSites",
      primary: "id",
      primaryColumn: "id",
      tableName: "PostSite",
      unique: [],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id", nullable: false},
        post: {
          name: "post",
          relation: RelationType.ManyHasOne,
          target: "Post",
          inversedBy: "sites",
          nullable: false,
          joiningColumn: {
            columnName: "post_id",
            onDelete: OnDelete.cascade,
          }
        },
        site: {
          name: "site",
          relation: RelationType.ManyHasOne,
          target: "Site",
          nullable: false,
          joiningColumn: {
            columnName: "site_id",
            onDelete: OnDelete.cascade
          }
        },
        visibility: {name: "visibility", type: "siteVisibility", columnName: "visibility", nullable: false},
      }
    },
    Site: {
      name: "Site",
      pluralName: "Sites",
      primary: "id",
      primaryColumn: "id",
      tableName: "Site",
      unique: [],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id", nullable: false},
        name: {name: "name", type: "string", columnName: "name", nullable: false},
        setting: {
          name: "setting", relation: RelationType.OneHasOne, inversedBy: "site", target: "SiteSetting", nullable: false, joiningColumn: {
            columnName: "setting_id",
            onDelete: OnDelete.cascade
          }
        }
      },
    },
    SiteSetting: {
      name: "SiteSetting",
      pluralName: "SiteSettings",
      primary: "id",
      primaryColumn: "id",
      tableName: "SiteSetting",
      unique: [],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id", nullable: false},
        url: {name: "url", type: "string", columnName: "url", nullable: false},
        site: {name: "site", relation: RelationType.OneHasOne, ownedBy: "setting", nullable: false, target: "Site"}
      }
    },
  }
}

export default schema
