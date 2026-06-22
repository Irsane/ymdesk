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


def find_arbs_in_event(event: Event, min_profit_pct: float = 0.0) -> list[Arb]:
    """Найти все вилки в одном событии."""
    by_factor_all: dict[int, list[Outcome]] = {}
    for o in event.outcomes:
        if o.coeff and o.coeff > 1.0:
            by_factor_all.setdefault(o.factor_id, []).append(o)

    found: list[Arb] = []
    for group in MARKET_GROUPS:
        # Все исходы группы должны присутствовать.
        if not all(fid in by_factor_all for fid in group.factor_ids):
            continue
        # ...и не должно быть «запрещённых» (например ничьи для 2-исходной группы).
        if any(fid in by_factor_all for fid in group.forbid_ids):
            continue
        by_factor = {fid: by_factor_all[fid] for fid in group.factor_ids}

        for combo in _combinations_by_param(group, by_factor):
            margin = sum(1.0 / o.coeff for o in combo)
            if margin >= 1.0:
                continue
            profit = (1.0 / margin - 1.0) * 100.0
            if profit < min_profit_pct:
                continue
            legs = [
                ArbLeg(label=o.label, coeff=o.coeff, stake_share=(1.0 / o.coeff) / margin)
                for o in combo
            ]
            found.append(
                Arb(
                    event=event,
                    market_name=group.name,
                    legs=legs,
                    margin=margin,
                    profit_pct=profit,
                )
            )
    return found


def find_arbs(events: list[Event], min_profit_pct: float = 0.0) -> list[Arb]:
    """Найти вилки во всех событиях, отсортировав по убыванию прибыли."""
    result: list[Arb] = []
    for event in events:
        result.extend(find_arbs_in_event(event, min_profit_pct))
    result.sort(key=lambda a: a.profit_pct, reverse=True)
    return result
