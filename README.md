# Nutrition Kitchen

Build a recipe from raw materials and get its nutrition declaration as it would appear on a food
package, under the EU food information regulation (Regulation (EU) No 1169/2011, LMIV in German).

Type "Mehl", pick it, type 500, done. The label updates while you type. Free, no account needed;
an account only exists to save and share recipes.

Live at [nutrition-kitchen.fh-softdev.de](https://nutrition-kitchen.fh-softdev.de). German first, English too.

> [!WARNING]
> In development. The label is no legal advice: it stays the responsibility of the food business.

## Built on

| Package                                                                  | Role                                                                                   |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| [`@thereforejs/nutrition`](https://github.com/thereforejs/nutrition)     | calculates the declaration: per 100 g, per piece, % reference intake, rounding, report |
| [`@thereforejs/foods`](https://github.com/thereforejs/foods)             | values of over 7,100 foods per 100 g (BLS 4.0), served by the app's server             |
| [`@thereforejs/food-finder`](https://github.com/thereforejs/food-finder) | finds a food by what people type, in German and English                                |

Plus [Nuxt](https://nuxt.com) and [Nuxt UI](https://ui.nuxt.com).

## Develop

Requires Node 22 or newer and pnpm.

```sh
pnpm install
pnpm dev
```

| Script                       | Does                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm verify`                | everything below, cheap to expensive; must exit 0 before a commit                            |
| `pnpm fmt`, `pnpm fmt:check` | format with oxfmt                                                                            |
| `pnpm lint`                  | lint with oxlint                                                                             |
| `pnpm typecheck`             | `nuxt typecheck`                                                                             |
| `pnpm test`                  | unit and property tests (Vitest, fast-check)                                                 |
| `pnpm test:e2e`              | Playwright on a production build: Chromium, WebKit, mobile WebKit, and api and bundle checks |

## Data

Nutrient values: Max Rubner-Institut, Bundeslebensmittelschlüssel (BLS) 4.0, as an extract,
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), via `@thereforejs/foods`. The original is
at [blsdb.de](https://www.blsdb.de).

## License

Code: [MIT](./LICENSE).
