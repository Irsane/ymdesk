"""
Окно приложения (PySide6): современный тёмный интерфейс поиска вилок FONBET
с анимированными кнопками, режимом «почти-вилки» и диагностикой линии.
"""

from __future__ import annotations

import webbrowser
from datetime import datetime

from PySide6.QtCore import Qt, QThread, Signal, QTimer, QPropertyAnimation, QEasingCurve
from PySide6.QtGui import QColor, QFont
from PySide6.QtWidgets import (
    QApplication,
    QCheckBox,
    QComboBox,
    QDoubleSpinBox,
    QFrame,
    QGraphicsDropShadowEffect,
    QHBoxLayout,
    QHeaderView,
    QLabel,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QSpinBox,
    QTableWidget,
    QTableWidgetItem,
    QVBoxLayout,
    QWidget,
)

from . import client
from .arb import Arb, diagnostics, find_arbs, find_best
from .markets import FACTOR_NAMES

ACCENT = "#22c55e"      # зелёный — прибыль/действие
ACCENT_DIM = "#16a34a"
BG = "#0b0f17"
PANEL = "#121826"
CARD = "#161e2e"
TEXT = "#e6edf6"
MUTED = "#7d8aa1"

STYLE = f"""
QWidget {{
    background: {BG};
    color: {TEXT};
    font-family: 'Segoe UI', 'Inter', sans-serif;
    font-size: 13px;
}}
#TopBar {{
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 {PANEL}, stop:1 {CARD});
    border-bottom: 1px solid #1f2940;
}}
QLabel#Title {{
    font-size: 17px;
    font-weight: 700;
    color: {TEXT};
}}
QLabel#Dot {{ color: {ACCENT}; font-size: 17px; font-weight: 800; }}
QLabel.cap {{ color: {MUTED}; }}

QPushButton {{
    background: #1b2438;
    border: 1px solid #28324c;
    border-radius: 10px;
    padding: 8px 16px;
    color: {TEXT};
    font-weight: 600;
}}
QPushButton:hover {{ background: #222d46; border-color: #36436a; }}
QPushButton:pressed {{ background: #182135; }}

QPushButton#Primary {{
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 {ACCENT}, stop:1 {ACCENT_DIM});
    border: none;
    color: #04210f;
    font-weight: 800;
}}
QPushButton#Primary:hover {{
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 #2ee06a, stop:1 {ACCENT});
}}
QPushButton#Primary:pressed {{ background: {ACCENT_DIM}; }}

QPushButton#Go {{
    background: rgba(34,197,94,0.12);
    border: 1px solid rgba(34,197,94,0.5);
    border-radius: 8px;
    padding: 5px 14px;
    color: {ACCENT};
    font-weight: 700;
}}
QPushButton#Go:hover {{ background: rgba(34,197,94,0.22); }}
QPushButton#Go:pressed {{ background: rgba(34,197,94,0.32); }}

QComboBox, QDoubleSpinBox, QSpinBox {{
    background: {CARD};
    border: 1px solid #28324c;
    border-radius: 8px;
    padding: 6px 10px;
    min-height: 18px;
}}
QComboBox:hover, QDoubleSpinBox:hover, QSpinBox:hover {{ border-color: #36436a; }}
QComboBox QAbstractItemView {{
    background: {CARD};
    border: 1px solid #28324c;
    selection-background-color: {ACCENT_DIM};
    outline: none;
}}
QCheckBox {{ spacing: 8px; color: {TEXT}; }}
QCheckBox::indicator {{
    width: 18px; height: 18px;
    border-radius: 5px; border: 1px solid #36436a; background: {CARD};
}}
QCheckBox::indicator:checked {{ background: {ACCENT}; border-color: {ACCENT}; }}

QTableWidget {{
    background: {BG};
    border: none;
    gridline-color: transparent;
    outline: none;
}}
QTableWidget::item {{ padding: 8px 10px; border-bottom: 1px solid #161d2c; }}
QTableWidget::item:selected {{ background: rgba(34,197,94,0.10); color: {TEXT}; }}
QHeaderView::section {{
    background: {PANEL};
    color: {MUTED};
    padding: 10px;
    border: none;
    border-bottom: 1px solid #243049;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 11px;
}}
QStatusBar {{ background: {PANEL}; color: {MUTED}; border-top: 1px solid #1f2940; }}
QScrollBar:vertical {{ background: transparent; width: 10px; margin: 2px; }}
QScrollBar::handle:vertical {{ background: #28324c; border-radius: 5px; min-height: 30px; }}
QScrollBar::handle:vertical:hover {{ background: #36436a; }}
QScrollBar::add-line, QScrollBar::sub-line {{ height: 0; }}
"""


