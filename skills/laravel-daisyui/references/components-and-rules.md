# daisyUI components, colours, and the vendor's own rules

daisyUI publishes an official agent-targeted document at `https://daisyui.com/llms.txt` (~79 KB,
self-declares `version: 5.7.x`). The rules below are **daisyUI's own**, reproduced so they are
available without a fetch. When something here conflicts with the fetched file, **the fetched file
wins** — and if its declared version differs from `package.json`, the installed version wins.

Refresh this file from the source whenever daisyUI ships a new major.

## The vendor's usage rules

1. To style an element, add daisyUI class names — the component class plus the applicable **part** and
   **modifier** classes.
2. If daisyUI cannot express a change, use Tailwind utilities — e.g. `btn px-10` for custom padding.
3. If specificity blocks a change, append `!` to the Tailwind utility (`btn bg-red-500!`). **Last
   resort only; do not use it frequently.**
4. If daisyUI has no applicable component, build one from Tailwind utilities.
5. When using `flex`/`grid` for layout, add responsive utility prefixes.
6. **Use only current daisyUI class names or Tailwind utility classes.**
7. **If custom CSS is not necessary, do not write it.**
8. Placeholder images: `https://picsum.photos/200/300` at the needed dimensions.
9. If a custom font is not necessary, do not add one.
10. If `bg-base-100 text-base-content` is not necessary, do not add it to `<body>`.
11. For design decisions, follow the Refactoring UI methods.
12. **If the user does not request a variant or colour, use the default variant.** If they ask for a
    button, use `btn` — not `btn btn-primary`.

Rule 12 and rule 3 are the two most commonly violated: agents add a colour nobody asked for, and reach
for `!` before trying the supported approach.

## Colour names and the colour rules

| Name | Meaning |
| --- | --- |
| `primary` / `primary-content` | Main brand colour / foreground on it |
| `secondary` / `secondary-content` | Optional secondary brand colour |
| `accent` / `accent-content` | Optional accent colour |
| `neutral` / `neutral-content` | Dark neutral for areas without saturated colour |
| `base-100` | Page base surface for blank backgrounds |
| `base-200` | Darker base shade giving elevation |
| `base-300` | Still darker base shade, more elevation |
| `base-content` | Foreground on a base colour |
| `info` / `success` / `warning` / `error` (+ `-content` each) | Semantic state colours |

Colour rules (the vendor's):

1. daisyUI adds semantic colour names to Tailwind's colours.
2. Use them in utilities as you would any Tailwind colour: `bg-primary`.
3. Each value is a **variable**, so it changes with the theme.
4. **Do not use `dark:` with daisyUI colour names** — the theme already handles it.
5. **Use only daisyUI colour names where possible**, so colours follow the theme automatically.
   Hardcoding `bg-blue-500` breaks theme switching; that is the whole reason this layer exists.

## Class categories

Every daisyUI 5 class belongs to one of these (category names are documentation-only — never write
them in code): `component` · `part` · `style` · `behavior` · `color` · `size` · `placement` ·
`direction` · `modifier` · `variant` (a `variant:utility-class` prefix).

## Component taxonomy (65 components)

Use this to select a component by **meaning**, then confirm its exact class structure in the fetched
`llms.txt` or the docs page for the installed version.

```
Accordion · Alert · Aura · Avatar · Badge · Breadcrumbs · Button · Calendar · Card · Carousel ·
Chat · Checkbox · Collapse · Countdown · Diff · Divider · Dock · Drawer · Dropdown · FAB · Fieldset ·
File input · Filter · Footer · Hero · Hover 3D · Hover gallery · Indicator · Input · Join · Kbd ·
Label · Link · List · Loading · Mask · Megamenu · Menu · Browser mockup · Code mockup · Phone mockup ·
Window mockup · Modal · Navbar · OTP · Pagination · Progress · Radial progress · Radio · Range ·
Rating · Select · Skeleton · Stack · Stat · Status · Steps · Swap · Tab · Table · Text rotate ·
Textarea · Theme controller · Timeline · Toast · Toggle · Tooltip · Validator
```

Note that some are easy to miss and hard to hand-roll: **Validator**, **Fieldset**, **Filter**,
**Dock**, **Swap**, **Theme controller**, **Radial progress**, the four **mockup** components, and
**Hover 3D** / **Text rotate**.

## Component discovery protocol (the vendor's)

Follow this order before writing daisyUI markup:

1. Identify the intended **function, behaviour, and layout** in the request — not just the literal
   words.
2. Use the component list above to select candidate components.
3. If the choice is unclear, read the guides for the candidates that could satisfy the request.
4. Compare each candidate's description, behaviour, syntax, and rules against the request.
5. Select the best component (or combination) and obey all of its constraints.
6. Use that component's exact structure and constraints.

The vendor's own emphasis: **match the meaning even when the words differ from component names.** A
component with an unrelated name can be the right choice — "collapsible FAQ" is `Accordion`, "star
rating" is `Rating`, "file drop zone" is `File input`.

## Version boundary

daisyUI **5 requires Tailwind CSS 4**; **4.x targets Tailwind 3**. That pairing is a hard constraint —
see `laravel-daisyui`. daisyUI 5 also smoothed `base-100/200/300` handling, so background overrides
written for 4.x are often redundant.

## If the component list changes

The taxonomy above is verified against `5.7.x`. On a new daisyUI major, re-fetch `llms.txt` and update
both this list and the colour table. A stale component list is worse than none, because it teaches
classes that no longer exist.
