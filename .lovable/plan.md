# Remove unwanted bottom spacer on Calendar page

## What
Remove the empty `<div className="h-20" />` spacer at the end of the calendar scroll container in `src/pages/CalendarPage.tsx`.

## Why
The selected element is taking up unnecessary vertical space below the last month card, pushing the content farther from the bottom navigation than needed.

## How
1. Delete line 145 (`<div className="h-20" />`) from `src/pages/CalendarPage.tsx`.
2. Keep the surrounding markup intact so month scrolling and the sticky legend continue to work.
3. Verify the calendar still scrolls to the last month without the month cards being hidden behind the bottom navigation (`pb-16` padding on `<main>` remains in place to handle safe spacing).

## Files changed
- `src/pages/CalendarPage.tsx` — remove one spacer div.
