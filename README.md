# CampusHub

A campus event registration web application powered by **Next.js**, **React**, and **MongoDB**. Students discover clubs and reserve places. Organizers publish events and manage their attendee registrations.

## Features

- **Student Access**: Sign up, sign in, browse events, filter by interest, reserve available places, and cancel before an event starts.
- **Organizer Workspace**: Create clubs, publish and edit events, cancel events with an explanatory reason, and view private attendee rosters.
- **Event Discovery**: Keyword search across titles and clubs, category filters, and past event history toggle.
- **Database**: MongoDB with the native driver.

---

## Quick Start (Run Locally)

### Prerequisites

- **Node.js**: v22.12+ or v24+
- **MongoDB**: A running MongoDB instance (either local MongoDB on port 27017 or a free cloud cluster from [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database)).

---

### Quick Start via Batch Scripts (`run/` Directory)

For quick local development on Windows, double-click any batch script located in the `run/` folder (or run `run.bat` at project root):

| Script | Description |
| :--- | :--- |
| **`run\start.bat`** | Main launcher: checks Node.js, auto-installs dependencies, opens browser to [http://localhost:3001](http://localhost:3001), and starts the dev server |
| **`run\seed.bat`** | Populates MongoDB with sample clubs, campus events, and demo accounts |
| **`run\setup.bat`** | First-time setup: generates `.env` and installs all dependencies |
| **`run\test.bat`** | Runs the automated test suite and ESLint code quality checks |
| **`run\build.bat`** | Compiles the production Next.js application |
| **`run\set-role.bat`** | Interactive CLI to promote any user to `ORGANIZER` or `STUDENT` |
| **`run.bat`** | Root shortcut that immediately launches `run\start.bat` |

---

### Manual Setup Steps

#### 1. Setup Environment

```sh
npm run env:setup
```

Configure `MONGODB_URI` in `.env`:

```env
MONGODB_URI="mongodb://127.0.0.1:27017/campushub"
```
*(Or your MongoDB Atlas URI: `mongodb+srv://<username>:<password>@cluster.mongodb.net/campushub`)*

#### 2. Seed Demo Data

```sh
npm run db:seed
```

Demo accounts created by seed:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student** | `student@campushub.test` | `CampusHub-Demo-2026!` |
| **Organizer** | `organizer@campushub.test` | `CampusHub-Demo-2026!` |

#### 3. Start Development Server

```sh
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## User Roles & Administration

To promote any registered user to an organizer:

```sh
npm run user:role -- person@example.com ORGANIZER
```

To demote back to student:

```sh
npm run user:role -- person@example.com STUDENT
```

---

## Testing & Quality Checks

```sh
# Run unit tests
npm test

# Run code style & lint check
npm run lint

# Format code
npm run format
```

---

## Project Structure

| Folder | What to read there |
| :--- | :--- |
| `run` | Windows batch scripts (`start.bat`, `seed.bat`, `setup.bat`, `test.bat`, `build.bat`, `set-role.bat`) |
| `src/app` | Next.js App Router pages, auth routes, and server actions (`actions.js`) |
| `src/components` | Reusable UI components (event cards, forms, feedback) |
| `src/lib` | Database client (`db.js`), Better Auth (`auth.js`), timezone utilities, and domain logic |
| `scripts` | Role management CLI and database seed script |
| `tests` | Automated unit tests |
