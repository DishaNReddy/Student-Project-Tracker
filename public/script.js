const form = document.querySelector('#project-form');
const nameInput = document.querySelector('#name');
const statusInput = document.querySelector('#status');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');
const message = document.querySelector('#message');

const STORAGE_KEY = 'workshop-projects-v1';

// Projects are loaded from localStorage when the page starts.
const projects = [];

let editingId = null;
let storageReady = false;

// Display a message without inserting HTML.
function showMessage(text) {
    if (message) {
        message.textContent = text;
    }
}

// Check that stored data contains valid project records.
function isValidProjects(data) {
    if (!Array.isArray(data)) {
        return false;
    }

    const ids = new Set();

    return data.every(project => {
        if (
            project === null ||
            typeof project !== 'object' ||
            Array.isArray(project) ||
            typeof project.id !== 'string' ||
            project.id.trim() === '' ||
            typeof project.name !== 'string' ||
            project.name.trim() === '' ||
            typeof project.status !== 'string' ||
            !['Planned', 'In Progress', 'Completed'].includes(project.status)
        ) {
            return false;
        }

        if (ids.has(project.id)) {
            return false;
        }

        ids.add(project.id);
        return true;
    });
}

// Load saved projects without overwriting malformed stored data.
function loadProjects() {
    let savedText;

    try {
        savedText = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        storageReady = false;
        showMessage(
            'Could not read saved projects from browser storage. Changes cannot be saved.'
        );
        return;
    }

    // No saved data means this is a new tracker.
    if (savedText === null) {
        storageReady = true;
        return;
    }

    let savedProjects;

    try {
        // JSON.parse turns stored text back into JavaScript data.
        savedProjects = JSON.parse(savedText);
    } catch (error) {
        storageReady = false;
        showMessage(
            'Saved project data is invalid. It has not been overwritten. Check or remove the stored data before continuing.'
        );
        return;
    }

    if (!isValidProjects(savedProjects)) {
        storageReady = false;
        showMessage(
            'Saved project data has an invalid format. It has not been overwritten. Check or remove the stored data before continuing.'
        );
        return;
    }

    projects.push(...savedProjects);
    storageReady = true;
}

// Save the current collection.
function saveProjects() {
    if (!storageReady) {
        showMessage(
            'Changes could not be saved. Browser storage is unavailable or the saved data needs attention.'
        );
        return false;
    }

    try {
        // JSON.stringify turns the collection into storable text.
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(projects)
        );

        showMessage('Projects saved.');
        return true;
    } catch (error) {
        showMessage(
            'Changes could not be saved to browser storage. Your latest changes may be lost if you refresh.'
        );
        return false;
    }
}

// Generate a unique ID for each new project.
function generateProjectId() {
    return crypto.randomUUID();
}

// Return the form to Add mode.
function resetForm() {
    form.reset();
    editingId = null;
    saveButton.textContent = 'Save Project';
    cancelButton.hidden = true;
    nameInput.setCustomValidity('');
}

// Edit a project using its stable ID.
function editProject(id) {
    const project = projects.find(item => item.id === id);

    if (!project) {
        return;
    }

    editingId = project.id;
    nameInput.value = project.name;
    statusInput.value = project.status;

    saveButton.textContent = 'Save changes';
    cancelButton.hidden = false;
    nameInput.setCustomValidity('');
    nameInput.focus();
}

// Delete a project using its stable ID.
function deleteProject(id) {
    const project = projects.find(item => item.id === id);

    if (!project) {
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to delete "${project.name}"?`
    );

    // Cancel does not change the collection or saved data.
    if (!confirmed) {
        return;
    }

    if (!storageReady) {
        showMessage(
            'Cannot delete this project because browser storage is unavailable or the saved data needs attention.'
        );
        return;
    }

    const index = projects.findIndex(item => item.id === id);

    if (index === -1) {
        return;
    }

    // Keep a copy so we can restore the collection if saving fails.
    const deletedProject = projects[index];
    projects.splice(index, 1);

    if (!saveProjects()) {
        projects.splice(index, 0, deletedProject);
        renderProjects();
        return;
    }

    if (editingId === id) {
        resetForm();
    }

    renderProjects();
}

// Display all projects and their Edit and Delete buttons.
function renderProjects() {
    projectList.replaceChildren();

    projects.forEach(project => {
        const listItem = document.createElement('li');
        const projectName = document.createElement('span');
        const projectStatus = document.createElement('span');
        const editButton = document.createElement('button');
        const deleteButton = document.createElement('button');

        projectName.textContent = project.name;
        projectStatus.textContent = ` — ${project.status}`;

        editButton.type = 'button';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            editProject(project.id);
        });

        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
            deleteProject(project.id);
        });

        listItem.append(
            projectName,
            projectStatus,
            document.createTextNode(' '),
            editButton,
            document.createTextNode(' '),
            deleteButton
        );

        projectList.appendChild(listItem);
    });

    if (emptyState) {
        emptyState.hidden = projects.length > 0;
    }
}

// Handle Add and Edit with one submit listener.
form.addEventListener('submit', event => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const status = statusInput.value;

    if (!name) {
        nameInput.setCustomValidity(
            'Please enter a project name.'
        );
        nameInput.reportValidity();
        return;
    }

    nameInput.setCustomValidity('');

    if (!storageReady) {
        showMessage(
            'Cannot save changes because browser storage is unavailable or the saved data needs attention.'
        );
        return;
    }

    if (editingId !== null) {
        const project = projects.find(
            item => item.id === editingId
        );

        if (!project) {
            resetForm();
            renderProjects();
            showMessage('The project could not be found.');
            return;
        }

        // Preserve the ID and restore old values if saving fails.
        const oldName = project.name;
        const oldStatus = project.status;

        project.name = name;
        project.status = status;

        if (!saveProjects()) {
            project.name = oldName;
            project.status = oldStatus;
            renderProjects();
            return;
        }
    } else {
        // Add a new project.
        const newProject = {
            id: generateProjectId(),
            name: name,
            status: status
        };

        projects.push(newProject);

        if (!saveProjects()) {
            projects.pop();
            renderProjects();
            return;
        }
    }

    renderProjects();
    resetForm();
});

// Cancel editing without changing saved records.
cancelButton.addEventListener('click', () => {
    resetForm();
});

// Load saved records and display them when the page starts.
loadProjects();
resetForm();
renderProjects();

