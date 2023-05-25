# Linking Contember admin repository directly in you your project

It is possible to alias `@contember/*` packages to your local admin repository
to debug Admin issues. Such setup is handy in cases when replication is hard or
the issue is tightly coupled with your project data.

To debug with local version of Contember Admin:

1. Add abs path as volume to `./docker-compose.yaml` `services` > `admin` > `volumes`:
  ```yaml
  services:
    admin:
      volumes:
        # Add:
        - /absolute/path/to/contember-admin:/absolute/path/to/contember-admin
  ```
2. Add `resolve` section to `./admin/vite.config.ts`
  ```ts
  export default defineConfig({
    // [...]
    resolve: {
      // React alias is required.
      // You can add more sub-packes of `@contember/*` besides `admin` and `ui`
      alias: [{
        find: '@contember/admin',
        replacement: '/absolute/path/to/contember-admin/packages/admin/src/index.ts',
      }, {
        find: '@contember/ui',
        replacement: '/absolute/path/to/contember-admin/packages/ui/src/index.ts',
      }, {
        find: 'react',
        replacement: '/absolute/path/to/contember-admin/node_modules/react',
      }],
    },
    // [...]
  })
  ```
3. In your `index.css`
  ```css
  // Replace:
  // @import '../node_modules/@contember/admin/dist/index.css'
  // with:
  @import "/absolute/path/to/contember-admin/packages/admin/src/index.css";
  ```
