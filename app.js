let config = {};
let tasks = [];

const taskForm = document.getElementById("task-form");
const taskTitle = document.getElementById("task-title");
const taskDescription = document.getElementById("task-description");
const taskList = document.getElementById("task-list");
const statusMessage = document.getElementById("status-message");
const submitButton = document.getElementById("task-submit");

function showMessage(message) {
    statusMessage.textContent = message;
}

function apiUrl() {
    return `${config.supabaseUrl}/rest/v1/${config.tableName}`;
}

function requestHeaders() {
    return {
        "apikey": config.supabasePublishableKey,
        "Authorization": `Bearer ${config.supabasePublishableKey}`,
        "Content-Type": "application/json"
    };
}

// Load configuration and tasks
async function initializeApp() {
    try {
        const response = await fetch("config.json");

        if (!response.ok) {
            throw new Error("Could not load config.json");
        }

        config = await response.json();

        if (!config.supabaseUrl || !config.supabasePublishableKey) {
            throw new Error("Supabase configuration is incomplete.");
        }

        await loadTasks();

    } catch (error) {
        console.error(error);
        showMessage("Connection error: " + error.message);
    }
}

// READ: Get all tasks from Supabase
async function loadTasks() {
    try {
        const response = await fetch(
            `${apiUrl()}?select=*&order=id.desc`,
            {
                method: "GET",
                headers: requestHeaders()
            }
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        tasks = await response.json();
        displayTasks();

        showMessage("Tasks loaded successfully.");

    } catch (error) {
        console.error(error);
        showMessage("Unable to load tasks: " + error.message);
    }
}

// DISPLAY: Show tasks on the webpage
function displayTasks() {
    taskList.innerHTML = "";

    if (tasks.length === 0) {
        taskList.textContent = "No tasks yet. Add your first task!";
        return;
    }

    tasks.forEach(task => {
        const item = document.createElement("div");
        item.className = "task-item";
        item.dataset.id = task.id;

        const title = document.createElement("h3");
        title.className = "task-title";
        title.textContent = task.title;

        const description = document.createElement("p");
        description.className = "task-description";
        description.textContent = task.description || "No description";

        const status = document.createElement("p");
        status.className = "task-status";
        status.textContent = task.completed ? "Completed" : "Pending";

        const editButton = document.createElement("button");
        editButton.className = "edit-task";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => editTask(task));

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-task";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deleteTask(task.id));

        const toggleButton = document.createElement("button");
        toggleButton.className = "toggle-task";
        toggleButton.textContent = task.completed
            ? "Mark Pending"
            : "Mark Completed";
        toggleButton.addEventListener("click", () => toggleTask(task));

        item.append(
            title,
            description,
            status,
            editButton,
            deleteButton,
            toggleButton
        );

        taskList.appendChild(item);
    });
}

// CREATE: Add a new task
taskForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const newTask = {
        title: taskTitle.value.trim(),
        description: taskDescription.value.trim(),
        completed: false
    };

    if (!newTask.title) {
        showMessage("Please enter a task title.");
        return;
    }

    submitButton.disabled = true;

    try {
        const response = await fetch(apiUrl(), {
            method: "POST",
            headers: {
                ...requestHeaders(),
                "Prefer": "return=representation"
            },
            body: JSON.stringify(newTask)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        taskForm.reset();
        showMessage("Task added successfully!");
        await loadTasks();

    } catch (error) {
        console.error(error);
        showMessage("Could not add task: " + error.message);
    } finally {
        submitButton.disabled = false;
    }
});

// UPDATE: Edit a task
async function editTask(task) {
    const newTitle = prompt("Enter the new task title:", task.title);

    if (newTitle === null) return;

    if (!newTitle.trim()) {
        showMessage("Task title cannot be empty.");
        return;
    }

    const newDescription = prompt(
        "Enter the new description:",
        task.description || ""
    );

    if (newDescription === null) return;

    try {
        const response = await fetch(
            `${apiUrl()}?id=eq.${encodeURIComponent(task.id)}`,
            {
                method: "PATCH",
                headers: {
                    ...requestHeaders(),
                    "Prefer": "return=representation"
                },
                body: JSON.stringify({
                    title: newTitle.trim(),
                    description: newDescription.trim()
                })
            }
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        showMessage("Task updated successfully!");
        await loadTasks();

    } catch (error) {
        console.error(error);
        showMessage("Could not update task: " + error.message);
    }
}

// UPDATE: Mark a task completed or pending
async function toggleTask(task) {
    try {
        const response = await fetch(
            `${apiUrl()}?id=eq.${encodeURIComponent(task.id)}`,
            {
                method: "PATCH",
                headers: {
                    ...requestHeaders(),
                    "Prefer": "return=representation"
                },
                body: JSON.stringify({
                    completed: !task.completed
                })
            }
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        showMessage("Task status updated!");
        await loadTasks();

    } catch (error) {
        console.error(error);
        showMessage("Could not update task: " + error.message);
    }
}

// DELETE: Remove a task
async function deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    try {
        const response = await fetch(
            `${apiUrl()}?id=eq.${encodeURIComponent(id)}`,
            {
                method: "DELETE",
                headers: requestHeaders()
            }
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        showMessage("Task deleted successfully!");
        await loadTasks();

    } catch (error) {
        console.error(error);
        showMessage("Could not delete task: " + error.message);
    }
}

// Start the application
initializeApp();