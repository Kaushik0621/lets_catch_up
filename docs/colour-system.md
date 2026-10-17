# Portfolio colour studies

Three revised palettes keep the site's original warm, red/teal and blue/coral
families. Their exact shades, neutrals and supporting colours have changed.
The existing saved keys (`light`, `dark`, `bloom`) and theme cycle still work.

Open [the interactive colour lab](colour-lab.html) through the local preview
server to compare Previous and Revised on the actual portfolio. It preserves
scroll position while switching colour treatments, includes desktop and mobile
previews, and saves a preference only when **Use revised palette** is selected.
The comparison page is separate from the visitor-facing portfolio navigation.

## The three directions

| Palette / saved key | Page | Primary | Secondary | Character |
| --- | --- | --- | --- | --- |
| Paper & Copper / `light` | `#f6f3ed` | `#624337` | `#b65f3e` | Warm paper, umber and terracotta |
| Obsidian & Ember / `dark` | `#0d1112` | `#ef8075` | `#68afa2` | Charcoal, softened coral and patinated teal |
| Porcelain & Tide / `bloom` | `#eef2f3` | `#255d78` | `#bf7957` | Cool paper, deep blue and copper |

**Paper & Copper** uses related warm hues, with more neutral ink and a lighter
card surface. The reduced yellow cast separates the paper background from
umber controls and clay illustrations.

**Obsidian & Ember** gives warm coral a cool teal counterpoint. A dark charcoal
ground and progressively lighter surfaces make the cards visible. The former
bright red is softened, and broad coloured glows are reduced. Deeper brick
fills allow light button labels to stay readable.

**Porcelain & Tide** balances blue with a restrained copper accent. A cooler
background, white card surfaces and blue-grey tags make this direction more
distinct from the warm palette. Blue remains the dominant interface accent;
copper appears in smaller details.

## How colour is distributed

- Large areas use low-saturation neutrals. Small controls and city details
  carry the stronger colours, following a deliberate saturation hierarchy.
- Lightness separates page, cards, tags, borders and the three text levels.
- City colours share restrained saturation within each theme. Kolkata keeps
  clay/copper, Aberdeen sage/teal, Glasgow a greyed violet, and London coral.
  EY's gold is shared by its SVG artwork and globe marker.
- Solid actions, links and keyboard focus use separate roles. Bright accents
  do not automatically become button fills.
- Logo colours retain their existing brand treatments. The globe and landmark
  motion continue to use the shared theme tokens.

The main reading layout now uses open sections and inline labels. Raised
surface tokens remain available for navigation controls, chat and viewers.

## Surface and text roles

| Role | Paper & Copper | Obsidian & Ember | Porcelain & Tide |
| --- | --- | --- | --- |
| Raised surfaces / viewers | `#fdfcf9` | `#151c1e` | `#fcfdfc` |
| Subtle surfaces | `#ede8df` | `#20292c` | `#e2e9ec` |
| Primary text | `#292723` | `#edf1ee` | `#21323d` |
| Body text | `#514e46` | `#bdc9c6` | `#425c69` |
| Muted text | `#635b50` | `#a0b1ac` | `#4c626e` |
| Action fill | `#624337` | `#a6433d` | `#255d78` |
| Link | `#79503a` | `#f2a092` | `#245a74` |
| EY landmark | `#826128` | `#d3b882` | `#80612d` |

## Measured contrast

Calculated from browser-computed sRGB values using the W3C relative-luminance
formula. Text minima cover the page background, all three surface levels,
soft accent background and both background tints. Control minima cover both
gradient endpoints and the hover fill. These token-pair checks do not certify
an entire page or account for every translucent overlay and image.

| Palette | Primary text minimum | Body text minimum | Muted text minimum | Primary-control minimum |
| --- | ---: | ---: | ---: | ---: |
| Paper & Copper | 10.54:1 | 5.87:1 | 4.72:1 | 6.76:1 |
| Obsidian & Ember | 10.77:1 | 7.21:1 | 5.48:1 | 5.09:1 |
| Porcelain & Tide | 9.74:1 | 5.22:1 | 4.72:1 | 7.06:1 |

All four city colours exceed 4.5:1 against their page, card and tag surfaces.
Browser checks covered About, Journey and Projects in each palette; 390px
mobile layouts; saved theme selection and the theme cycle; automatic dark
mode and an explicit light preference; browser theme colour and theme-button
labels; chat controls; and matching EY colours in the SVG and WebGL views.

## References

These sources inform the colour relationships and contrast checks; the
specific palette choices are design judgements for this portfolio.

- [Adobe: hue relationships, lightness, saturation and neutral foundations](https://www.adobe.com/uk/creativecloud/design/discover/color-wheel.html)
- [W3C: contrast requirements and relative luminance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
