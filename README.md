# D&D 2024 Portable Character Sheet & Dice Roller

A lightweight, portable, full-stack web application designed to serve as a digital character sheet and automated dice roller, built specifically for the **Dungeons & Dragons 2024 Edition** ruleset.

## 🚀 Overview

This project was developed to streamline the tabletop RPG experience. It replaces bulky paper sheets with a responsive digital interface, allowing players to manage their characters, track their stats, and perform complex dice rolls instantly.

### Key Features

* **D&D 2024 Ruleset Compliance:** Tailored to support the updated mechanics, revamped ability checks, and new character creation rules introduced in the 2024 edition.
* **Digital Character Management:** Full CRUD operations for character sheets. Easily create, update, and store your character's stats, HP, and inventory securely.
* **Integrated Dice Roller:** A built-in rolling engine that parses standard D&D dice notation (e.g., `1d20+5`, `8d6`) and calculates results instantly for attacks, damage, and saving throws.
* **Portable & Dockerized:** The entire application is containerized, making it incredibly easy to spin up locally or deploy to a VPS so your entire party can access it at the table.

## 🛠 Tech Stack

This project uses a modern, asynchronous architecture:

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
* **Backend:** Python 3.11, FastAPI, SQLAlchemy (ORM), Alembic (Migrations)
* **Database:** PostgreSQL
* **DevOps & Infrastructure:** Docker, Docker Compose

## 📂 Project Structure

* `/frontend_app` — The React user interface, featuring interactive character sheets (`CharacterSheet.tsx`) and forms.
* `/backend_api` — The FastAPI server handling the business logic, dice rolling mechanics (`roller.py`), and character database endpoints.
* `docker-compose.yml` — Orchestration file for easy multi-container deployment.

## 🔮 Future Improvements (Roadmap)

The application is actively evolving. Here are some of the key features planned for upcoming releases:

* **Public Web Release:** The ultimate goal is to deploy the application to the cloud, making it publicly accessible for the tabletop RPG community to use online without requiring local installation.
* **Session Rooms & Dungeon Master Dashboard:** Introducing dedicated multiplayer "rooms" where a Dungeon Master can invite players, monitor their live character sheets, track initiative, and make secret rolls behind the virtual screen.
* **Real-Time Party Synchronization:** Implementing WebSockets so that HP updates, active conditions, and dice rolls are instantly broadcasted live to everyone in the session room.
* **Advanced Spellcasting & Magic Management:** A dedicated interface to track spell slots, prepare daily spells, and manage custom spellbooks (e.g., quickly pulling up specific spell lists and save DCs).
* **Inventory & Encumbrance Tracking:** Automated weight calculation for carried items, weapons, and treasure based on the 2024 revised strength and capacity rules.
* **Custom Roll Macros & Homebrew Support:** Giving users the ability to save frequently used complex rolls (like specific weapon mastery properties) and toggle optional homebrew mechanics.
* **Dark Mode & Mobile Optimization:** Enhancing the UI to be perfectly suited for late-night gaming sessions and seamless one-handed use on smartphones.

## ⚙️ Getting Started

### Prerequisites

Make sure you have [Docker](https://www.docker.com/) and Docker Compose installed on your system.

### Installation & Running

1. Clone the repository:
   ```bash
   git clone https://github.com/h00yaday/Charnik_online.git
   cd Charnik_online
   ```
