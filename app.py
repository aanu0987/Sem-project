from datetime import datetime
import os

from bson.objectid import ObjectId
from flask import Flask, flash, redirect, render_template, request, session, url_for
from pymongo import MongoClient
from werkzeug.security import check_password_hash, generate_password_hash


app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-change-me")

mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
mongo_client = MongoClient(mongo_uri)
db = mongo_client[os.getenv("MONGO_DB", "student_management")]
teachers_col = db["teachers"]
students_col = db["students"]
attendance_col = db["attendance"]

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin@123"


def is_admin() -> bool:
    return session.get("role") == "admin"


def is_teacher() -> bool:
    return session.get("role") == "teacher"


@app.route("/")
def index():
    if is_admin():
        return redirect(url_for("admin_dashboard"))
    if is_teacher():
        return redirect(url_for("teacher_dashboard"))
    return render_template("login.html")


@app.route("/login", methods=["POST"])
def login():
    role = request.form.get("role", "").strip()
    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")

    if role == "admin":
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session.clear()
            session["role"] = "admin"
            session["username"] = ADMIN_USERNAME
            flash("Logged in as Admin.", "success")
            return redirect(url_for("admin_dashboard"))
        flash("Invalid admin credentials.", "danger")
        return redirect(url_for("index"))

    if role == "teacher":
        teacher = teachers_col.find_one({"username": username})
        if teacher and check_password_hash(teacher["password"], password):
            session.clear()
            session["role"] = "teacher"
            session["username"] = teacher["username"]
            session["teacher_name"] = teacher["name"]
            flash("Logged in as Teacher.", "success")
            return redirect(url_for("teacher_dashboard"))
        flash("Invalid teacher credentials.", "danger")
        return redirect(url_for("index"))

    flash("Please choose a valid role.", "warning")
    return redirect(url_for("index"))


@app.route("/logout")
def logout():
    session.clear()
    flash("Logged out successfully.", "info")
    return redirect(url_for("index"))


@app.route("/admin/dashboard")
def admin_dashboard():
    if not is_admin():
        flash("Admin access required.", "danger")
        return redirect(url_for("index"))

    teachers = list(teachers_col.find({}, {"password": 0}).sort("name", 1))
    return render_template("admin_dashboard.html", teachers=teachers)


@app.route("/admin/teachers/add", methods=["POST"])
def add_teacher():
    if not is_admin():
        flash("Admin access required.", "danger")
        return redirect(url_for("index"))

    name = request.form.get("name", "").strip()
    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")

    if not name or not username or not password:
        flash("All teacher fields are required.", "warning")
        return redirect(url_for("admin_dashboard"))

    if teachers_col.find_one({"username": username}):
        flash("Teacher username already exists.", "warning")
        return redirect(url_for("admin_dashboard"))

    teachers_col.insert_one(
        {
            "name": name,
            "username": username,
            "password": generate_password_hash(password),
            "created_at": datetime.utcnow(),
        }
    )
    flash("Teacher added successfully.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/teachers/delete/<teacher_id>", methods=["POST"])
def delete_teacher(teacher_id):
    if not is_admin():
        flash("Admin access required.", "danger")
        return redirect(url_for("index"))

    teacher = teachers_col.find_one({"_id": ObjectId(teacher_id)})
    if not teacher:
        flash("Teacher not found.", "warning")
        return redirect(url_for("admin_dashboard"))

    teachers_col.delete_one({"_id": ObjectId(teacher_id)})

    students_col.delete_many({"created_by": teacher["username"]})
    attendance_col.delete_many({"teacher": teacher["username"]})

    flash("Teacher and related records deleted.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/teacher/dashboard")
def teacher_dashboard():
    if not is_teacher():
        flash("Teacher access required.", "danger")
        return redirect(url_for("index"))

    current_teacher = session["username"]
    students = list(students_col.find({"created_by": current_teacher}).sort("student_name", 1))

    attendance = list(
        attendance_col.find({"teacher": current_teacher}).sort([("date", -1), ("student_id", 1)])
    )

    return render_template(
        "teacher_dashboard.html",
        students=students,
        attendance=attendance,
        teacher_name=session.get("teacher_name", current_teacher),
    )


