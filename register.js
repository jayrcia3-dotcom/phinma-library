const MEMBERS_KEY = "phinma-library-members";
const form = document.querySelector("#registrationForm");
const formError = document.querySelector("#formError");
const formView = document.querySelector("#registrationFormView");
const successView = document.querySelector("#registrationSuccess");
const createdMemberId = document.querySelector("#createdMemberId");
const successDetails = document.querySelector("#successDetails");
const successDashboardLink = document.querySelector("#successDashboardLink");
const newAccountTab = document.querySelector("#newAccountTab");
const existingAccountTab = document.querySelector("#existingAccountTab");
const submitAccount = document.querySelector("#submitAccount");
const fields = {
    name: document.querySelector("#memberName"),
    email: document.querySelector("#memberEmail"),
    studentId: document.querySelector("#studentId"),
    program: document.querySelector("#memberProgram")
};

function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[character]));
}

function setMode(mode) {
    const isLogin = mode === "login";
    const setFieldVisibility = (field, visible) => {
        document.querySelector(`label[for="${field.id}"]`).hidden = !visible;
        field.hidden = !visible;
    };
    form.dataset.mode = mode;
    newAccountTab.classList.toggle("active", !isLogin);
    existingAccountTab.classList.toggle("active", isLogin);
    document.querySelector("#registerTitle").textContent = isLogin ? "Sign in to your account" : "Create your account";
    document.querySelector("#registrationFormView .eyebrow").textContent = isLogin ? "Returning member" : "New member";
    document.querySelector("#registrationFormView .modal-copy").textContent = isLogin ? "Enter your student ID to continue to your library account." : "Enter your school details so we can create your reader record.";
    setFieldVisibility(fields.name, !isLogin);
    setFieldVisibility(fields.email, !isLogin);
    setFieldVisibility(fields.program, !isLogin);
    fields.name.required = !isLogin;
    fields.email.required = !isLogin;
    fields.program.required = !isLogin;
    submitAccount.textContent = isLogin ? "Open my library account" : "Create library account";
    formError.hidden = true;
}

newAccountTab.addEventListener("click", () => setMode("register"));
existingAccountTab.addEventListener("click", () => setMode("login"));

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const mode = form.dataset.mode;
    const name = fields.name.value.trim();
    const email = fields.email.value.trim().toLowerCase();
    const studentId = fields.studentId.value.trim();
    const program = fields.program.value.trim();
    try {
        const endpoint = mode === "login" ? "/api/login" : "/api/register";
        const payload = mode === "login" ? { studentId } : { name, email, studentId, program };
        const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) {
            formError.textContent = result.error || "Could not create your account. Please try again.";
            formError.hidden = false;
            return;
        }
        const member = result.member;

        createdMemberId.textContent = member.memberId;
        successDetails.innerHTML = `<strong>${escapeHtml(member.name)}</strong><span>${escapeHtml(member.program)} · ${escapeHtml(member.email)}</span>`;
        successDashboardLink.href = `index.html?view=user&member=${encodeURIComponent(member.memberId)}#catalog`;
        if (mode === "login") {
            window.location.href = `index.html?view=user&member=${encodeURIComponent(member.memberId)}#catalog`;
            return;
        }
        formView.hidden = true;
        successView.hidden = false;
        window.setTimeout(() => {
            window.location.href = `index.html?view=user&member=${encodeURIComponent(member.memberId)}&registered=1#catalog`;
        }, 1400);
    } catch (error) {
        formError.textContent = "The library server is not running. Please ask the librarian to start it first.";
        formError.hidden = false;
    }
});
