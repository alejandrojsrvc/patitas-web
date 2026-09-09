---
target: src/app/checkout
total_score: 26
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 4
target_identity: "file:/Users/alejandrojesussojoruiz/projects/patitas/patitas-web/src/app/checkout"
timestamp: 2026-09-07T01-08-01Z
slug: src-app-checkout
closed: true
---

## Design Health Score: 26/40

| #         | Heuristic                       |     Score | Key issue                                                                     |
| --------- | ------------------------------- | --------: | ----------------------------------------------------------------------------- |
| 1         | Visibility of System Status     |       2/4 | Loading exists, but invalid-session and global error states are easy to miss. |
| 2         | Match System / Real World       |       3/4 | Argentine address and delivery language are clear and familiar.               |
| 3         | User Control and Freedom        |       3/4 | Edit, cancel, change address, remove coupon, and return controls exist.       |
| 4         | Consistency and Standards       |       3/4 | Component vocabulary is clear, but control heights/radii vary.                |
| 5         | Error Prevention                |       3/4 | Validation, disabled submit, terms gate, and shipping requirements help.      |
| 6         | Recognition Rather Than Recall  |       3/4 | Summaries help, but key delivery/total details are delayed or hidden.         |
| 7         | Flexibility and Efficiency      |       2/4 | Saved/Google/manual address paths exist, but recovery is inefficient.         |
| 8         | Aesthetic and Minimalist Design |       3/4 | Calm visual language; mobile ordering adds unnecessary vertical work.         |
| 9         | Error Recovery                  |       2/4 | Several failures offer only distant alerts or reload/account paths.           |
| 10        | Help and Documentation          |       2/4 | Inline hints exist, but disabled payment/overall sequence lack explanation.   |
| **Total** |                                 | **26/40** | Solid foundation, below a confident checkout experience.                      |

## Design Specificity Verdict

**LLM assessment:** Moderately authored for Patitas. Rioplatense copy, CABA address handling, delivery slots, scheduled purchase, and replenishment language are specific. The visual structure remains close to a generic ecommerce checkout: one large form card, a desktop summary rail, standard radio rows, and a conventional payment result page. The opportunity is to organize the experience around calm certainty—what is being paid, where it arrives, and when it arrives—rather than only around form completion.

**Deterministic scan:** The detector returned exit `0` with `[]` for the checkout route and directly rendered components. No automated findings were produced. This does not disprove the manual UX findings; they are hierarchy and flow issues outside the detector's rules.

**Visual evidence:** Browser visualization was unavailable. No live page, screenshot, overlay, or runtime behavior was verified.

## Overall Impression

The checkout has a strong operational foundation: it summarizes completed sections, validates important data, consults coverage only after address selection, and treats payment states responsibly. Its biggest weakness is reassurance at the moments of uncertainty. On mobile the customer loses sight of the total, Google fallback hides the manual path, and an expired session can disable the form without a nearby recovery action.

## What's Working

- Contact and delivery sections collapse into useful summaries with explicit edit/cancel controls (`checkout-form.tsx:712-772`, `773-951`).
- The address → coverage → delivery-slot sequence is clear and localized (`google-address-autocomplete.tsx:204-233`, `checkout-form.tsx:995-1061`).
- Payment status language distinguishes approved, pending, failed, and reconciliation states and warns against paying twice (`payment-order-view.tsx:141-174`).

## Priority Issues

### [P1] Mobile checkout hides the total until the end

Desktop keeps the summary in a sticky rail (`checkout-form.tsx:1278-1280`), while mobile renders it only after the form and coupon (`checkout-form.tsx:1220-1222`). Customers make high-stakes decisions without a persistent subtotal, shipping cost, discount, or total.

**Fix:** Add a compact “Total a pagar” block directly below the heading or a non-obstructive sticky mobile summary that expands to the full breakdown.

**Suggested command:** `$impeccable layout` or `$impeccable adapt`.

