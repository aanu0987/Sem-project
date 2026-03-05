# Student Management System

A role-based Student Management System built with **Node.js, Express, EJS, and MongoDB**.

## Features

- Secure login with session-based authentication.
- Role-based access control:
  - **Admin** can manage teacher accounts.
  - **Teacher** can manage students and attendance.
- Default admin credentials seeded on startup:
  - Username: `admin`
  - Password: `admin@123`
- Teacher CRUD (create/list/delete).
- Student CRUD (create/list/delete).
- Attendance management:
  - Mark Present/Absent per student.
  - Store date and teacher who recorded it.
  - View attendance history.

## Data Collections

- `admins`
- `teachers`
- `students`
- `attendance`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create environment file:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with MongoDB connection and session secret.
4. Start the app:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

## Routes Overview

- Auth:
  - `GET /login`
  - `POST /login`
  - `GET /logout`
- Admin:
  - `GET /admin/dashboard`
  - `POST /admin/teachers`
  - `POST /admin/teachers/:id/delete`
- Teacher:
  - `GET /teacher/dashboard`
  - `POST /teacher/students`
  - `POST /teacher/students/:id/delete`
  - `POST /teacher/students/:id/attendance`
  - `GET /teacher/attendance`
