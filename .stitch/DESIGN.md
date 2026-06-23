# Design System: Baspana.kz (Kazakhstan Roommate & Apartment Finder)
**Skill:** stitch-design-taste

---

## Configuration — Vibe Dials
These dials control the design parameters for Google Stitch to ensure all generated screens align perfectly with the mobile-first, high-contrast, structured aesthetic of Baspana.kz.

| Dial | Level | Description |
|------|-------|-------------|
| **Creativity** | `8` | Expressive display typography (Unbounded), lowercased main action titles, sliding pill mode toggles, and asymmetric roommate/apartment grid parameters. |
| **Density** | `6` | Compact mobile-optimized layouts. Dense parameters inside 338px cards. Maximum screen usage on mobile viewports with no trailing space. |
| **Variance** | `9` | Highly asymmetric visual templates depending on AppMode: Apartment mode uses landscape media headers and split CTAs; Roommate mode features square avatars, profile info grids, and full-width CTAs. |
| **Motion Intent** | `6` | Soft spring-like transitions (`duration-200 ease-in-out`), and custom sliding animation for top navigation modes. |

---

## 1. Visual Theme & Atmosphere
Baspana.kz is a mobile-first, high-contrast, zero-wiggle roommate and apartment finder designed specifically for viewports in Kazakhstan. The interface is optimized to feel solid and modern, featuring an expressive geometric display font (**Unbounded**) contrasted with a clean body font (**Montserrat**). The atmosphere is highly structured, clinical yet warm, with functional layouts that adapt dynamically to two distinct search modes. All screens are designed around a strict 338px width grid on mobile and enforce a strict boundary layout (`overflow-x: hidden`) to prevent horizontal screen shake.

---

## 2. Color Palette & Roles (Centralized HEX Design System)
All interface elements must strictly adhere to the following color palette. Any custom neon/purple gradients are strictly banned.

* **Canvas Light** (`#F7F7F7`) — Primary page background surface in light mode.
* **Canvas Dark** (`#202020`) — Primary page background surface in dark mode.
* **Pure Surface Light** (`#FFFFFF`) — Card, input, and dropdown background in light mode.
* **Pure Surface Dark** (`#313131`) — Card, input, dropdown, and modal container background in dark mode.
* **Nav Black** (`#000000`) — Primary color for navigation bars, active mode toggle container, and dominant typography headers in light mode.
* **Brand Blue** (`#007BFF`) — Primary accent color. Used for high-priority CTA buttons (WhatsApp, Edit, Advertise), active navigation tab highlights, active indicators, and focus rings.
* **Red Accent** (`#FF3662`) — Active favorite heart icons, exit buttons, delete actions, input validation errors, and struck-through old pricing.
* **Muted Steel** (`#9D9D9D`) — Inactive states, placeholder texts, secondary information hints, and timestamps.
* **Whisper Border** (`rgba(226, 232, 240, 0.5)` / `rgba(38, 38, 38, 0.5)`) — Card borders and structural 1px dividers.

---

## 3. Typography Rules
* **Display / Headers / Buttons:** `Unbounded` — A bold, geometric display font. Used track-tight (`-0.025em`) and lowercase for main headers (`лента`, `избранное`, `профиль`, `корзина`, `объявление`), mode toggle text, and action buttons.
* **Body / Details / Descriptions:** `Montserrat` — A highly readable, clean sans-serif. Used for item parameters, detail texts, input labels, and secondary copy.
* **Mono / Numbers:** Standard sans-serif or Monospace. Numbers formatted with dynamic thousands space separator (e.g., `150 000 ₸`), keeping state values numeric.
* **Scale:**
  * Display titles: `clamp(1.125rem, 5vw, 1.5rem)` (not screaming, lowercase)
  * Secondary Titles / Price: `17px` bold
  * Body copy: `12px` / `13px` / `14px`
  * Tab / Meta text: `12px`
* **Banned:** `Inter` is banned for display elements. Generic browser serif font stacks are banned.

---

## 4. Component Stylings

### Top Mode Toggle
* **Structure:** A centered black capsule (`#000000`, height 41px, rounded 54px) containing a sliding white pill for the active mode.
* **Interactions:** Activating "ищу квартиру" or "ищу соседа" shifts the white pill smoothly (`transition-all duration-300 ease-in-out`). Active text turns bold black, inactive text is normal white with 60% opacity.

