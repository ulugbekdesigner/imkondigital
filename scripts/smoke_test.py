"""IMKON Digital - o'qish-uchun (read-only) smoke-test.

UPDATE_5.0 E4-bo'lim: har deploydan oldin/keyin asosiy sahifalar sinmaganini
tekshiradi. Hech qanday yozish amali (ro'yxatdan o'tish, ariza, xayriya)
BAJARMAYDI - shu sabab to'g'ridan-to'g'ri production'ga qarshi ham xavfsiz
ishga tushiriladi. Haqiqiy yozish-yo'li (signup -> ariza -> qabul -> xayriya)
uchun alohida staging muhiti kerak (bu skript unga ham ishlaydi - BASE_URL
o'zgaruvchisini almashtirish kifoya).

Ishlatish:
    python scripts/smoke_test.py [BASE_URL]
    (standart BASE_URL: https://imkondigital.uz)

Chiqish kodi: 0 - hammasi o'tdi, 1 - kamida bitta tekshiruv muvaffaqiyatsiz.
"""

import sys

from playwright.sync_api import Page, sync_playwright

DEFAULT_BASE_URL = "https://imkondigital.uz"
TIMEOUT_MS = 15_000

results: list[tuple[str, bool, str]] = []


def check(name: str, fn) -> None:
    try:
        fn()
        results.append((name, True, ""))
        print(f"[OK]   {name}")
    except Exception as exc:  # noqa: BLE001 - smoke-test uchun har xatoni tutamiz
        results.append((name, False, str(exc)[:200]))
        print(f"[FAIL] {name} - {exc}")


def run(base_url: str) -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_default_timeout(TIMEOUT_MS)

        def homepage_loads() -> None:
            page.goto(base_url, wait_until="networkidle")
            assert page.title(), "sahifa sarlavhasi bo'sh"

        def ziyo_widget_opens() -> None:
            page.goto(base_url, wait_until="networkidle")
            trigger = page.locator('[data-tour="ziyo-trigger"]')
            trigger.click()
            panel = page.locator("#ziyo-panel")
            panel.wait_for(state="visible", timeout=TIMEOUT_MS)

        def login_page_has_form() -> None:
            page.goto(f"{base_url}/kirish", wait_until="networkidle")
            assert page.locator("form").count() > 0, "kirish formasi topilmadi"

        def courses_catalog_and_detail_load() -> None:
            page.goto(f"{base_url}/kurslar", wait_until="networkidle")
            first_link = page.locator('a[href^="/kurslar/"]').first
            first_link.wait_for(state="visible", timeout=TIMEOUT_MS)
            href = first_link.get_attribute("href")
            assert href, "kurs havolasi topilmadi"
            page.goto(f"{base_url}{href}", wait_until="networkidle")
            assert page.locator("h1").count() > 0, "kurs sahifasida sarlavha yo'q"

        def vacancies_catalog_and_detail_load() -> None:
            page.goto(f"{base_url}/vakansiyalar", wait_until="networkidle")
            first_link = page.locator('a[href^="/vakansiyalar/"]').first
            first_link.wait_for(state="visible", timeout=TIMEOUT_MS)
            href = first_link.get_attribute("href")
            assert href, "vakansiya havolasi topilmadi"
            page.goto(f"{base_url}{href}", wait_until="networkidle")
            assert page.locator("h1").count() > 0, "vakansiya sahifasida sarlavha yo'q"

        def employer_area_redirects_guest_to_login() -> None:
            page.goto(f"{base_url}/ish-beruvchi", wait_until="networkidle")
            assert "/kirish" in page.url, f"mehmon /ish-beruvchi'ga kirdi: {page.url}"

        def admin_area_redirects_guest_to_login() -> None:
            page.goto(f"{base_url}/admin", wait_until="networkidle")
            assert "/kirish" in page.url, f"mehmon /admin'ga kirdi: {page.url}"

        def donations_page_loads() -> None:
            page.goto(f"{base_url}/xayriya", wait_until="networkidle")
            assert page.locator("h1").count() > 0, "xayriya sahifasida sarlavha yo'q"

        check("1. Bosh sahifa ochiladi", homepage_loads)
        check("2. Kirish sahifasida forma bor", login_page_has_form)
        check("3. Ziyo paneli ochiladi", ziyo_widget_opens)
        check("4. Kurslar katalogi + bitta kurs sahifasi", courses_catalog_and_detail_load)
        check("5. Vakansiyalar katalogi + bitta vakansiya sahifasi", vacancies_catalog_and_detail_load)
        check("6. Ish beruvchi kabineti mehmonni kirishga yo'naltiradi", employer_area_redirects_guest_to_login)
        check("7. Admin panel mehmonni kirishga yo'naltiradi", admin_area_redirects_guest_to_login)
        check("8. Xayriya sahifasi ochiladi", donations_page_loads)

        browser.close()


def main() -> int:
    base_url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_BASE_URL
    print(f"Smoke-test: {base_url}\n")
    run(base_url)

    print()
    passed = sum(1 for _, ok, _ in results if ok)
    total = len(results)
    print(f"{passed}/{total} o'tdi")
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