@app.route("/teacher/students/add", methods=["POST"])
def add_student():
    if not is_teacher():
        flash("Teacher access required.", "danger")
        return redirect(url_for("index"))

    student_id = request.form.get("student_id", "").strip()
    student_name = request.form.get("student_name", "").strip()
    student_class = request.form.get("student_class", "").strip()
    email = request.form.get("email", "").strip()

    if not student_id or not student_name or not student_class:
        flash("Student ID, name, and class are required.", "warning")
        return redirect(url_for("teacher_dashboard"))

    if students_col.find_one({"student_id": student_id}):
        flash("Student ID already exists.", "warning")
        return redirect(url_for("teacher_dashboard"))

    students_col.insert_one(
        {
            "student_id": student_id,
            "student_name": student_name,
            "student_class": student_class,
            "email": email or None,
            "created_by": session["username"],
            "created_at": datetime.utcnow(),
        }
    )
    flash("Student added successfully.", "success")
    return redirect(url_for("teacher_dashboard"))


@app.route("/teacher/students/delete/<student_id>", methods=["POST"])
def delete_student(student_id):
    if not is_teacher():
        flash("Teacher access required.", "danger")
        return redirect(url_for("index"))

    current_teacher = session["username"]
    student = students_col.find_one({"student_id": student_id, "created_by": current_teacher})
    if not student:
        flash("Student not found.", "warning")
        return redirect(url_for("teacher_dashboard"))

    students_col.delete_one({"_id": student["_id"]})
    attendance_col.delete_many({"student_id": student_id, "teacher": current_teacher})

    flash("Student and related attendance deleted.", "success")
    return redirect(url_for("teacher_dashboard"))


@app.route("/teacher/attendance/add", methods=["POST"])
def add_attendance():
    if not is_teacher():
        flash("Teacher access required.", "danger")
        return redirect(url_for("index"))

    student_id = request.form.get("student_id", "").strip()
    date = request.form.get("date", "").strip()
    status = request.form.get("status", "").strip()

    if status not in {"Present", "Absent"}:
        flash("Attendance status must be Present or Absent.", "warning")
        return redirect(url_for("teacher_dashboard"))

    student = students_col.find_one({"student_id": student_id, "created_by": session["username"]})
    if not student:
        flash("Invalid student selection.", "warning")
        return redirect(url_for("teacher_dashboard"))

    if not date:
        flash("Date is required.", "warning")
        return redirect(url_for("teacher_dashboard"))

    existing = attendance_col.find_one(
        {"student_id": student_id, "date": date, "teacher": session["username"]}
    )

    if existing:
        attendance_col.update_one(
            {"_id": existing["_id"]}, {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        flash("Attendance updated for selected date.", "success")
    else:
        attendance_col.insert_one(
            {
                "student_id": student_id,
                "date": date,
                "status": status,
                "teacher": session["username"],
                "created_at": datetime.utcnow(),
            }
        )
        flash("Attendance marked successfully.", "success")

    return redirect(url_for("teacher_dashboard"))


@app.route("/teacher/attendance/update/<attendance_id>", methods=["POST"])
def update_attendance(attendance_id):
    if not is_teacher():
        flash("Teacher access required.", "danger")
        return redirect(url_for("index"))

    status = request.form.get("status", "").strip()
    if status not in {"Present", "Absent"}:
        flash("Invalid status.", "warning")
        return redirect(url_for("teacher_dashboard"))

    result = attendance_col.update_one(
        {"_id": ObjectId(attendance_id), "teacher": session["username"]},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}},
    )

    if result.matched_count == 0:
        flash("Attendance record not found.", "warning")
    else:
        flash("Attendance record updated.", "success")

    return redirect(url_for("teacher_dashboard"))


@app.route("/teacher/attendance/delete/<attendance_id>", methods=["POST"])
def delete_attendance(attendance_id):
    if not is_teacher():
        flash("Teacher access required.", "danger")
        return redirect(url_for("index"))

    result = attendance_col.delete_one(
        {"_id": ObjectId(attendance_id), "teacher": session["username"]}
    )

    if result.deleted_count == 0:
        flash("Attendance record not found.", "warning")
    else:
        flash("Attendance record deleted.", "success")

    return redirect(url_for("teacher_dashboard"))


if __name__ == "__main__":
    app.run(debug=True)
