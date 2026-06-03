---
name: shop-wallet system complete
description: Full book ordering + wallet system for oKidd — DB, API, and all frontend pages are implemented.
---

## What's built
- **DB tables**: `book_orders`, `book_order_items`, `wallets`, `wallet_transactions` (all migrated)
- **API routes** (registered in index.ts): `bookOrders.ts`, `wallet.ts` — full CRUD + license-summary from paid orders
- **Admin pages**: `/admin/orders` (full order management, create/edit/status), `/admin/wallets` (credit wallets per school)
- **School pages**: `/school/shop` (browse+cart+checkout), `/school/orders` (history + print invoice), `/school/wallet` (balance + transactions)
- **Branch pages**: `/branch/shop`, `/branch/orders`, `/branch/wallet` — mirror school pages using `useEffectiveSchoolId()`
- **Layout nav**: all nav items wired in Layout.tsx for school/branch/admin roles
- **App.tsx routes**: all routes registered

## Key decisions
- `POST /book-orders` auto-calculates totals from book prices; discount is a percentage
- Paying via wallet (`paymentMethod=wallet`, `status=paid`) auto-debits the wallet in `PUT /book-orders/:id`
- `GET /book-license-summary` uses paid orders (not packages) for purchased count
- `books.price` field (numeric) used as unit price in orders

## Gotchas
- `classBookMap` can contain duplicate bookIds if a book is assigned to a class multiple times — always `[...new Set(classBookMap[cid])]`
- After adding new routes to API files, restart the API server or they'll 404
