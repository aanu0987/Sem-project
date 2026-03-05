# Student Management System

A Flask + MongoDB web app with role-based authentication for **Admin** and **Teacher** roles.

## Features

- Admin login (default: `admin` / `admin@123`)
- Admin dashboard
  - Add teacher
  - View teachers
  - Delete teacher
- Teacher dashboard
  - Add/view/delete students
  - Mark attendance as Present/Absent
  - View/update/delete attendance history
- MongoDB collections:
  - `teachers`
  - `students`
  - `attendance`

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Ensure MongoDB is running locally (or set `MONGO_URI`).

3. Run app:

```bash
python app.py
```

4. Open `http://127.0.0.1:5000`.

## Environment variables

- `SECRET_KEY` - Flask secret key
- `MONGO_URI` - MongoDB URI (default: `mongodb://localhost:27017/`)
- `MONGO_DB` - DB name (default: `student_management`)
