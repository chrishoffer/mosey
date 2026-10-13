# Mosey — Build Brief for Claude Code

Hand this file (plus the `screens/` folder) to Claude Code at the root of a new repo. Ask it to read this brief first, then build phase by phase. Working name is "Mosey"; keep the name in one constants file so it can change later.

---

## 1. What we're building

A personal AI agent for family travel, for parents with young kids. It plans around how families actually travel: kids' ages, nap times, bedtime, max drive per day, and laundry access. Then it keeps the trip working while you're on it.

Inspirations, by screen:
- Marriott-style search (where / when / who)
- Wanderpack-style onboarding steps and smart packing
- Yopki-style drag-and-drop day planner
- Royal Caribbean-style trip home (countdown, to-dos, add-ons)

**Bookings link out to partners (affiliate). No in-app payments.** Mosey picks the right option, then hands off to Booking.com, Viator, or Ticketmaster.

## 2. Stack

- **App:** Expo (React Native) + Expo Router + TypeScript
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **AI:** Anthropic API, called ONLY from Supabase Edge Functions. Never put the API key in the app bundle.
- **Maps:** `react-native-maps` for the in-app map. Use `Linking.openURL` deep links for turn-by-turn (see section 7).
- **State:** TanStack Query for server data, Zustand for local UI state
- **Styling:** a small theme file from the tokens below. No UI kit needed.

## 3. Design tokens (match the mockups)

```ts
export const colors = {
  ink: '#0F2237',        // primary text, dark surfaces
  ground: '#F3F6FA',     // app background
  card: '#FFFFFF',
  line: '#E3E9F1',
  lineStrong: '#DCE3EC',
  muted: '#4A5A6E',      // secondary text
  faint: '#9FB0C4',      // icons, empty checkboxes
  coral: '#C9472B',      // primary CTA
  teal: '#0B7A6E',       // success, "kid-fit", directions
  tealSoft: '#E6F3F1',
  sun: '#FFC845',        // highlight chips on dark
  sunSoft: '#FFF4D6',    // Mosey's tips
  warn: '#A33A22',       // carry-on / TSA warnings
};
export const fonts = { display: 'Sora_700Bold', body: 'Figtree_400Regular', bodyBold: 'Figtree_700Bold' };
export const radius = { chip: 999, card: 16, cardLg: 20, button: 14 };
// Touch targets >= 44px. Phone frame reference: 390 x 844.
```
Load fonts with `@expo-google-fonts/sora` and `@expo-google-fonts/figtree`.

## 4. Screens → routes

The HTML for each mockup screen is in `screens/` as a visual reference. Rebuild each one as native components, not a WebView.

| # | Mockup file | Route | Notes |
|---|---|---|---|
| 1 | Main.dc.html | `/(plan)/search` | Where / when / who, kids' ages chips, pace, nap, bedtime, max drive |
| 2 | Agenda.dc.html | `/(plan)/agenda` | Step 2 of 4, multi-select activity tiles |
| 3 | Results.dc.html | `/(plan)/stays` | Stays ranked by Kid-fit score, with a "why Mosey picked it" line |
| 4 | Planner.dc.html | `/trip/[id]/days` | Day tabs, timeline, protected nap block, draggable items |
| 5 | Map.dc.html | `/trip/[id]/map` | Pins per day, bottom sheet, Directions + "Open route in Maps" |
| 6 | TripHome.dc.html | `/trip/[id]` | Countdown hero, to-dos, "Add to your trip" tiles |
| 7 | Agent.dc.html | `/trip/[id]/ask` | Quick actions (Meltdown, Raining, Hungry, Late), chat, replan card |
| 8 | Book.dc.html | `/trip/[id]/book` | Booking checklist, partner link-outs, progress |
| 9 | Explore.dc.html | `/trip/[id]/explore` | Natural-language search, filters, "Fits your Fri 3:15 opening", Add to day |
| 10 | Pack.dc.html | `/trip/[id]/pack` | Per-person tabs, laundry toggle, learned-from-last-trip, carry-on warnings, voice add |

Bottom tabs once a trip exists: **Trip · Days · Explore · Pack · Ask**.

## 5. Data model (Supabase)

