"""
Описание рынков ("маркетов") FONBET и их группировка для поиска вилок.

Вилка (арбитраж) внутри одной конторы возникает, когда несколько
ВЗАИМОИСКЛЮЧАЮЩИХ и ПОЛНЫХ исходов одного события (например «Тотал больше»
и «Тотал меньше» на одну и ту же линию) дают сумму обратных коэффициентов
меньше единицы:

        sum(1 / коэффициент)  <  1

Тогда, распределив ставку пропорционально, можно получить прибыль при любом
исходе. Именно это просил пользователь: «противоположные события и сумма
единицы делённой на коэффициент должна быть меньше 1».

FONBET передаёт коэффициенты как "факторы": у каждого фактора есть числовой
идентификатор `f` (тип исхода), значение `v` (коэффициент) и иногда параметр
`pt`/`p` (линия тотала или форы). Точные id могут меняться между версиями
линии, поэтому маппинг вынесен сюда и при необходимости легко правится
(см. также внешний файл factors.json, если он есть).
"""

from __future__ import annotations

from dataclasses import dataclass, field


# --- Человекочитаемые названия некоторых факторов (для подписи в интерфейсе) ---
FACTOR_NAMES: dict[int, str] = {
    921: "П1",
    922: "X",
    923: "П2",
    924: "1X",
    925: "12",
    926: "X2",
    927: "Фора 1",
    928: "Фора 2",
    930: "Тотал Б",
    931: "Тотал М",
    1672: "Обе забьют: Да",
    1673: "Обе забьют: Нет",
}


@dataclass(frozen=True)
class MarketGroup:
    """Группа взаимоисключающих исходов, которую проверяем на вилку.

    `factor_ids`   — список id факторов, образующих полную группу исходов.
    `needs_param`  — True, если исходы должны совпадать по линии (тотал/фора):
                     например «Тотал Б 2.5» и «Тотал М 2.5» — пара, а
                     «Тотал Б 2.5» и «Тотал М 3.5» — нет.
    `pair_param`   — для форы знаки параметра у пары противоположны
                     (Фора1 +1.5 ↔ Фора2 -1.5), поэтому сравниваем по модулю
                     и противоположному знаку.
    """

    name: str
    factor_ids: tuple[int, ...]
    needs_param: bool = False
    pair_param: bool = False
    forbid_ids: tuple[int, ...] = ()  # группа применяется, только если этих факторов НЕТ


# Группы, которые проверяем. Двухисходные (тоталы, «обе забьют», денежная линия
# без ничьи) дают вилки чаще всего; трёхисходный 1X2 — реже, но тоже бывает.
MARKET_GROUPS: tuple[MarketGroup, ...] = (
    MarketGroup("Исход 1X2", (921, 922, 923)),
    # Победитель без ничьи (теннис, баскетбол и т.п.). Чтобы не сработать
    # ошибочно на футболе, требуем ОТСУТСТВИЯ ничьи (922) — иначе исходы
    # П1/П2 не образуют полную группу.
    MarketGroup("Победитель (2 исхода)", (921, 923), forbid_ids=(922,)),
    MarketGroup("Двойной шанс 1X/12/X2", (924, 925, 926)),
    MarketGroup("Тотал Б/М", (930, 931), needs_param=True),
    MarketGroup("Фора 1/2", (927, 928), needs_param=True, pair_param=True),
    MarketGroup("Обе забьют Да/Нет", (1672, 1673)),
)


@dataclass
class Outcome:
    """Один исход внутри события: тип, коэффициент и (опц.) линия."""

    factor_id: int
    coeff: float
    param: float | None = None

    @property
    def label(self) -> str:
        base = FACTOR_NAMES.get(self.factor_id, f"f{self.factor_id}")
        if self.param is not None:
            return f"{base} {self.param:g}"
        return base


@dataclass
class Event:
    """Нормализованное событие FONBET с набором исходов."""

    id: int
    sport: str
    name: str
    team1: str
    team2: str
    start_time: int | None = None
    outcomes: list[Outcome] = field(default_factory=list)

    @property
    def title(self) -> str:
        if self.team1 and self.team2:
            return f"{self.team1} — {self.team2}"
        return self.name or f"Событие {self.id}"


def load_factor_overrides(path: str) -> None:
    """Подгрузить/переопределить названия факторов из внешнего JSON (опционально).

    Формат файла: {"930": "Тотал Б", "931": "Тотал М", ...}
    Это позволяет поправить маппинг без правки кода, если FONBET сменит id.
    """
    import json
    import os

    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    for key, value in data.items():
        try:
            FACTOR_NAMES[int(key)] = str(value)
        except (TypeError, ValueError):
            continue
