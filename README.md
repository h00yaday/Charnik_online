# D&D 2024 Portable Character Sheet & Dice Roller

A lightweight, portable, full-stack web application designed to serve as an interactive digital character sheet and automated dice roller, built specifically for the **Dungeons & Dragons 2024 Edition** ruleset.

## 🔗 Live Access

The application is deployed and available for use at:
**[https://charnik-online.tech/](https://charnik-online.tech/)**

## 🚀 Overview

This project streamlines the tabletop RPG experience by replacing bulky paper sheets with a highly responsive digital interface. It allows players to manage their characters, track health and spell slots, and perform complex dice rolls instantly with a single click.

## 🛠 Tech Stack

The project uses a modern, asynchronous architecture to ensure high performance and responsiveness:

* **Frontend:** Built with **React 18** and **TypeScript** for a robust, type-safe UI. **Vite** is used as the build tool, and **Tailwind CSS** for rapid, responsive styling.
* **Backend:** Powered by **Python 3.11** and **FastAPI**, providing a fast and efficient REST API.
* **Database & ORM:** **PostgreSQL** handles data persistence, while **SQLAlchemy** serves as the ORM with **Alembic** managing database migrations.
* **Infrastructure:** Fully containerized using **Docker** and **Docker Compose** for consistent deployment across environments.

## 🗺️ Development Roadmap

The application is actively evolving. Below are the key features planned for future updates:

### Core Gameplay Enhancements

- [ ]  **Dynamic Attribute Modifiers:** Implement logic to automatically apply stat bonuses from gear and features stored in the database.
- [ ]  **Equipment & Encumbrance:** A full inventory system to track items and gold with automated weight calculations based on 2024 rules.
- [ ]  **Conditions & Inspiration:** Dedicated UI trackers for status effects (e.g., Poisoned, Grappled) and Heroic Inspiration.
- [ ]  **Death Saving Throws:** Integrated counter for death saves when a character drops to 0 HP.
- [ ]  **Rest Mechanics:** Automated recovery of HP and Hit Dice during Short and Long Rests.
- [ ]  Add editable movespeed

### Advanced Features & Multiplayer

- [ ]  **Smart Combat Panel:** A unified interface combining weapon attacks and spellcasting for seamless turn management.
- [ ]  **DM Dashboard & Session Rooms:** Tools for Dungeon Masters to view player sheets, track party initiative, and manage secret rolls in real-time.
- [ ]  **Real-Time Sync (WebSockets):** Live updates for party members to see each other's rolls and status changes instantly.
- [ ]  **Mobile Optimization:** Further UI refinements for a smoother "single-hand" experience on mobile devices during table sessions.
