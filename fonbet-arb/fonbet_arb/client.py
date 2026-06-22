"""
Клиент линии FONBET.

Официального публичного API у FONBET нет. Здесь используется тот же
JSON-эндпоинт линии, что и веб-сайт конторы:

    https://line{N}w.bk6bba-resources.com/events/list?lang=ru&version=0&scopeMarket=1600

Номер хоста (N) у FONBET «плавает», поэтому перебираем несколько вариантов,
пока какой-то не ответит 200. Ответ — большой JSON со списками `sports`,
`events` и `customFactors` (коэффициенты).

Из облачной песочницы эти хосты заблокированы (HTTP 403/timeout), но на
домашнем ПК запрос проходит. Для разработки и проверки логики без сети
используйте demo-режим (sample_line.json).
"""

from __future__ import annotations

import json
import os
from typing import Iterable

import requests

from .markets import Event, Outcome

# Заголовки «как из браузера» — иначе CDN чаще отдаёт 403.
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Referer": "https://www.fonbet.ru/",
    "Origin": "https://www.fonbet.ru",
    "Accept": "application/json, text/plain, */*",
}

# Кандидаты хостов линии. Можно расширить диапазон при необходимости.
HOST_CANDIDATES = [f"line{n:02d}w.bk6bba-resources.com" for n in range(2, 60)]

EVENT_URL_TEMPLATE = "https://www.fonbet.ru/sports/event/{event_id}"


class FonbetError(RuntimeError):
    pass


def _request_line(host: str, timeout: float) -> dict:
    url = f"https://{host}/events/list?lang=ru&version=0&scopeMarket=1600"
    resp = requests.get(url, headers=HEADERS, timeout=timeout)
    resp.raise_for_status()
    return resp.json()


def fetch_raw_line(timeout: float = 12.0, hosts: Iterable[str] | None = None) -> dict:
    """Скачать сырой JSON линии, перебирая хосты до первого успешного."""
    last_err: Exception | None = None
    for host in (hosts or HOST_CANDIDATES):
        try:
            data = _request_line(host, timeout)
            if isinstance(data, dict) and data.get("events"):
                return data
        except Exception as exc:  # noqa: BLE001 — нам важна только успешность хоста
            last_err = exc
            continue
    raise FonbetError(
        "Не удалось получить линию FONBET ни с одного хоста. "
        "Проверьте интернет/доступность сайта. Последняя ошибка: "
        f"{last_err!r}"
    )


def load_demo_line(path: str | None = None) -> dict:
    """Загрузить демонстрационный снимок линии (для офлайн-проверки)."""
    if path is None:
        path = os.path.join(os.path.dirname(__file__), "sample_line.json")
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def parse_line(data: dict) -> list[Event]:
    """Превратить сырой JSON FONBET в список нормализованных событий."""
    sports_by_id = {s["id"]: s for s in data.get("sports", [])}

    def sport_name(sport_id: int) -> str:
        # Поднимаемся к корневому виду спорта (у FONBET дерево турниров).
        seen = set()
        sid = sport_id
        name = ""
        while sid in sports_by_id and sid not in seen:
            seen.add(sid)
            node = sports_by_id[sid]
            name = node.get("name", name)
            parent = node.get("parentId")
            if not parent:
                break
            sid = parent
        return name

    events: dict[int, Event] = {}
    for ev in data.get("events", []):
        eid = ev.get("id")
        if eid is None:
            continue
        events[eid] = Event(
            id=eid,
            sport=sport_name(ev.get("sportId", 0)),
            name=ev.get("name", ""),
            team1=ev.get("team1", "") or "",
            team2=ev.get("team2", "") or "",
            start_time=ev.get("startTime"),
        )

    # customFactors: [{"e": eventId, "factors": [{"f": id, "v": coeff, "pt": param}]}]
    for block in data.get("customFactors", []):
        eid = block.get("e")
        event = events.get(eid)
        if event is None:
            continue
        for f in block.get("factors", []):
            coeff = f.get("v")
            fid = f.get("f")
            if not coeff or fid is None:
                continue
            param = f.get("pt", f.get("p"))
            try:
                param = float(param) if param is not None else None
            except (TypeError, ValueError):
                param = None
            event.outcomes.append(
                Outcome(factor_id=int(fid), coeff=float(coeff), param=param)
            )

    return [e for e in events.values() if e.outcomes]


def event_url(event_id: int) -> str:
    """Ссылка на страницу события на сайте FONBET (для кнопки «Перейти»)."""
    return EVENT_URL_TEMPLATE.format(event_id=event_id)


def get_events(demo: bool = False, timeout: float = 12.0) -> list[Event]:
    """Высокоуровневый помощник: вернуть список событий (из сети или demo)."""
    data = load_demo_line() if demo else fetch_raw_line(timeout=timeout)
    return parse_line(data)