class GlowButton(QPushButton):
    """Кнопка с плавной анимацией «свечения» при наведении."""

    def __init__(self, text: str, object_name: str = "", glow: str = ACCENT) -> None:
        super().__init__(text)
        if object_name:
            self.setObjectName(object_name)
        self.setCursor(Qt.PointingHandCursor)
        self._fx = QGraphicsDropShadowEffect(self)
        self._fx.setColor(QColor(glow))
        self._fx.setOffset(0, 0)
        self._fx.setBlurRadius(0)
        self.setGraphicsEffect(self._fx)
        self._anim = QPropertyAnimation(self._fx, b"blurRadius", self)
        self._anim.setDuration(200)
        self._anim.setEasingCurve(QEasingCurve.OutCubic)

    def _to(self, value: float) -> None:
        self._anim.stop()
        self._anim.setEndValue(value)
        self._anim.start()

    def enterEvent(self, e):  # noqa: N802
        self._to(26)
        super().enterEvent(e)

    def leaveEvent(self, e):  # noqa: N802
        self._to(0)
        super().leaveEvent(e)


class ScanWorker(QThread):
    """Фоновый поток: качает линию и считает вилки/лучшие коэффициенты."""

    done = Signal(object, object)   # (events, rows: list[Arb])
    failed = Signal(str)

    def __init__(self, demo: bool, mode: str, min_profit: float) -> None:
        super().__init__()
        self.demo = demo
        self.mode = mode
        self.min_profit = min_profit

    def run(self) -> None:
        try:
            events = client.get_events(demo=self.demo)
            if self.mode == "best":
                rows = find_best(events, limit=150)
            else:
                rows = find_arbs(events, min_profit_pct=self.min_profit)
            self.done.emit(events, rows)
        except Exception as exc:  # noqa: BLE001
            self.failed.emit(str(exc))


