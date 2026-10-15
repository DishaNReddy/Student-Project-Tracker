const form = document.querySelector('#project-form');
const nameInput = document.querySelector('#name');
const statusInput = document.querySelector('#status');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');

// Store projects in memory while the page is open.
const projects = [];

// Generate a unique ID for each project.
function generateProjectId() {
    return crypto.randomUUID();
}

// Display all projects in the list.
function renderProjects() {
    // Clear the old list to prevent duplicate entries.
    projectList.replaceChildren();

    projects.forEach(project => {
        const listItem = document.createElement('li');
        const projectName = document.createElement('span');
        const projectStatus = document.createElement('span');

        projectName.textContent = project.name;
        projectStatus.textContent = ` — ${project.status}`;

        listItem.append(projectName, projectStatus);
        projectList.appendChild(listItem);
    });

    // Update the empty-state message if it exists.
    if (emptyState) {
        emptyState.hidden = projects.length > 0;
    }
}

// Handle form submission.
form.addEventListener('submit', event => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const status = statusInput.value;

    // Reject an empty project name.
    if (!name) {
        nameInput.setCustomValidity('Please enter a project name.');
        nameInput.reportValidity();
        nameInput.addEventListener(
            'input',
            () => nameInput.setCustomValidity(''),
            { once: true }
        );
        return;
    }

    // Add the new project to the array.
    const project = {
        id: generateProjectId(),
        name: name,
        status: status
    };

    projects.push(project);

    // Display the updated list.
    renderProjects();

    // Clear the name field for the next project.
    form.reset();
    nameInput.focus();
});

// Display the initial empty state.
renderProjects();
