"""
Математика вилок: из набора исходов события находим арбитражные ситуации.

Принцип (ровно как в задаче):
    margin = sum(1 / коэффициент)   по полной группе противоположных исходов
    если margin < 1  ->  это вилка, прибыль = (1 / margin - 1) * 100 %
"""

from __future__ import annotations

from dataclasses import dataclass

from .markets import Event, MarketGroup, MARKET_GROUPS, Outcome


@dataclass
class ArbLeg:
    """Одна «нога» вилки: на какой исход и с каким коэффициентом ставить."""

    label: str
    coeff: float
    stake_share: float  # доля банка на этот исход, 0..1


@dataclass
class Arb:
    """Найденная вилка по одному событию и одному рынку."""

    event: Event
    market_name: str
    legs: list[ArbLeg]
    margin: float            # sum(1/coeff); < 1 = вилка
    profit_pct: float        # гарантированная прибыль, %

    @property
    def key(self) -> tuple:
        # Уникальный ключ, чтобы не показывать дубли при автообновлении.
        return (self.event.id, self.market_name, tuple(l.label for l in self.legs))


def _params_match(group: MarketGroup, outcomes: list[Outcome]) -> bool:
    """Проверить, что линии (тотал/фора) у исходов образуют корректную пару."""
    if not group.needs_param:
        return True
    params = [o.param for o in outcomes]
    if any(p is None for p in params):
        return False
    if group.pair_param:
        # Фора: параметры противоположны по знаку, равны по модулю.
        return abs(params[0] + params[1]) < 1e-9
    # Тотал: линия должна совпадать.
    return all(abs(p - params[0]) < 1e-9 for p in params)


def _combinations_by_param(group: MarketGroup, by_factor: dict[int, list[Outcome]]):
    """Перебрать сочетания исходов группы, корректно сшивая их по линии.

    Для рынков без параметра — одно сочетание. Для тоталов/фор у события может
    быть несколько линий (2.5, 3.5, ...), поэтому перебираем совместимые пары.
    """
    legs_per_factor = [by_factor[f] for f in group.factor_ids]

    if not group.needs_param:
        # Берём лучший (максимальный) коэффициент по каждому исходу.
        yield [max(group_outcomes, key=lambda o: o.coeff) for group_outcomes in legs_per_factor]
        return

    # С параметром: сопоставляем по совпадающей линии.
    first = legs_per_factor[0]
    rest = legs_per_factor[1:]
    for base in first:
        combo = [base]
        ok = True
        for others in rest:
            if group.pair_param:
                target = -base.param if base.param is not None else None
            else:
                target = base.param
            match = [o for o in others if o.param is not None and abs(o.param - target) < 1e-9]
            if not match:
                ok = False
                break
            combo.append(max(match, key=lambda o: o.coeff))
        if ok and _params_match(group, combo):
            yield combo


def _make_arb(event: Event, group: MarketGroup, combo: list[Outcome]) -> Arb:
    margin = sum(1.0 / o.coeff for o in combo)
    profit = (1.0 / margin - 1.0) * 100.0
    legs = [
        ArbLeg(label=o.label, coeff=o.coeff, stake_share=(1.0 / o.coeff) / margin)
        for o in combo
    ]
    return Arb(event=event, market_name=group.name, legs=legs, margin=margin, profit_pct=profit)


def evaluate_event(event: Event) -> list[Arb]:
    """Посчитать маржу по ВСЕМ полным группам исходов события (даже если >= 1).

    Возвращает все рассчитанные рынки — это основа и для поиска вилок
    (margin < 1), и для режима «почти-вилки» (берём лучшие по марже).
    """
    by_factor_all: dict[int, list[Outcome]] = {}
    for o in event.outcomes:
        if o.coeff and o.coeff > 1.0:
            by_factor_all.setdefault(o.factor_id, []).append(o)

    results: list[Arb] = []
    for group in MARKET_GROUPS:
        # Все исходы группы должны присутствовать...
        if not all(fid in by_factor_all for fid in group.factor_ids):
            continue
        # ...и не должно быть «запрещённых» (например ничьи для 2-исходной группы).
        if any(fid in by_factor_all for fid in group.forbid_ids):
            continue
        by_factor = {fid: by_factor_all[fid] for fid in group.factor_ids}
        for combo in _combinations_by_param(group, by_factor):
            results.append(_make_arb(event, group, combo))
    return results


def find_arbs_in_event(event: Event, min_profit_pct: float = 0.0) -> list[Arb]:
    """Найти настоящие вилки (margin < 1) в одном событии."""
    return [
        a for a in evaluate_event(event)
        if a.margin < 1.0 and a.profit_pct >= min_profit_pct
    ]


def find_arbs(events: list[Event], min_profit_pct: float = 0.0) -> list[Arb]:
    """Найти вилки во всех событиях, отсортировав по убыванию прибыли."""
    result: list[Arb] = []
    for event in events:
        result.extend(find_arbs_in_event(event, min_profit_pct))
    result.sort(key=lambda a: a.profit_pct, reverse=True)
    return result


def find_best(events: list[Event], limit: int = 100) -> list[Arb]:
    """Топ рынков с минимальной маржой (включая «почти-вилки» с margin >= 1).

    Полезно, когда чистых вилок нет: видно, какие события ближе всего к вилке,
    и заодно — что движок реально находит и считает рынки.
    """
    result: list[Arb] = []
    for event in events:
        result.extend(evaluate_event(event))
    # По возрастанию маржи: самые «вкусные» (низкая маржа) — сверху.
    result.sort(key=lambda a: a.margin)
    return result[:limit]


def diagnostics(events: list[Event]) -> dict:
    """Собрать диагностику: какие рынки находятся и насколько близки к вилке.

    Возвращает словарь:
      - events_total            — событий с коэффициентами;
      - factor_freq             — частота id факторов (топ типов исходов в линии);
      - groups                  — по каждой группе: сколько событий её содержат
                                  и минимальная найденная маржа (ближе к 1 — лучше);
      - arbs                    — число настоящих вилок (margin < 1).
    """
    from collections import Counter

    factor_freq: Counter[int] = Counter()
    group_count: Counter[str] = Counter()
    group_min_margin: dict[str, float] = {}
    arb_count = 0

    for event in events:
        for o in event.outcomes:
            factor_freq[o.factor_id] += 1
        for a in evaluate_event(event):
            group_count[a.market_name] += 1
            prev = group_min_margin.get(a.market_name)
            if prev is None or a.margin < prev:
                group_min_margin[a.market_name] = a.margin
            if a.margin < 1.0:
                arb_count += 1

    groups = []
    for g in MARKET_GROUPS:
        groups.append({
            "name": g.name,
            "factor_ids": list(g.factor_ids),
            "events_with_market": group_count.get(g.name, 0),
            "min_margin": group_min_margin.get(g.name),
        })

    return {
        "events_total": len(events),
        "factor_freq": dict(factor_freq.most_common(40)),
        "groups": groups,
        "arbs": arb_count,
    }
