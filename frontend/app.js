
const API_URL = "http://localhost:8080/api/students";

// Get HTML elements
const studentForm = document.getElementById("studentForm");
const studentTableBody = document.getElementById("studentTableBody");
const message = document.getElementById("message");
const refreshButton = document.getElementById("refreshButton");
const studentSearch = document.getElementById("studentSearch");
const clearSearch = document.getElementById("clearSearch");

// Store all student records
let allStudents = [];

// Show success or error messages
function showMessage(text, isError = false) {
    if (!message) return;

    message.textContent = text;
    message.style.color = isError ? "#dc2626" : "#15803d";
}

// Update dashboard statistics
function updateDashboardCounts(students) {
    const totalElement = document.getElementById("totalStudents");
    const departmentElement = document.getElementById("departmentCount");
    const yearElement = document.getElementById("yearCount");

    if (totalElement) {
        totalElement.textContent = students.length;
    }

    const departments = new Set(
        students
            .map(student => student.department)
            .filter(Boolean)
    );

    const years = new Set(
        students
            .map(student => student.yearOfStudy)
            .filter(value => value !== null && value !== undefined && value !== "")
    );

    if (departmentElement) {
        departmentElement.textContent = departments.size;
    }

    if (yearElement) {
        yearElement.textContent = years.size;
    }
}

// Load student records from Spring Boot
async function loadStudents() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Server returned status " + response.status);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("The API did not return a student list.");
        }

        allStudents = data;

        updateDashboardCounts(allStudents);
        searchStudents();

        showMessage("Student records loaded successfully.");
    } catch (error) {
        console.error("Error loading students:", error);

        allStudents = [];
        updateDashboardCounts(allStudents);
        displayStudents([]);

        showMessage(
            "Unable to load students. Check that Spring Boot is running.",
            true
        );
    }
}

// Display student records in the table
function displayStudents(students) {
    if (!studentTableBody) {
        console.error(
            "Cannot find the table body with ID studentTableBody."
        );
        return;
    }

    studentTableBody.replaceChildren();

    if (students.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.textContent = "No matching students found.";
        cell.style.textAlign = "center";
        cell.style.padding = "20px";

        row.appendChild(cell);
        studentTableBody.appendChild(row);
        return;
    }

    students.forEach(student => {
        const row = document.createElement("tr");

        const values = [
            student.id,
            student.rollNumber,
            student.name,
            student.email,
            student.department,
            student.yearOfStudy
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value ?? "";
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", () => {
            deleteStudent(student.id);
        });

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);
        studentTableBody.appendChild(row);
    });
}

// Search students by roll number, name, email or department
function searchStudents() {
    const searchText = studentSearch
        ? studentSearch.value.trim().toLowerCase()
        : "";

    const filteredStudents = allStudents.filter(student => {
        return [
            student.rollNumber,
            student.name,
            student.email,
            student.department
        ].some(value =>
            String(value ?? "").toLowerCase().includes(searchText)
        );
    });

    displayStudents(filteredStudents);
}

// Add a new student
if (studentForm) {
    studentForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const rollNumber = document.getElementById("rollNumber");
        const name = document.getElementById("name");
        const email = document.getElementById("email");
        const department = document.getElementById("department");
        const yearOfStudy = document.getElementById("yearOfStudy");

        if (
            !rollNumber ||
            !name ||
            !email ||
            !department ||
            !yearOfStudy
        ) {
            showMessage("A student form field is missing from the HTML.", true);
            return;
        }

        const student = {
            rollNumber: rollNumber.value.trim(),
            name: name.value.trim(),
            email: email.value.trim(),
            department: department.value.trim(),
            yearOfStudy: Number(yearOfStudy.value)
        };

        if (
            !student.rollNumber ||
            !student.name ||
            !student.email ||
            !student.department ||
            !yearOfStudy.value
        ) {
            showMessage("Please fill in all student fields.", true);
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(student)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Could not add student.");
            }

            studentForm.reset();
            showMessage("Student added successfully.");
            await loadStudents();
        } catch (error) {
            console.error("Error adding student:", error);
            showMessage(
                "Unable to add student. Please check the form and backend.",
                true
            );
        }
    });
}

// Delete a student
async function deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this student?")) {
        return;
    }

    try {
        const response = await fetch(API_URL + "/" + id, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Could not delete student.");
        }

        showMessage("Student deleted successfully.");
        await loadStudents();
    } catch (error) {
        console.error("Error deleting student:", error);
        showMessage("Unable to delete student.", true);
    }
}

// Search as the user types
if (studentSearch) {
    studentSearch.addEventListener("input", searchStudents);
}

// Clear the search
if (clearSearch) {
    clearSearch.addEventListener("click", function () {
        if (studentSearch) {
            studentSearch.value = "";
        }

        searchStudents();
    });
}

// Refresh student records
if (refreshButton) {
    refreshButton.addEventListener("click", loadStudents);
}

// Load records when the page opens
console.log("Student Management Portal JavaScript loaded.");
loadStudents();
