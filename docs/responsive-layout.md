# Responsive portfolio layout

`assets/css/editorial.css` owns page composition and is loaded after the
shared colour, animation and viewer styles. The introduction spans the page;
work reads as an open timeline; projects use a featured case followed by
fluid columns. Facts and technology labels are inline rather than panels.

The page overflow had two sources: 330px grid minima on narrow screens, and
oversized globe / decorative layers contributing to document scroll width.
Reading grids now use `minmax(0, 1fr)`. Decorative content is clipped locally
in the hero and journey with `overflow: clip`, preserving the sticky globe.
The viewport also uses `overflow-x: clip` as a guard. Browser checks disable
that guard to verify the actual layout still fits.

- Above 1100px, navigation is a horizontal masthead. Compact layouts use a
  vertical disclosure menu with Escape, outside-click and link-close support.
- At 1024px and above, the globe has a fluid lane beside the timeline. Globe
  placement stays in a CSS-defined frame. Hover and scroll change its camera
  orientation, never its position. The city scene also has one viewport-based
  position; its lane reads the resolved margin rather than parsing a CSS clamp.
- Below 1024px, each role carries a compact map, precise marker, animated
  landmark and skyline. Only the currently read role runs its scene.
- Small screens stack reading columns and allow long labels and addresses
  to wrap. The existing certificate and chat viewers remain available.
- Reading surfaces reveal with vertical movement. The globe and portrait
  retain their depth, and reduced-motion preferences are respected.

City scenes in `assets/js/city-scenes.js` use one SVG and one shared horizon
for the skyline, animated landmark, river and transport. The floating scene
overlaps outgoing and incoming layers during city changes, retaining the
current scene when successive roles share a city. Globe entrance and exit
opacity follow section visibility continuously, independent of row reveals.

Validation covers every section at 20 widths from 320px to 2560px, with the
viewport guard disabled; menu interactions; expanded roles; keyboard-opened
certificates; chat; all three palettes; and skyline clearance from the
masthead, viewport edges and chat launcher.