### [P1] Invalid checkout sessions can disable the form without a recovery surface

`sessionInvalid` is set at `checkout-form.tsx:162`, blocks submit at `448-450`, and disables the fieldset at `710`. There is no dedicated JSX branch near the heading; the generic error appears at `1254-1257`.

**Fix:** Show a prominent alert near “Finalizar compra” explaining expiration, preserve the cart, and offer “Volver al carrito” / “Iniciar checkout nuevo”. Move focus to it and keep section errors local.

**Suggested command:** `$impeccable harden` or `$impeccable clarify`.

### [P1] Google failure sends users to a collapsed manual fallback

The autocomplete tells users to complete fields below (`google-address-autocomplete.tsx:227-231`), but required street/city fields are inside a closed `<details>` labeled “Revisar los datos de la dirección” (`checkout-form.tsx:838-884`). “Revisar” sounds optional.

**Fix:** Open the manual panel on autocomplete error, rename it “Completar dirección manualmente”, and focus the street field; or expose required fields directly and keep only optional details collapsed.

**Suggested command:** `$impeccable harden` or `$impeccable clarify`.

### [P1] Guest payment-result recovery assumes an account

When no order ID is available, `MissingOrder` offers only `/mi-cuenta/pedidos` (`src/app/checkout/exito/page.tsx:36-48`). Guest checkout is supported, so a guest who already paid has no safe recovery route.

**Fix:** Add guest-safe exits to the store/cart and preserve an order/session recovery path. If lookup is impossible, explain exactly what information support needs instead of implying another payment.

**Suggested command:** `$impeccable harden`.

### [P2] The confirmation page does not close the delivery loop

The result view shows order ID, lines, and total (`src/features/orders/payment-order-view.tsx:156-170`) but not delivery address, date, slot, or scheduled-purchase recap. Delivery certainty is central to Patitas' promise.

**Fix:** Add an “Entrega” block with address/date/slot and, when applicable, the next reminder or schedule frequency.

**Suggested command:** `$impeccable polish` or `$impeccable delight`.

### [P2] The disabled payment action does not explain what remains

The primary button is disabled until many conditions are true (`checkout-form.tsx:654-668`, `1267-1273`), but the customer is not told whether the missing requirement is contact data, address, shipping slot, payment setup, or terms.

**Fix:** Add a concise prerequisite summary near the button, or make each incomplete section visibly marked and linkable.

**Suggested command:** `$impeccable clarify`.

## Persona Red Flags

**Alex — Power User:** Saving contact data advances to another section without explicit focus management (`checkout-form.tsx:289-295`). Long forms have no section jump navigation, and the global error is far below the failing control.

**Jordan — First-Timer:** A Google failure requires discovering a collapsed disclosure; the disabled payment button gives no reason; there is no progress or “what remains” cue.

**Guest customer:** A missing order ID leads only to account history, and the confirmation omits delivery details that would reassure someone without an account.

## Minor Observations

- Verify visible focus on the Google custom element wrapper (`google-address-autocomplete.tsx:113-126`).
- Saved-address buttons sit in a plain `div` with `aria-label` rather than a semantic group (`checkout-form.tsx:814-818`).
- New-tab terms/privacy links do not announce that behavior (`checkout-form.tsx:1232-1239`).
- Button radii/heights vary between `rounded-lg`/`rounded-xl` and 40/44/48/56px.
- Payway card UI exists, but `selectablePaymentMethods` filters to Mercado Pago only (`checkout-form.tsx:164`); confirm whether this is intentional or dead payment code.
- Payment-result recovery offers reload only when the order cannot be loaded (`payment-order-view.tsx:103-116`).

## Questions to Consider

- What if the total and delivery promise stayed visible throughout mobile checkout?
- Should manual address completion become a first-class fallback instead of a review disclosure?
- How should a guest recover a paid order when both return URL and order cookie are missing?
- Could the confirmation headline state when the food will arrive, not only that payment succeeded?
