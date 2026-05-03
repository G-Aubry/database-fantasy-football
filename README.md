# Fantasy Football App

## Project Description

This repository contains a fantasy football web application built with Next.js and Prisma. Users can sign up, log in, create or join leagues, manage rosters, and view player statistics. The app supports multiple scoring modes (Standard, PPR, and Half PPR), and includes free agency management, player search and filtering, lineup rules, and team scoring.

## Features

- User authentication with login/signup
- Remember-me functionality with extended session duration
- League creation and league joining
- Free agency table with position filters and search
- Roster management with starter/bench assignment
- Lineup validation rules for fantasy positions
- Player detail pages with weekly stats and point calculations
- MySQL + Prisma database integration with CSV seed data

## Live Demo

The live deployment is available at:

https://my-fantasy-league.vercel.app/

> Note: The demo may not always be available if the database or hosting instance is not running.

## How to Run the App

1. Clone the repository:

```bash
git clone https://github.com/G-Aubry/database-fantasy-football.git
cd database-fantasy-football
```

2. Install dependencies:

```bash
npm install
```

3. Set up the database (see Database Setup section below).

4. Run the development server:

```bash
npm run dev
```

5. Open the app in your browser:

```text
http://localhost:3000
```

## Database Setup

### Schema Setup

Create a `.env` file in the project root with your MySQL connection string:

```env
# Database connection
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"

# NextAuth Configuration (Required for local development)
NEXTAUTH_URL="http://localhost:3000"
# Can be anything
NEXTAUTH_SECRET="your_random_secret_string_here"
```

Then run:

```bash
npx prisma db push
npx prisma generate
```

### Seed Data

The seed data is stored in `prisma/data` as CSV files. To import the seed data, run:

```bash
npx prisma db seed
```

The seed script will load data from the following CSV files:

- `prisma/data/League.csv`
- `prisma/data/LeaguePlayerStats.csv`
- `prisma/data/PlayerStats.csv`
- `prisma/data/Players.csv`
- `prisma/data/Rosters.csv`
- `prisma/data/Teams.csv`
- `prisma/data/Users.csv`

## Default Test Users

Use the following accounts to test the app:

- **Username:** Test1
  **Password:** TrustInMe

- **Username:** Test2
  **Password:** AnotherPassToForg3t

## Tech Stack

- Next.js
- React
- Prisma
- MySQL
- NextAuth
- Vercel
- Aiven

## License

This project is licensed under the Apache License 2.0. See the `LICENSE` file for details.
