# D&D 2024 Portable Character Sheet & Dice Roller

A lightweight, portable, full-stack web application designed to serve as an interactive digital character sheet and automated dice roller, built specifically for the **Dungeons & Dragons 2024 Edition** ruleset.

## 🚀 Overview

This project streamlines the tabletop RPG experience by replacing bulky paper sheets with a highly responsive digital interface. It allows players to manage their characters, track their health and spell slots, and perform complex dice rolls instantly with a single click.

### ✨ Key Features

* **D&D 2024 Ruleset Compliance:** Tailored to support updated mechanics, revamped ability checks, and new character rules introduced in the 2024 edition.
* **Interactive Digital Sheet:** Full CRUD operations for character stats. Dynamically calculates your Proficiency Bonus and Initiative based on your character's level and Dexterity.
* **Universal Click-to-Roll Engine:** Click directly on stats, saving throws, skills, weapons, or spells to automatically trigger a d20 roll with all your modifiers applied. Parses standard D&D dice notation (e.g., `1d20+5`, `8d6`) and calculates hits, criticals, and damage instantly.
* **Advanced Magic Management:** Dedicated spellbook interface. Track spell slots by level, mark them as used during combat, and cast spells that automatically handle spell attack rolls and damage output.
* **Rest & Health Tracking:** Manage your HP pool dynamically and restore your health and spell slots instantly using the built-in Short and Long Rest mechanics.
* **Portable & Dockerized:** Containerized architecture makes it incredibly easy to spin up locally or deploy to a VPS so your entire party can access it at the table.

## 🛠 Tech Stack

Built with a modern, asynchronous architecture:

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
* **Backend:** Python 3.11, FastAPI, SQLAlchemy (ORM), Alembic (Migrations)
* **Database:** PostgreSQL
* **DevOps:** Docker, Docker Compose

## 📂 Project Structure

* `/frontend_app` — The React user interface, featuring interactive character sheets, dynamic tabs (`Stats`, `Combat`, `Spells`), and rolling modals.
* `/backend_api` — The FastAPI server handling the business logic, the dice rolling engine (`roller.py`), and character database endpoints.
* `docker-compose.yml` — Orchestration file for easy multi-container deployment.

## 🗺️ Development Plan (Roadmap)

The application is actively evolving. Here is the current progress and the roadmap for upcoming releases:

### Current Priorities (To-Do)

- [X]  **Stat & Skill Rolls:** Click directly on core stats and skills to instantly trigger checks.
- [X]  **Magic & Spell Slots Tracker:** Manage spells by level, track daily slots, and cast spells with built-in attack rolls.
- [ ]  **Equipment & Encumbrance (Next up!):** Implement a backpack system to track items (potions, gold, gear) with automated weight calculation based on the 2024 Strength rules.
- [ ]  **Smart Combat Panel:** Combine weapon attacks and combat spells into a single, unified interface for faster decision-making in the heat of battle.

### Future Improvements

* **Public Web Release:** Deploy the application to the cloud, making it publicly accessible for the TTRPG community.
* **Session Rooms & DM Dashboard:** Introduce dedicated multiplayer "rooms" where a Dungeon Master can monitor live character sheets, track initiative, and make secret rolls.
* **Real-Time Party Synchronization:** Implement WebSockets so that HP updates, active conditions, and dice rolls are instantly broadcasted live to everyone in the session room.
* **Custom Roll Macros & Homebrew:** Allow users to save frequently used complex rolls (like specific weapon mastery properties) and toggle optional homebrew mechanics.
* **Dark Mode & Mobile Optimization:** Enhance the UI for seamless one-handed use on smartphones during late-night gaming sessions.

## ⚙️ Getting Started

### Prerequisites

Make sure you have [Docker](https://www.docker.com/) and Docker Compose installed on your system.

### Installation & Running

1. Clone the repository:

   ```
   git clone [https://github.com/h00yaday/Charnik_online.git](https://github.com/h00yaday/Charnik_online.git)
   cd Charnik_online 
   ```
   2. Build and start the containers:

   ```
   docker-compose up --build
   ```
   3. Open your browser and navigate to `http://localhost:5173` to access the application. The API documentation is available at `http://localhost:8000/docs`.