```
families        id, owner_id, name, home_location
travelers       id, family_id, label, age, is_adult, nap_start, nap_end, bedtime
preferences     family_id, pace (easy|balanced|packed), max_drive_minutes
trips           id, family_id, title, destination, lat, lng, start_date, end_date,
                agenda (text[]), laundry_access (bool), status
stays           id, trip_id, name, partner, partner_url, kid_fit, reasons, lat, lng, booked (bool)
plan_items      id, trip_id, day (date), start_time, duration_min, kind (activity|meal|nap|travel),
                title, place_name, lat, lng, ages_ok (int[]), partner, partner_url, booked (bool), locked (bool)
pack_items      id, trip_id, traveler_id (null = shared), label, qty, reason, packed (bool),
                carry_on_warning (text), pack_last (bool)
pack_history    family_id, label, used (bool), trip_id      -- powers "learned from last trip"
bookings        id, trip_id, partner, confirmation_code, raw_email_id, parsed (jsonb)
agent_messages  id, trip_id, role, content, created_at
```
Turn on Row Level Security everywhere, scoped by `family_id` → `families.owner_id = auth.uid()`.

## 6. The agent (Edge Functions + Claude tool use)

One Edge Function, `agent`, receives the trip context and the user's message. It runs a tool-use loop with Claude. The tools are your own Edge Function calls:

- `search_stays(destination, dates, travelers, filters)` → partner content + Kid-fit score
- `search_activities(location, ages, window, indoor?, max_minutes)` → candidates
- `build_day_plan(trip_id, day)` → respects nap, bedtime, pace, max drive
- `replan(trip_id, situation)` → for Meltdown, Raining, Hungry, Late. Returns a proposal. **Never auto-applies**; the user taps "Update my day".
- `packing_list(trip_id)` → from agenda, weather, laundry access, traveler ages, pack_history
- `get_weather(lat, lng, dates)`

Rules for the system prompt:
- Protect nap and bedtime blocks unless the parent overrides them.
- Every suggestion includes a one-line "why", in plain parent language.
- Never invent prices, hours, or availability. Pull them from a tool or say "check on [partner]".
- Kid-fit score = age fit + duration vs. attention span + distance + facilities (restrooms, stroller, shade). Document the formula in code.

## 7. Integrations

**Link-out booking (affiliate).** Store each partner's affiliate ID in env vars. Build the deep link server-side, then open it with `Linking.openURL`. Start with:
- Hotels: Booking.com affiliate / Demand API (content + redirect)
- Excursions: Viator affiliate API (content; booking happens on viator.com)
- Events: Ticketmaster Discovery API (listings) + affiliate links
- Later: Traveltek for cruises (needs agency cruise credentials), Duffel for flights

Apply to each program early. Most want to see a live app.

**Maps and directions.** Give the user a one-time setting for Apple Maps vs. Google Maps.
- Apple single stop: `http://maps.apple.com/?daddr=LAT,LNG&dirflg=d`
- Google single stop: `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&travelmode=driving`
- Google whole-day route: add `&waypoints=LAT,LNG|LAT,LNG` for the middle stops
- Use `dirflg=w` / `travelmode=walking` when the next stop is under about 10 minutes on foot.

**Confirmation email ingestion ("Mosey reads your confirmations").** Give each family a forwarding address, like `trips+<familyId>@yourdomain`. Point it at an inbound-email webhook (Postmark or Mailgun inbound) that calls an Edge Function. That function uses Claude to extract partner, date, time, place, and confirmation code, then marks the matching `plan_items` or `stays` row as booked. Optional later: a Gmail connection.

**Voice.** Use `expo-speech-recognition` (or record audio and transcribe server-side) for the Pack and Ask mic buttons.

## 8. Build order

1. **Skeleton:** Expo Router app, theme, fonts, tabs, Supabase auth (Sign in with Apple + email).
2. **Static screens:** rebuild all 10 screens from `screens/` with mock JSON data. Match the mockups closely.
3. **Data:** Supabase schema + RLS. Wire search → agenda → trip creation.
4. **Agent v1:** `build_day_plan` + `packing_list` working end to end with mock activity data.
5. **Map:** `react-native-maps` pins per day + direction deep links.
6. **Agent v2:** `replan` quick actions on the Ask screen, with a proposal card and an accept step.
7. **Partners:** one affiliate integration at a time, starting with Viator content for Explore.
8. **Email ingestion** for confirmations.
9. TestFlight with 5–10 families. Watch which screens they actually open.

## 9. First prompt to give Claude Code

> Read MOSEY_BUILD_BRIEF.md and the files in /screens. Create an Expo Router + TypeScript app named mosey with the theme from section 3 and the tab structure from section 4. Build phase 1 and phase 2 only: every screen as native components with mock data, matching the mockups. Don't call any APIs yet. When done, list anything in the mockups you couldn't match.