class MainWindow(QMainWindow):
    COLUMNS = ["Спорт", "Событие", "Рынок", "Ставки (исход × коэф · доля)", "Маржа", "Прибыль", ""]

    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("FONBET — поиск вилок")
        self.resize(1180, 700)
        self.worker: ScanWorker | None = None
        self._events: list = []

        self._build_ui()
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.start_scan)
        self.start_scan()

    # ---------- интерфейс ----------
    def _build_ui(self) -> None:
        central = QWidget()
        root = QVBoxLayout(central)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        # Шапка с заголовком.
        top = QFrame()
        top.setObjectName("TopBar")
        top_l = QHBoxLayout(top)
        top_l.setContentsMargins(18, 14, 18, 14)
        dot = QLabel("●")
        dot.setObjectName("Dot")
        title = QLabel("FONBET Arb")
        title.setObjectName("Title")
        top_l.addWidget(dot)
        top_l.addWidget(title)
        top_l.addSpacing(10)
        sub = QLabel("поиск вилок в линии букмекера")
        sub.setProperty("class", "cap")
        sub.setStyleSheet(f"color:{MUTED};")
        top_l.addWidget(sub)
        top_l.addStretch(1)
        root.addWidget(top)

        # Панель управления.
        panel = QFrame()
        panel.setStyleSheet(f"background:{PANEL};")
        controls = QHBoxLayout(panel)
        controls.setContentsMargins(18, 12, 18, 12)
        controls.setSpacing(10)

        self.refresh_btn = GlowButton("⟳  Обновить", "Primary")
        self.refresh_btn.clicked.connect(self.start_scan)
        controls.addWidget(self.refresh_btn)

        self.diag_btn = GlowButton("Диагностика", glow="#60a5fa")
        self.diag_btn.clicked.connect(self.show_diagnostics)
        controls.addWidget(self.diag_btn)

        controls.addSpacing(8)
        controls.addWidget(self._cap("Режим:"))
        self.mode = QComboBox()
        self.mode.addItem("Вилки (маржа < 1)", "arbs")
        self.mode.addItem("Лучшие коэф. (почти-вилки)", "best")
        self.mode.currentIndexChanged.connect(self.start_scan)
        controls.addWidget(self.mode)

        controls.addWidget(self._cap("Мин. прибыль, %:"))
        self.min_profit = QDoubleSpinBox()
        self.min_profit.setRange(0.0, 100.0)
        self.min_profit.setSingleStep(0.5)
        controls.addWidget(self.min_profit)

        self.demo_cb = QCheckBox("Демо")
        controls.addWidget(self.demo_cb)

        self.auto_cb = QCheckBox("Авто")
        self.auto_cb.stateChanged.connect(self._toggle_auto)
        controls.addWidget(self.auto_cb)
        self.interval = QSpinBox()
        self.interval.setRange(10, 600)
        self.interval.setValue(60)
        self.interval.setSuffix(" с")
        self.interval.valueChanged.connect(self._reapply_interval)
        controls.addWidget(self.interval)

        controls.addStretch(1)
        root.addWidget(panel)

        # Таблица.
        self.table = QTableWidget(0, len(self.COLUMNS))
        self.table.setHorizontalHeaderLabels(self.COLUMNS)
        self.table.verticalHeader().setVisible(False)
        self.table.setShowGrid(False)
        self.table.setEditTriggers(QTableWidget.NoEditTriggers)
        self.table.setSelectionBehavior(QTableWidget.SelectRows)
        self.table.setAlternatingRowColors(False)
        self.table.verticalHeader().setDefaultSectionSize(44)
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(1, QHeaderView.Stretch)
        header.setSectionResizeMode(3, QHeaderView.Stretch)
        root.addWidget(self.table, 1)

        self.setCentralWidget(central)
        self.statusBar().showMessage("Готово к работе")

    def _cap(self, text: str) -> QLabel:
        lbl = QLabel(text)
        lbl.setStyleSheet(f"color:{MUTED};")
        return lbl

    # ---------- автообновление ----------
    def _toggle_auto(self) -> None:
        if self.auto_cb.isChecked():
            self.timer.start(self.interval.value() * 1000)
        else:
            self.timer.stop()

    def _reapply_interval(self) -> None:
        if self.auto_cb.isChecked():
            self.timer.start(self.interval.value() * 1000)

    # ---------- сканирование ----------
    def start_scan(self) -> None:
        if self.worker and self.worker.isRunning():
            return
        self.refresh_btn.setEnabled(False)
        self.refresh_btn.setText("⟳  Загрузка…")
        self.statusBar().showMessage("Загрузка линии FONBET…")
        self.worker = ScanWorker(
            self.demo_cb.isChecked(),
            self.mode.currentData(),
            self.min_profit.value(),
        )
        self.worker.done.connect(self._on_done)
        self.worker.failed.connect(self._on_fail)
        self.worker.start()

    def _on_done(self, events: list, rows: list[Arb]) -> None:
        self._events = events
        self._fill_table(rows)
        self.refresh_btn.setEnabled(True)
        self.refresh_btn.setText("⟳  Обновить")
        stamp = datetime.now().strftime("%H:%M:%S")
        if self.mode.currentData() == "best":
            self.statusBar().showMessage(
                f"[{stamp}] Событий: {len(events)} · показаны {len(rows)} лучших "
                f"рынков по марже (вилок среди них: "
                f"{sum(1 for r in rows if r.margin < 1)})"
            )
        else:
            self.statusBar().showMessage(
                f"[{stamp}] Событий проверено: {len(events)} · Вилок найдено: {len(rows)}"
            )
            if not rows:
                self.statusBar().showMessage(
                    f"[{stamp}] Событий: {len(events)} · вилок нет "
                    "(норма для одной конторы). Переключите режим на «Лучшие коэф.» "
                    "или нажмите «Диагностика»."
                )

    def _on_fail(self, message: str) -> None:
        self.refresh_btn.setEnabled(True)
        self.refresh_btn.setText("⟳  Обновить")
        self.statusBar().showMessage("Ошибка загрузки линии")
        QMessageBox.warning(
            self, "Не удалось получить линию",
            message + "\n\nВключите «Демо», чтобы проверить интерфейс без сети.",
        )

    # ---------- таблица ----------
    def _fill_table(self, rows: list[Arb]) -> None:
        self.table.setRowCount(0)
        mono = QFont("Consolas")
        for arb in rows:
            r = self.table.rowCount()
            self.table.insertRow(r)
            legs_text = "    ".join(
                f"{leg.label} ×{leg.coeff:g} ({leg.stake_share * 100:.0f}%)"
                for leg in arb.legs
            )
            self._set(r, 0, arb.event.sport, color=MUTED)
            self._set(r, 1, arb.event.title)
            self._set(r, 2, arb.market_name, color=MUTED)
            self._set(r, 3, legs_text, font=mono)
            margin_item = self._set(r, 4, f"{arb.margin:.4f}", align=Qt.AlignCenter)
            margin_item.setForeground(QColor(ACCENT if arb.margin < 1 else MUTED))

            if arb.margin < 1:
                ptxt, pcolor = f"+{arb.profit_pct:.2f}%", ACCENT
            else:
                ptxt, pcolor = f"{arb.profit_pct:.2f}%", "#ef6a6a"
            pitem = self._set(r, 5, ptxt, align=Qt.AlignCenter)
            pitem.setForeground(QColor(pcolor))
            pitem.setFont(QFont("Segoe UI", 11, QFont.Bold))

            go = QPushButton("Перейти ↗")
            go.setObjectName("Go")
            go.setCursor(Qt.PointingHandCursor)
            go.clicked.connect(lambda _=False, eid=arb.event.id: self._open_event(eid))
            wrap = QWidget()
            lay = QHBoxLayout(wrap)
            lay.setContentsMargins(8, 4, 8, 4)
            lay.addWidget(go)
            self.table.setCellWidget(r, 6, wrap)

        self.table.resizeColumnsToContents()
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(1, QHeaderView.Stretch)
        header.setSectionResizeMode(3, QHeaderView.Stretch)

    def _set(self, row, col, text, color=None, align=Qt.AlignVCenter | Qt.AlignLeft, font=None):
        item = QTableWidgetItem(str(text))
        item.setTextAlignment(align)
        if color:
            item.setForeground(QColor(color))
        if font:
            item.setFont(font)
        self.table.setItem(row, col, item)
        return item

    def _open_event(self, event_id: int) -> None:
        webbrowser.open(client.event_url(event_id))

    # ---------- диагностика ----------
    def show_diagnostics(self) -> None:
        if not self._events:
            QMessageBox.information(self, "Диагностика", "Сначала нажмите «Обновить».")
            return
        d = diagnostics(self._events)
        lines = [
            f"Событий с коэффициентами: {d['events_total']}",
            f"Настоящих вилок (маржа < 1): {d['arbs']}",
            "",
            "РЫНКИ (сколько событий содержат и минимальная маржа):",
        ]
        for g in d["groups"]:
            mm = g["min_margin"]
            mm_s = f"{mm:.4f}" if mm is not None else "—"
            flag = "  ← НЕ НАЙДЕН (проверьте id факторов)" if g["events_with_market"] == 0 else ""
            lines.append(
                f"  • {g['name']:<26} id={g['factor_ids']}  "
                f"событий: {g['events_with_market']:>5}  мин.маржа: {mm_s}{flag}"
            )
        lines += ["", "ЧАСТОТА id факторов в линии (для сверки маппинга):"]
        for fid, cnt in d["factor_freq"].items():
            name = FACTOR_NAMES.get(fid, "?неизвестный?")
            lines.append(f"  f{fid:<6} {name:<18} ×{cnt}")
        lines += [
            "",
            "Если у нужных рынков «событий: 0», значит FONBET использует другие",
            "id факторов — пришлите этот список, и я поправлю маппинг в markets.py.",
        ]

        box = QMessageBox(self)
        box.setWindowTitle("Диагностика линии FONBET")
        box.setIcon(QMessageBox.Information)
        box.setText("Что реально находится в линии и насколько близко к вилке:")
        box.setDetailedText("\n".join(lines))
        box.exec()


def run() -> None:
    import sys

    app = QApplication(sys.argv)
    app.setStyleSheet(STYLE)
    win = MainWindow()
    win.show()
    sys.exit(app.exec())
