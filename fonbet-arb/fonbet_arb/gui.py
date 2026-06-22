"""
Окно приложения (PySide6): таблица найденных вилок FONBET с кнопкой «Перейти».
"""

from __future__ import annotations

import webbrowser
from datetime import datetime

from PySide6.QtCore import Qt, QThread, Signal, QTimer
from PySide6.QtGui import QColor
from PySide6.QtWidgets import (
    QApplication,
    QCheckBox,
    QDoubleSpinBox,
    QHBoxLayout,
    QHeaderView,
    QLabel,
    QMainWindow,
    QMessageBox,
    QProgressBar,
    QPushButton,
    QSpinBox,
    QStatusBar,
    QTableWidget,
    QTableWidgetItem,
    QVBoxLayout,
    QWidget,
)

from . import client
from .arb import Arb, find_arbs


class ScanWorker(QThread):
    """Фоновый поток: качает линию и ищет вилки, чтобы не вешать интерфейс."""

    finished_ok = Signal(list, int)   # (список вилок, число просмотренных событий)
    failed = Signal(str)

    def __init__(self, demo: bool, min_profit: float) -> None:
        super().__init__()
        self.demo = demo
        self.min_profit = min_profit

    def run(self) -> None:
        try:
            events = client.get_events(demo=self.demo)
            arbs = find_arbs(events, min_profit_pct=self.min_profit)
            self.finished_ok.emit(arbs, len(events))
        except Exception as exc:  # noqa: BLE001
            self.failed.emit(str(exc))


class MainWindow(QMainWindow):
    COLUMNS = ["Спорт", "Событие", "Рынок", "Ставки (исход × коэф)", "Прибыль", ""]

    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("FONBET — поиск вилок")
        self.resize(1100, 640)
        self.worker: ScanWorker | None = None
        self._arbs: list[Arb] = []

        self._build_ui()

        # Автообновление по таймеру.
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.start_scan)

        self.start_scan()

    # ---------- построение интерфейса ----------
    def _build_ui(self) -> None:
        central = QWidget()
        root = QVBoxLayout(central)

        # Панель управления.
        controls = QHBoxLayout()

        self.refresh_btn = QPushButton("Обновить")
        self.refresh_btn.clicked.connect(self.start_scan)
        controls.addWidget(self.refresh_btn)

        controls.addWidget(QLabel("Мин. прибыль, %:"))
        self.min_profit = QDoubleSpinBox()
        self.min_profit.setRange(0.0, 100.0)
        self.min_profit.setSingleStep(0.5)
        self.min_profit.setValue(0.0)
        controls.addWidget(self.min_profit)

        self.demo_cb = QCheckBox("Демо-режим (без сети)")
        controls.addWidget(self.demo_cb)

        self.auto_cb = QCheckBox("Автообновление")
        self.auto_cb.stateChanged.connect(self._toggle_auto)
        controls.addWidget(self.auto_cb)

        controls.addWidget(QLabel("каждые"))
        self.interval = QSpinBox()
        self.interval.setRange(10, 600)
        self.interval.setValue(60)
        self.interval.setSuffix(" с")
        self.interval.valueChanged.connect(self._reapply_interval)
        controls.addWidget(self.interval)

        controls.addStretch(1)
        root.addLayout(controls)

        # Прогресс-бар (бегунок во время загрузки).
        self.progress = QProgressBar()
        self.progress.setRange(0, 0)
        self.progress.hide()
        root.addWidget(self.progress)

        # Таблица результатов.
        self.table = QTableWidget(0, len(self.COLUMNS))
        self.table.setHorizontalHeaderLabels(self.COLUMNS)
        self.table.verticalHeader().setVisible(False)
        self.table.setEditTriggers(QTableWidget.NoEditTriggers)
        self.table.setSelectionBehavior(QTableWidget.SelectRows)
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(1, QHeaderView.Stretch)
        header.setSectionResizeMode(3, QHeaderView.Stretch)
        root.addWidget(self.table)

        self.setCentralWidget(central)
        self.setStatusBar(QStatusBar())
        self.statusBar().showMessage("Готово к работе")

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
        self.progress.show()
        self.statusBar().showMessage("Загрузка линии FONBET…")
        self.worker = ScanWorker(self.demo_cb.isChecked(), self.min_profit.value())
        self.worker.finished_ok.connect(self._on_done)
        self.worker.failed.connect(self._on_fail)
        self.worker.start()

    def _on_done(self, arbs: list[Arb], n_events: int) -> None:
        self._arbs = arbs
        self._fill_table(arbs)
        self.progress.hide()
        self.refresh_btn.setEnabled(True)
        stamp = datetime.now().strftime("%H:%M:%S")
        self.statusBar().showMessage(
            f"[{stamp}] Событий проверено: {n_events} · Вилок найдено: {len(arbs)}"
        )

    def _on_fail(self, message: str) -> None:
        self.progress.hide()
        self.refresh_btn.setEnabled(True)
        self.statusBar().showMessage("Ошибка загрузки линии")
        QMessageBox.warning(
            self,
            "Не удалось получить линию",
            message
            + "\n\nСовет: включите «Демо-режим», чтобы проверить работу "
            "интерфейса без подключения к FONBET.",
        )

    # ---------- таблица ----------
    def _fill_table(self, arbs: list[Arb]) -> None:
        self.table.setRowCount(0)
        for arb in arbs:
            row = self.table.rowCount()
            self.table.insertRow(row)

            legs_text = "   |   ".join(
                f"{leg.label} × {leg.coeff:g} ({leg.stake_share * 100:.0f}%)"
                for leg in arb.legs
            )
            values = [
                arb.event.sport,
                arb.event.title,
                arb.market_name,
                legs_text,
                f"+{arb.profit_pct:.2f}%",
            ]
            for col, text in enumerate(values):
                item = QTableWidgetItem(text)
                if col == 4:
                    item.setForeground(QColor("#1faa59"))
                    item.setTextAlignment(Qt.AlignCenter)
                self.table.setItem(row, col, item)

            go_btn = QPushButton("Перейти")
            go_btn.clicked.connect(lambda _=False, eid=arb.event.id: self._open_event(eid))
            self.table.setCellWidget(row, 5, go_btn)

        self.table.resizeColumnsToContents()
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(1, QHeaderView.Stretch)
        header.setSectionResizeMode(3, QHeaderView.Stretch)

    def _open_event(self, event_id: int) -> None:
        webbrowser.open(client.event_url(event_id))


def run() -> None:
    import sys

    app = QApplication(sys.argv)
    win = MainWindow()
    win.show()
    sys.exit(app.exec())