### Bottom Navigation Bar
* **Structure:** Fixed bottom bar in pure Nav Black (`#000000`, border-t with `#27272A`), housing 5 tabs: Лента, Избранное, Добавить (+), Просмотрено, Профиль.
* **Interactions:** The active tab is highlighted with a solid Brand Blue (`#007BFF`) circle containing a white icon. Inactive tabs are colored `#9D9D9D` and scale slightly on hover.

### Listing Cards (Width: 338px)
* **Apartment Mode:**
  * **Media:** Top landscape image header (height 87px) with "В ТОПЕ" banner (`#007BFF`) and heart icon.
  * **Content:** Two-column grid of 8 tags with icons (Location, Rooms, Gender, Total, Searching, Age, Deposit, Contract).
  * **Actions:** "Ватцап" button (`55%` width, `#007BFF`), "2 гис" button (`40%` width, `#F8F8F8` background with `#C7C7C7` border).
* **Roommate Mode:**
  * **Media:** Square author profile avatar (72x72px, rounded 14px) next to price, date, and heart.
  * **Content:** Two-column parameter grid matching the apartment card (excluding address link parameter).
  * **Actions:** "Ватцап" button (`100%` width, `#007BFF`). No "2 гис" map button.

### Form Inputs & Dropdowns
* **No Manual Typing:** Fields like City, District, Gender, Rooms, Deposit, and Contract are strict custom dropdowns; manual input is disabled (`readOnly` or custom UI lists).
* **Disabled States:** If the selected city has no districts, the District dropdown is disabled (`disabled={true}`), styled gray (`bg-zinc-200 dark:bg-zinc-800`, `opacity-50`), and bypasses validation.
* **Errors:** Invalid fields trigger instant red border outlines (`border-[#FF3662]`), which automatically revert to neutral styling on correction.
* **Smart Currency Input:** Budget/Deposit inputs dynamically format typing on the fly by adding spaces as thousands separators (e.g. `150000` -> `150 000`) while maintaining raw numbers in the code state.

### Promote Screen (Tariffs)
* **Header:** Back button `‹` and title `рекламировать` inside a black capsule.
* **Tariffs Stack:**
  1. `3 дня в ТОПЕ` (Light: white background, blue border; Dark: solid blue background. Price `190 ₸`, old price `390 ₸` crossed in red).
  2. `7 дней в ТОПЕ` (Light: white background, gray border; Dark: solid blue background. Price `490 ₸`, old price `690 ₸` crossed in red).
  3. `30 дней в ТОПЕ` (Light: purple background and border, price `590 ₸`; Dark: solid purple background, transparent price badge. Old price `790 ₸` crossed in red).
* **CTA Button:** `Оплатить` button in bright raspberry/magenta color, full-width (100%), with a circular icon.

---

## 5. Layout Principles
* **Mobile-First Contained Canvas:** All layouts are designed within a max-width container (~450px) to simulate a native mobile application.
* **Zero-Wiggle:** CSS rule `html, body { overflow-x: hidden; }` is strictly enforced to prevent horizontal page scrolling.
* **Sticky Navigation:** Mode toggle and filters are grouped into a single container намертво закрепленный сверху (`sticky top-0 z-50`), ensuring they never scroll away.
* **Image Aspect Ratios:** All images and avatars must use `object-fit: cover` and `object-position: center` to preserve proportions without distortion.

---

## 6. Motion & Interaction
* **Transitions:** Smooth CSS transitions (`transition-all duration-200 ease-in-out`) are required on all interactive elements (hover states, modal overlays, active tab highlights, theme switchers).
* **Auth Guard (Auth Wall):** If the user is unauthenticated, clicking high-value actions (WhatsApp, Favorite, Add `+`, Pay, Edit) instantly blocks execution and redirects the user to the `Профиль` tab.

---

## 7. Anti-Patterns (Banned AI Tells)
* **No Emojis** — Never use emojis anywhere in the UI text (except the single cake icon `🎂` inside the roommate age field).
* **No `Inter` Font** — Never use `Inter` for headers or action labels.
* **No Pure Black Backgrounds/Texts** — `#000000` is reserved exclusively for navigation/toggle elements. Content texts must use Off-Black (`#18181B`) or zinc neutral shades.
* **No Neon Outer Glows** — Avoid glow shadows and oversaturated background boxes.
* **No 2GIS Button on Roommate Cards** — Map buttons are banned on roommate listings.
* **No Hardcoded Prices** — All prices, including the free publication `0 ₸` button, must be derived dynamically from the DB or state.
* **No Horizontal Scrolling** — Never allow overflow-x scrollbars.
* **No AI Copywriting Clichés** — Avoid words like "Seamless", "Elevate", "Unleash", "Next-Gen". Keep the UI copy clean, simple, and functional.
