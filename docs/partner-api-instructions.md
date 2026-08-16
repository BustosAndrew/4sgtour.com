# 4SG Tour — Latest Trips API

Read-only access to the most recently published golf trips on 4sgtour.com.

```
GET https://4sgtour.com/api/v1/trips/latest
```

## 1. Your API key

4SG Tour issues your key from their admin dashboard and sends it to you. It
looks like `4sg_live_...` and is shown to them **once** — they cannot look it
up again, only replace it.

- Store it as a server-side secret (environment variable or secret manager).
- Never ship it in browser JavaScript, a mobile app bundle, or a public repo —
  anyone holding the key can read this feed as you.
- If it leaks, tell 4SG Tour. They revoke it, which takes effect on the next
  request, and issue a replacement.

Send it as a bearer token on every request:

```
Authorization: Bearer 4sg_live_your_key_here
```

## 2. Request

```bash
curl "https://4sgtour.com/api/v1/trips/latest?limit=20&locale=en" \
  -H "Authorization: Bearer 4sg_live_your_key_here"
```

All parameters are optional.

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `limit` | integer, 1–50 | `10` | How many trips to return. |
| `locale` | `en`, `ko`, `de` | `en` | Language of the text fields. Falls back to English wherever a translation is missing. |
| `continent` | string | — | Exact-match filter, e.g. `Europe`, `Asia`, `North America`. |
| `since` | ISO 8601 timestamp | — | Only trips created strictly after this instant, e.g. `2026-08-01T00:00:00Z`. |
| `include_custom` | `true`, `false` | `false` | Also return custom trips. Requires that your key has been granted access — see [Custom trips](#6-custom-trips). |

Trips are always ordered newest-created first.

## 3. Response

`200 OK`

```json
{
  "data": [
    {
      "id": "6f0a2f5e-1c34-4a9b-9f21-2b7c5d8e4a10",
      "slug": "st-andrews-links-week-1755201600000",
      "url": "https://4sgtour.com/trips/st-andrews-links-week-1755201600000",
      "title": "St Andrews Links Week",
      "description": "Seven nights on the Fife coast with four championship rounds.",
      "overview_content": "Full trip overview in long form…",
      "highlights": ["Old Course tee time", "Caddie included", "Airport transfers"],
      "location": "St Andrews, Scotland",
      "continent": "Europe",
      "is_custom": false,
      "price_regular": 4850,
      "show_from_price": true,
      "deposit_percentage": 30,
      "max_guests": 12,
      "min_days": 5,
      "max_days": 9,
      "min_days_advance": 21,
      "refund_policy": "Full refund up to 60 days before departure…",
      "images": [
        "https://blob.vercel-storage.com/…/old-course-1.jpg",
        "https://blob.vercel-storage.com/…/old-course-2.jpg"
      ],
      "courses_photo_url": "https://blob.vercel-storage.com/…/courses.jpg",
      "room_photo_url": "https://blob.vercel-storage.com/…/room.jpg",
      "packages": [
        {
          "id": "b1c2d3e4-5f60-4718-9a2b-3c4d5e6f7081",
          "name": "Twin share, 4 rounds",
          "description": "Shared room, four rounds, breakfast daily.",
          "price": 4850,
          "availability": "available",
          "quantity": 8,
          "participants_per_booking": 2
        }
      ],
      "created_at": "2026-08-14T09:12:33.104Z",
      "updated_at": "2026-08-14T09:40:02.551Z"
    }
  ],
  "meta": {
    "count": 1,
    "limit": 20,
    "locale": "en",
    "currency": "USD",
    "include_custom": false,
    "latest_created_at": "2026-08-14T09:12:33.104Z"
  }
}
```

### Field notes

| Field | Notes |
| --- | --- |
| `url` | The live trip page. Safe to link customers to. |
| `is_custom` | `false` for a published trip, `true` for a custom one. Always present, so you can branch on it. |
| `price_regular` | Headline display price for the trip. When `show_from_price` is `true`, 4SG Tour presents it as a "from" price. |
| `packages[].price` | The bookable price. **Only packages carry a real price** — the trip-level number is for display. |
| `deposit_percentage` | Percent due at booking. `null` means the 30% default applies. |
| `min_days_advance` | Minimum days between booking and departure. |
| `quantity` | Remaining places for that package, or `null` when unlimited. |
| `highlights` | Ordered array; may be empty. |
| `images` | Gallery URLs in display order; may be empty. |
| Text fields | Returned in the requested `locale`, falling back to English. |
| Money | All amounts are USD, as plain numbers (not cents). |
| Timestamps | ISO 8601, UTC. |

Fields may be added over time. Ignore unknown fields rather than failing on
them; existing fields will not change meaning without notice.

## 4. Errors

Every error returns JSON with a human-readable `error` and a stable `code` to
branch on.

```json
{ "error": "This API key has been revoked.", "code": "revoked_token" }
```

| Status | `code` | Meaning |
| --- | --- | --- |
| 400 | `invalid_limit` | `limit` is not an integer between 1 and 50. |
| 400 | `invalid_locale` | `locale` is not `en`, `ko`, or `de`. |
| 400 | `invalid_since` | `since` is not a valid ISO 8601 timestamp. |
| 400 | `invalid_include_custom` | `include_custom` is not `true` or `false`. |
| 401 | `missing_token` | No `Authorization: Bearer` header was sent. |
| 401 | `invalid_token` | The key is not recognised. |
| 401 | `revoked_token` | The key was valid but has been revoked. |
| 403 | `custom_trips_not_permitted` | You asked for custom trips with a key that has not been granted them. |
| 500 | `server_error` | Something failed on our side. Retry with backoff. |

## 5. Keeping in sync

Responses are not cached (`Cache-Control: no-store`), so every call returns
current data. There are no webhooks — poll.

1. On your first sync, call with `limit=50` and no `since`.
2. Store `meta.latest_created_at` from the response.
3. On each later sync, pass it back as `since` to get only what is new.

Hourly polling is plenty; trips are published a few times a week. There is no
hard rate limit today, but sustained high-frequency polling may lead 4SG Tour
to revoke the key, so please keep to a reasonable cadence.

## 6. Custom trips

A **custom trip** is a one-off itinerary that 4SG Tour builds for an individual
customer. These do not appear on the public website, and they are excluded from
this feed by default.

If your agreement covers them, ask 4SG Tour to enable custom trips on your key,
then pass `include_custom=true`:

```bash
curl "https://4sgtour.com/api/v1/trips/latest?include_custom=true" \
  -H "Authorization: Bearer 4sg_live_your_key_here"
```

The response then contains both kinds, newest first. Every trip carries an
`is_custom` boolean so you can tell them apart — and `meta.include_custom`
reflects what the request actually asked for.

Two things to be aware of:

- Without the parameter you get published trips only, even if your key is
  permitted them. The permission is a ceiling, not a default.
- With the parameter but **without** the permission you get
  `403 custom_trips_not_permitted` — the request fails rather than quietly
  returning a shorter list, so a misconfiguration is visible immediately.

Custom trips describe real customer arrangements. Treat them as confidential:
do not publish them to open listings, search indexes, or anywhere a person
outside your integration could reach them.

## 7. Scope

The endpoint is read-only. There is no write, booking, or availability-hold
API at this time.

## Questions

Contact 4SG Tour at info@4sgtour.com.
