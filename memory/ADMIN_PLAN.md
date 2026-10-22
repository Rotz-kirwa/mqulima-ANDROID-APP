# Mqulima operations admin — executable plan

## Scope and evidence
Requested: analyse Mqulima and build an admin suited to the whole ecosystem. Approved: complete operations admin and a dedicated account with generated initial credentials.

Reviewed public Home, AgroShop, Community, Services and Academy and inspected the existing app's news, tools, AI, contact, checkout, accounts and data models. The live site's shop scraper returned zero items because of dynamic loading; the existing build's MongoDB contains 189 products. Public marketing counters are not operational analytics.

This admin controls **this build's FastAPI/MongoDB data**. It does not control the separately hosted mqulima.com database; that connection requires its backend access. Preserve existing public navigation and brand, build an Expo mobile-first staff workspace.

## Findings
- Commerce already has Mongo products, JWT customers and orders. No staff fulfilment or catalogue editor.
- Forum is database-backed; the newly redesigned feed needs end-to-end validation. No moderation workflow yet.
- Articles are in Mongo, but the News hero still uses a local article.
- 8 service categories / 29 sub-services and 3 course previews are local data, not editable by staff.
- Service requests, contact messages and Academy waitlist currently show local success without saving to a staff inbox.
- M-Pesa is manual confirmation, not integrated settlement. Academy is previews/waitlist, not paid enrolment or certificates.
- Tools/AI exist; provider configuration, geospatial systems and private AI conversations are outside the first admin release.

## Delivery order and acceptance criteria

### P0 — secure foundation
1. Add DB-checked admin/customer roles, suspension, token versions and login attempt limits.
2. Create an initial admin through an idempotent CLI; never reset a password on startup. Require an initial password change.
3. Protect every admin endpoint; customers get 403 and unauthenticated requests 401. Block admin-account suspension through customer management.
4. Record actor, operation, target and time for staff writes. Never record passwords/hashes/tokens in audit entries.

### P0 — commerce and daily operations
5. Dashboard: true counts, open-order value explicitly not collected revenue, attention queues and recent audit activity.
6. Products: search/paginate, edit/create, variants, price, stock, featured, draft/publish/archive; retain historic orders.
7. Orders: customer/delivery/item details, validated fulfilment transitions, internal notes and explicitly manual payment records. Customer history must reflect changes.
8. Public checkout must reject archived/unavailable items and validate stock; reservation/release handled server-side.

### P1 — community and users
9. Forum: search discussions, inspect replies, hide/restore threads and replies with moderation reasons. Hidden material must disappear from public feeds/detail.
10. Users: search contact/county/role, suspend/reactivate customer accounts. Existing tokens must stop working after suspension.

### P1 — publishing, services and learning
11. News: editable title/category/excerpt/body/image, draft/publish/archive; public news and home consume the same database.
12. Migrate existing service categories/sub-services and course previews to Mongo idempotently without overwriting content.
13. Service catalogue: category, description, pricing, request CTA and publishing; service requests: persistent capture, assigned specialist/contact, notes and progress status.
14. Academy: course fields, outcomes, modules and lesson-preview editor; publish/archive; persistent deduplicated waitlist and contact status.
15. Contact inbox: persistent requests, status/notes, device email/phone follow-up. No automatic email delivery is implied.
16. New staff-uploaded images go to managed object storage through the native-safe upload helper. Keep pre-existing external image references intact.

### P1 — verification and handoff
17. Test every protected resource, cross-role denial, password rotation, visibility propagation, validation and audit records.
18. Test mobile admin login -> edit -> public verification, public requests -> admin queue, order fulfilment -> customer history.
19. Complete outstanding forum E2E tests (search, filters, sort, bookmark, drafts, nested replies, resolved questions) and baseline checkout UI.
20. Record actual credentials, tested limits and remaining work. Native device uploads/keyboard behaviour require device verification beyond browser preview.

## Later enhancements (not part of this delivery)
- Separate staff roles/invitations, two-factor authentication and granular permissions.
- Real M-Pesa settlement/refunds and automated SMS/email dispatch.
- Report-driven moderation queues, bulk imports/exports, full LMS enrolment/video hosting/certificates.
- Live weather/market feeds, mapping/traceability administration, marketing-page visual CMS.
- Separate live-site backend connection after owner supplies the required access.