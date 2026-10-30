# Екі тақта көрінісі — SIMULATION

Бұл — дайын CSV негізіндегі оқылатын модельдік тақта, live GitHub Projects view емес. Ортақ ереже: In Progress ≤2/адам (≤8 команда), Review ≤3 команда. Төмендегі көріністер әр спринттің 2,5 flow day сәтінде алынған; карточка атаулары және dates CSV-де.

## S1 — 04.11.2026 13:00 +05:00

| Backlog | Ready | In Progress | Review | Done |
|---|---|---|---|---|
| — | SIM-06 | SIM-04<br>SIM-05 | SIM-01<br>SIM-02<br>SIM-03 | — |

## S2 — 11.11.2026 13:00 +05:00

| Backlog | Ready | In Progress | Review | Done |
|---|---|---|---|---|
| — | — | SIM-12<br>SIM-13<br>SIM-14 | SIM-11 | SIM-07<br>SIM-08<br>SIM-09<br>SIM-10 |

S1 орта тұсында Review=3, Doing=2; S2 сол flow day-де Review=1, Doing=3, Done=4. Бұл бір snapshot қана: орташа WIP үшін барлық timestamp интервалы интегралданады.

[Баған саясаты](01_Board_policies.md) · [Карточкалар CSV](data/simulated_board_export.csv) · [Толық метрика](03_Metrics_report.md)
