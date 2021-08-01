---
'@contember/admin': patch
'@contember/admin-i18n': patch
'@contember/admin-sandbox': patch
'@contember/binding': patch
'@contember/client': patch
'@contember/react-client': patch
'@contember/react-multipass-rendering': patch
'@contember/react-utils': patch
'@contember/ui': patch
'@contember/utils': patch
'@contember/vimeo-file-uploader': patch
---

Completely revamped the build system. All packages now use the `exports` field and ship separate production and development bundles as well as combined single `d.ts` files.
