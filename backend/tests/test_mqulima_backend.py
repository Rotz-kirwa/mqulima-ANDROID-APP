"""Mqulima backend regression tests — auth, catalog, forum, orders, search."""
import time
import pytest
import requests

# ---------- health & root ----------
def test_health_root(http, api):
    r = http.get(f"{api}/")
    assert r.status_code == 200
    assert "message" in r.json()


# ---------- auth ----------
class TestAuth:
    def test_register_returns_token_and_user(self, new_user):
        assert new_user["token"]
        assert new_user["user"]["email"] == new_user["email"].lower()
        assert new_user["user"]["name"] == "TEST Tester"
        assert "id" in new_user["user"]

    def test_register_duplicate_returns_409(self, http, api, new_user):
        r = http.post(f"{api}/auth/register", json={
            "name": "TEST Tester",
            "email": new_user["email"],
            "phone": "0712345678",
            "county": "Nairobi",
            "password": "secret123",
        })
        assert r.status_code == 409

    def test_register_short_password_returns_422(self, http, api):
        ts = int(time.time() * 1000)
        r = http.post(f"{api}/auth/register", json={
            "name": "TEST Short",
            "email": f"TEST_short+{ts}@gmail.com",
            "phone": "0712345678",
            "county": "Nairobi",
            "password": "abc",
        })
        assert r.status_code == 422

    def test_login_wrong_password_returns_401(self, http, api, new_user):
        r = http.post(f"{api}/auth/login", json={"email": new_user["email"], "password": "wrongpass"})
        assert r.status_code == 401

    def test_login_existing_seed_user(self, existing_user_token):
        assert existing_user_token

    def test_me_without_token_returns_401(self, http, api):
        r = http.get(f"{api}/auth/me")
        assert r.status_code == 401

    def test_me_with_token_returns_user(self, http, api, auth_headers, new_user):
        r = http.get(f"{api}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == new_user["email"].lower()


# ---------- catalog: products ----------
class TestProducts:
    def test_products_default_pagination_total_189(self, http, api):
        r = http.get(f"{api}/products", params={"category": "All", "q": "", "page": 1})
        assert r.status_code == 200
        data = r.json()
        assert set(["items", "total", "page", "pages"]).issubset(data.keys())
        assert data["total"] == 189
        assert data["page"] == 1
        assert data["pages"] == 8  # 189 / 24 ceil
        assert len(data["items"]) == 24

    def test_products_filter_by_category_seeds(self, http, api):
        r = http.get(f"{api}/products", params={"category": "Seeds", "q": "", "page": 1})
        assert r.status_code == 200
        d = r.json()
        assert d["total"] > 0
        for p in d["items"]:
            assert p["category"] == "Seeds"

    def test_products_pagination_page2(self, http, api):
        r = http.get(f"{api}/products", params={"page": 2})
        assert r.status_code == 200
        d = r.json()
        assert d["page"] == 2
        assert len(d["items"]) == 24

    def test_products_featured(self, http, api):
        r = http.get(f"{api}/products/featured")
        assert r.status_code == 200
        docs = r.json()
        assert isinstance(docs, list)
        assert len(docs) > 0
        for p in docs:
            assert p.get("featured") is True

    def test_products_by_ids_preserves_order(self, http, api):
        r = http.get(f"{api}/products/by-ids", params={"ids": "farm-tools,weedal-480sl"})
        assert r.status_code == 200
        docs = r.json()
        ids = [d["id"] for d in docs]
        # Accept missing ids (filter), but order of returned must match input order
        for i in range(len(ids) - 1):
            assert ["farm-tools", "weedal-480sl"].index(ids[i]) < ["farm-tools", "weedal-480sl"].index(ids[i + 1])

    def test_products_by_ids_empty(self, http, api):
        r = http.get(f"{api}/products/by-ids", params={"ids": ""})
        assert r.status_code == 200
        assert r.json() == []

    def test_product_detail_404_for_unknown(self, http, api):
        r = http.get(f"{api}/products/this-does-not-exist-xyz")
        assert r.status_code == 404

    def test_product_detail_ok(self, http, api):
        r = http.get(f"{api}/products/farm-tools")
        # may 404 if id differs; try fallback via list
        if r.status_code == 404:
            lst = http.get(f"{api}/products", params={"page": 1}).json()["items"]
            pid = lst[0]["id"]
            r = http.get(f"{api}/products/{pid}")
        assert r.status_code == 200
        assert "id" in r.json() and "name" in r.json() and "price" in r.json()


# ---------- catalog: articles ----------
class TestArticles:
    def test_articles_list_group_filter(self, http, api):
        r = http.get(f"{api}/articles", params={"group": "Livestock & Dairy"})
        assert r.status_code == 200
        arts = r.json()
        assert isinstance(arts, list)
        if arts:
            for a in arts:
                assert a["group"] == "Livestock & Dairy"

    def test_article_detail_increments_reads(self, http, api):
        all_arts = http.get(f"{api}/articles").json()
        assert all_arts, "no articles seeded"
        aid = all_arts[0]["id"]
        r1 = http.get(f"{api}/articles/{aid}")
        assert r1.status_code == 200
        reads1 = r1.json()["reads"]
        r2 = http.get(f"{api}/articles/{aid}")
        assert r2.json()["reads"] == reads1 + 1


# ---------- search ----------
class TestSearch:
    def test_search_returns_products_and_articles(self, http, api):
        r = http.get(f"{api}/search", params={"q": "maize"})
        assert r.status_code == 200
        d = r.json()
        assert "products" in d and "articles" in d
        assert isinstance(d["products"], list) and isinstance(d["articles"], list)

    def test_search_empty_q(self, http, api):
        r = http.get(f"{api}/search", params={"q": ""})
        assert r.status_code == 200
        assert r.json() == {"products": [], "articles": []}


# ---------- forum ----------
class TestForum:
    def test_list_threads_sorted_newest_first(self, http, api):
        r = http.get(f"{api}/threads")
        assert r.status_code == 200
        threads = r.json()
        assert isinstance(threads, list)
        if len(threads) >= 2:
            assert threads[0]["created_at"] >= threads[1]["created_at"]
        for t in threads:
            assert "liked" in t and "likes" in t
            assert t["liked"] is False  # no auth

    def test_create_thread_401_without_token(self, http, api):
        r = http.post(f"{api}/threads", json={"text": "hello world test", "tag": "Crops", "county": "Nairobi"})
        assert r.status_code == 401

    def test_create_thread_201_with_token(self, http, api, auth_headers):
        r = http.post(f"{api}/threads", json={
            "text": "TEST thread content from pytest",
            "tag": "Crops",
            "county": "Nairobi",
        }, headers=auth_headers)
        assert r.status_code == 201, r.text
        d = r.json()
        assert d["text"].startswith("TEST thread")
        assert d["likes"] == 0 and d["liked"] is False
        # persistence check
        g = http.get(f"{api}/threads/{d['id']}")
        assert g.status_code == 200
        TestForum.created_tid = d["id"]

    def test_comment_appears(self, http, api, auth_headers):
        tid = getattr(TestForum, "created_tid", None)
        assert tid, "need created thread"
        r = http.post(f"{api}/threads/{tid}/comments", json={"text": "TEST first comment"}, headers=auth_headers)
        assert r.status_code == 201
        g = http.get(f"{api}/threads/{tid}").json()
        assert any(c["text"] == "TEST first comment" for c in g["comments"])

    def test_toggle_like_flow(self, http, api, auth_headers):
        tid = getattr(TestForum, "created_tid", None)
        assert tid
        # like
        r1 = http.post(f"{api}/threads/{tid}/like", headers=auth_headers)
        assert r1.status_code == 200
        d1 = r1.json()
        assert d1["liked"] is True and d1["likes"] == 1
        # unlike
        r2 = http.post(f"{api}/threads/{tid}/like", headers=auth_headers)
        d2 = r2.json()
        assert d2["liked"] is False and d2["likes"] == 0

    def test_threads_mine_filter(self, http, api, auth_headers, new_user):
        r = http.get(f"{api}/threads", params={"mine": "true"}, headers=auth_headers)
        assert r.status_code == 200
        mine = r.json()
        assert len(mine) >= 1
        for t in mine:
            assert t["author"] == new_user["user"]["name"]


# ---------- orders ----------
class TestOrders:
    def test_order_requires_auth(self, http, api):
        r = http.post(f"{api}/orders", json={
            "items": [{"productId": "farm-tools", "qty": 1}],
            "name": "TEST", "phone": "0712345678", "county": "Nairobi",
            "subcounty": "Westlands", "location": "Nearby",
        })
        assert r.status_code == 401

    def test_order_computed_delivery_small(self, http, api, auth_headers):
        # Pick a cheap product so subtotal < 5000 → delivery = 300
        prods = http.get(f"{api}/products", params={"page": 1}).json()["items"]
        cheap = min(prods, key=lambda p: p["price"])
        qty = 1
        r = http.post(f"{api}/orders", json={
            "items": [{"productId": cheap["id"], "qty": qty}],
            "name": "TEST Buyer", "phone": "0712345678", "county": "Nairobi",
            "subcounty": "Westlands", "location": "Street 1",
        }, headers=auth_headers)
        assert r.status_code == 201, r.text
        o = r.json()
        assert o["id"].startswith("MQ-") and len(o["id"]) == 9
        assert o["subtotal"] == cheap["price"] * qty
        if o["subtotal"] < 5000:
            assert o["delivery"] == 300
        else:
            assert o["delivery"] == 0
        assert o["total"] == o["subtotal"] + o["delivery"]

    def test_order_free_delivery_when_subtotal_ge_5000(self, http, api, auth_headers):
        prods = http.get(f"{api}/products", params={"page": 1}).json()["items"]
        pricey = max(prods, key=lambda p: p["price"])
        qty = max(1, (5000 // pricey["price"]) + 1)
        r = http.post(f"{api}/orders", json={
            "items": [{"productId": pricey["id"], "qty": qty}],
            "name": "TEST Buyer", "phone": "0712345678", "county": "Nairobi",
            "subcounty": "Westlands", "location": "Street 1",
        }, headers=auth_headers)
        assert r.status_code == 201
        o = r.json()
        assert o["subtotal"] >= 5000
        assert o["delivery"] == 0

    def test_order_invalid_variant_400(self, http, api, auth_headers):
        # find a product with variants
        prods = http.get(f"{api}/products", params={"page": 1}).json()["items"]
        with_variants = None
        for pg in range(1, 9):
            page_items = http.get(f"{api}/products", params={"page": pg}).json()["items"]
            for p in page_items:
                full = http.get(f"{api}/products/{p['id']}").json()
                if full.get("variants"):
                    with_variants = full
                    break
            if with_variants:
                break
        assert with_variants, "no product with variants found"
        r = http.post(f"{api}/orders", json={
            "items": [{"productId": with_variants["id"], "variant": "DOES_NOT_EXIST", "qty": 1}],
            "name": "TEST Buyer", "phone": "0712345678", "county": "Nairobi",
            "subcounty": "Westlands", "location": "Street 1",
        }, headers=auth_headers)
        assert r.status_code == 400

    def test_order_invalid_product_400(self, http, api, auth_headers):
        r = http.post(f"{api}/orders", json={
            "items": [{"productId": "nope-xyz-missing", "qty": 1}],
            "name": "TEST Buyer", "phone": "0712345678", "county": "Nairobi",
            "subcounty": "Westlands", "location": "Street 1",
        }, headers=auth_headers)
        assert r.status_code == 400

    def test_my_orders_returns_own(self, http, api, auth_headers):
        r = http.get(f"{api}/orders", headers=auth_headers)
        assert r.status_code == 200
        orders = r.json()
        assert len(orders) >= 1
        for o in orders:
            assert "id" in o and "total" in o
