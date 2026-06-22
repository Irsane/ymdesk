#!/usr/bin/env python3
"""
Точка входа: запуск приложения поиска вилок FONBET.

    python run.py            # обычный режим (тянет линию с сайта FONBET)
    python run.py --demo     # офлайн-проверка на демо-данных
    python run.py --scan     # без окна: вывести найденные вилки в консоль
"""

import argparse
import sys


def main() -> None:
    parser = argparse.ArgumentParser(description="Поиск вилок в линии FONBET")
    parser.add_argument("--demo", action="store_true", help="использовать демо-данные без сети")
    parser.add_argument("--scan", action="store_true", help="консольный режим без окна")
    parser.add_argument("--min-profit", type=float, default=0.0, help="мин. прибыль, %%")
    args = parser.parse_args()

    if args.scan:
        from fonbet_arb import client
        from fonbet_arb.arb import find_arbs

        events = client.get_events(demo=args.demo)
        arbs = find_arbs(events, min_profit_pct=args.min_profit)
        if not arbs:
            print("Вилок не найдено.")
            return
        for a in arbs:
            legs = "  |  ".join(f"{l.label} ×{l.coeff:g}" for l in a.legs)
            print(f"+{a.profit_pct:5.2f}%  {a.event.sport:>12} | {a.event.title:<30} "
                  f"[{a.market_name}]  {legs}  -> {client.event_url(a.event.id)}")
        print(f"\nИтого вилок: {len(arbs)}")
        return

    from fonbet_arb.gui import run
    run()


if __name__ == "__main__":
    sys.exit(main())
