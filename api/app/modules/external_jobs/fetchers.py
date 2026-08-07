"""Ochiq xalqaro ish-doskalaridan qonuniy agregatsiya — faqat ochiq API/RSS.

Har manba o'zining atribut talabini qo'yadi (masalan RemoteOK/Remotive "legal"
ogohlantirishida "manbaga havola qoldiring" deb yozilgan) — shu sabab har doim
`source_url` saqlanadi va frontend "Asl manbada ochish" havolasi bilan
ko'rsatiladi (biz vositachi emas, faqat yo'lboshchimiz).
"""

import html
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from xml.etree import ElementTree

import httpx

_USER_AGENT = "IMKON-Digital-JobAggregator/1.0 (+https://imkondigital.uz)"
_TIMEOUT = 15.0
_MAX_PER_SOURCE = 30


@dataclass
class RawExternalJob:
    source: str
    external_id: str
    title: str
    company_name: str
    description: str
    source_url: str
    tags: list[str] = field(default_factory=list)
    location_note: str | None = None
    posted_at: datetime | None = None


def _strip_html(raw: str | None) -> str:
    if not raw:
        return ""
    text = re.sub(r"<[^>]+>", " ", raw)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


async def fetch_remoteok(client: httpx.AsyncClient) -> list[RawExternalJob]:
    resp = await client.get(
        "https://remoteok.com/api",
        headers={"User-Agent": _USER_AGENT},
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    rows = resp.json()
    jobs: list[RawExternalJob] = []
    for row in rows:
        if "id" not in row or "position" not in row:
            continue  # birinchi qator "legal" ogohlantirish, ish e'loni emas
        posted_at = None
        if row.get("date"):
            try:
                posted_at = datetime.fromisoformat(row["date"])
            except ValueError:
                posted_at = None
        jobs.append(
            RawExternalJob(
                source="remoteok",
                external_id=str(row["id"]),
                title=str(row["position"]),
                company_name=str(row.get("company") or "Noma'lum"),
                description=_strip_html(row.get("description")),
                source_url=str(row.get("url") or row.get("apply_url") or ""),
                tags=[str(t) for t in row.get("tags") or []],
                location_note=str(row["location"]) if row.get("location") else None,
                posted_at=posted_at,
            )
        )
        if len(jobs) >= _MAX_PER_SOURCE:
            break
    return jobs


async def fetch_remotive(client: httpx.AsyncClient) -> list[RawExternalJob]:
    resp = await client.get(
        "https://remotive.com/api/remote-jobs",
        params={"limit": _MAX_PER_SOURCE},
        headers={"User-Agent": _USER_AGENT},
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    jobs: list[RawExternalJob] = []
    for row in data.get("jobs", []):
        posted_at = None
        if row.get("publication_date"):
            try:
                posted_at = datetime.fromisoformat(row["publication_date"]).replace(tzinfo=UTC)
            except ValueError:
                posted_at = None
        jobs.append(
            RawExternalJob(
                source="remotive",
                external_id=str(row["id"]),
                title=str(row["title"]),
                company_name=str(row.get("company_name") or "Noma'lum"),
                description=_strip_html(row.get("description")),
                source_url=str(row.get("url") or ""),
                tags=[str(t) for t in row.get("tags") or []],
                location_note=str(row["candidate_required_location"])
                if row.get("candidate_required_location")
                else None,
                posted_at=posted_at,
            )
        )
    return jobs


def _rss_text(item: ElementTree.Element, tag: str) -> str | None:
    el = item.find(tag)
    return el.text.strip() if el is not None and el.text else None


async def fetch_weworkremotely(client: httpx.AsyncClient) -> list[RawExternalJob]:
    resp = await client.get(
        "https://weworkremotely.com/remote-jobs.rss",
        headers={"User-Agent": _USER_AGENT},
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    root = ElementTree.fromstring(resp.text)
    jobs: list[RawExternalJob] = []
    for item in root.findall(".//item")[:_MAX_PER_SOURCE]:
        raw_title = _rss_text(item, "title") or "Noma'lum lavozim"
        company, _, position = raw_title.partition(": ")
        if not position:
            company, position = "Noma'lum", raw_title
        guid = _rss_text(item, "guid") or _rss_text(item, "link") or raw_title
        link = _rss_text(item, "link") or guid
        posted_at = None
        pub_date = _rss_text(item, "pubDate")
        if pub_date:
            try:
                posted_at = parsedate_to_datetime(pub_date)
            except (TypeError, ValueError):
                posted_at = None
        skills = _rss_text(item, "skills") or ""
        jobs.append(
            RawExternalJob(
                source="weworkremotely",
                external_id=guid,
                title=position,
                company_name=company,
                description=_strip_html(_rss_text(item, "description")),
                source_url=link,
                tags=[s.strip() for s in skills.split(",") if s.strip()],
                location_note=_rss_text(item, "region"),
                posted_at=posted_at,
            )
        )
    return jobs


FETCHERS = {
    "remoteok": fetch_remoteok,
    "remotive": fetch_remotive,
    "weworkremotely": fetch_weworkremotely,
}
