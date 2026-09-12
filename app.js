const STORAGE_KEY = "library-desk-books";
const ACTIVITY_KEY = "library-desk-activity";
const MEMBERS_KEY = "phinma-library-members";
const viewParams = new URLSearchParams(window.location.search);
const currentView = viewParams.get("view") === "admin" ? "admin" : "user";
const currentMemberId = viewParams.get("member") || "";
const adminKey = viewParams.get("key") || "";

const seedBooks = [
    { id: "PH10-FIL-001", title: "21st Century Literature from the Philippines and the World", author: "Senior High School Learning Module", borrowed: false },
    { id: "PH10-MAT-002", title: "General Mathematics", author: "Senior High School Learning Module", borrowed: true },
    { id: "PH10-SCI-003", title: "Science 10: Matter, Energy and Life", author: "Philippine K-12 Learning Guide", borrowed: false },
    { id: "PH10-AP-004", title: "Araling Panlipunan 8: Kasaysayan ng Daigdig", author: "K-12 Learning Module", borrowed: false },
    { id: "PH10-ESP-005", title: "Edukasyon sa Pagpapakatao 10", author: "K-12 Learning Module", borrowed: false },
    { id: "PH10-MIL-006", title: "Media and Information Literacy", author: "Senior High School Learning Module", borrowed: false },
    { id: "PH10-PS-007", title: "Physical Science", author: "Senior High School Learning Module", borrowed: false }
];
const legacyBookIds = new Set(["BK7A31F2C", "BK2D91B8E", "BK4C82A11"]);

const savedBooks = readStorage(STORAGE_KEY, null);
let books = !savedBooks || savedBooks.every((book) => legacyBookIds.has(book.id)) ? seedBooks : savedBooks;
let activities = readStorage(ACTIVITY_KEY, []);
let members = readStorage(MEMBERS_KEY, []);
let currentMember = members.find((member) => member.memberId === currentMemberId) || null;

const elements = {
    totalBooks: document.querySelector("#totalBooks"),
    availableBooks: document.querySelector("#availableBooks"),
    borrowedBooks: document.querySelector("#borrowedBooks"),
    circulationRate: document.querySelector("#circulationRate"),
    memberCount: document.querySelector("#memberCount"),
    tableBody: document.querySelector("#bookTableBody"),
    emptyState: document.querySelector("#emptyState"),
    search: document.querySelector("#searchBooks"),
    filter: document.querySelector("#statusFilter"),
    activityList: document.querySelector("#activityList"),
    activityCount: document.querySelector("#activityCount"),
    modal: document.querySelector("#bookModal"),
    form: document.querySelector("#bookForm"),
    title: document.querySelector("#bookTitle"),
    author: document.querySelector("#bookAuthor"),
    toast: document.querySelector("#toast"),
    memberQrImage: document.querySelector("#memberQrImage"),
    memberList: document.querySelector("#memberList"),
    memberRecordCount: document.querySelector("#memberRecordCount")
};

function readStorage(key, fallback) {
    try {
        const saved = JSON.parse(localStorage.getItem(key));
        return Array.isArray(saved) ? saved : fallback;
    } catch (error) {
        return fallback;
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activities));
}

function isAdmin() {
    return currentView === "admin";
}

function adminApiUrl(path) {
    return `${path}?key=${encodeURIComponent(adminKey)}`;
}

async function syncFromServer() {
    const response = await fetch("/api/state");
    if (!response.ok) throw new Error("Library server is unavailable.");
    const state = await response.json();
    books = state.books;
    members = state.members;
    activities = state.activities;
    currentMember = members.find((member) => member.memberId === currentMemberId) || null;
}

async function refreshDashboard() {
    try {
        await syncFromServer();
        if (!isAdmin() && !currentMember) return;
        render();
    } catch (error) {
        // Keep the current dashboard visible if the server briefly disconnects.
    }
}

function createId() {
    return `BK${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

function filteredBooks() {
    const query = elements.search.value.trim().toLowerCase();
    const status = elements.filter.value;
    const userBooks = isAdmin() ? books : books.filter((book) => !book.borrowed || book.borrowedBy === currentMemberId);
    return userBooks.filter((book) => {
        const matchesQuery = [book.title, book.author, book.id].some((value) => value.toLowerCase().includes(query));
        const matchesStatus = status === "all" || (status === "borrowed" && book.borrowed) || (status === "available" && !book.borrowed);
        return matchesQuery && matchesStatus;
    });
}

function render() {
    const borrowedCount = books.filter((book) => book.borrowed).length;
    const ownBorrowedCount = books.filter((book) => book.borrowedBy === currentMemberId).length;
    const availableCount = books.filter((book) => !book.borrowed).length;
    elements.totalBooks.textContent = isAdmin() ? books.length : availableCount + ownBorrowedCount;
    elements.availableBooks.textContent = availableCount;
    elements.borrowedBooks.textContent = isAdmin() ? borrowedCount : ownBorrowedCount;
    elements.circulationRate.textContent = isAdmin() ? (books.length ? `${Math.round((borrowedCount / books.length) * 100)}%` : "0%") : `${ownBorrowedCount} yours`;
    elements.memberCount.textContent = members.length;

    const visibleBooks = filteredBooks();
    elements.tableBody.innerHTML = visibleBooks.map((book) => `
        <tr>
            <td>
                <div class="book-cell">
                    <span class="book-cover">${book.title.slice(0, 2).toUpperCase()}</span>
                    <span><strong class="book-title">${escapeHtml(book.title)}</strong><span class="book-author">${escapeHtml(book.author)}</span></span>
                </div>
            </td>
            <td><span class="book-id">${book.id}</span></td>
            <td><span class="badge ${book.borrowed ? "borrowed" : "available"}">${book.borrowed ? "Borrowed" : "Available"}</span></td>
            <td>
                <div class="row-actions">
                    ${!book.borrowed || book.borrowedBy === currentMemberId ? `<button class="row-button" type="button" data-action="toggle" data-id="${book.id}">${book.borrowed ? "Return" : "Borrow"}</button>` : "<span class=\"book-id\">In use</span>"}
                </div>
            </td>
        </tr>
    `).join("");
    elements.emptyState.hidden = visibleBooks.length > 0;
    renderActivity();
    renderMembers();
}

function renderActivity() {
    elements.activityCount.textContent = `${activities.length} ${activities.length === 1 ? "event" : "events"}`;
    elements.activityList.innerHTML = activities.length ? activities.slice(0, 5).map((activity) => `
        <div class="activity-item">
            <span class="activity-mark">${activity.type === "borrow" ? "↑" : activity.type === "return" ? "↓" : "+"}</span>
            <span class="activity-text"><strong>${escapeHtml(activity.title)}</strong> ${activity.type === "add" ? "was added" : activity.type === "borrow" ? "was borrowed" : "was returned"}</span>
            <span class="activity-time">${activity.time}</span>
        </div>
    `).join("") : `<p class="no-activity">Your latest catalog actions will appear here.</p>`;
}

function renderMembers() {
    elements.memberRecordCount.textContent = `${members.length} ${members.length === 1 ? "record" : "records"}`;
    elements.memberList.innerHTML = members.length ? members.slice(0, 4).map((member) => `
        <div class="member-item">
            <span class="member-avatar">${member.name.slice(0, 2).toUpperCase()}</span>
            <span class="member-info"><strong>${escapeHtml(member.name)}</strong><span>${escapeHtml(member.program)} · ${member.memberId}</span></span>
            <span class="member-status">Active</span>
        </div>
    `).join("") : `<p class="no-activity">No member records yet. Share the QR to open registration.</p>`;
}

function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[character]));
}

function addActivity(type, book) {
    activities.unshift({ type, title: book.title, time: "Just now" });
    activities = activities.slice(0, 12);
}

function openModal() {
    elements.modal.showModal();
    elements.title.focus();
}

function closeModal() {
    elements.modal.close();
    elements.form.reset();
}

async function addBook(event) {
    event.preventDefault();
    const response = await fetch(adminApiUrl("/api/books"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: elements.title.value.trim(), author: elements.author.value.trim() }) });
    if (!response.ok) { showToast("Could not add the book."); return; }
    const state = await response.json();
    books = state.books;
    activities = state.activities;
    closeModal();
    render();
    showToast(`${book.title} added to your catalog.`);
}

async function toggleBorrow(id) {
    const book = books.find((item) => item.id === id);
    if (!book) return;
    if (!isAdmin() && book.borrowed && book.borrowedBy !== currentMemberId) return;
    const action = book.borrowed ? "return" : "borrow";
    const endpoint = isAdmin() ? adminApiUrl(`/api/${action}`) : `/api/${action}`;
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId: id, memberId: isAdmin() ? "ADMIN" : currentMemberId, role: isAdmin() ? "admin" : "user" }) });
    const result = await response.json();
    if (!response.ok) { showToast(result.error || "This book is no longer available."); await syncFromServer(); render(); return; }
    books = result.books;
    activities = result.activities;
    render();
    showToast(book.borrowed ? `${book.title} marked as borrowed.` : `${book.title} returned to the catalog.`);
}

function registrationUrl() {
    return new URL("register.html?source=phinma", window.location.href).href;
}

function renderMemberQr() {
    const image = document.createElement("img");
    image.className = "membership-qr-image";
    image.alt = "Scan to open PHINMA Library registration";
    image.src = "qrcodes/phinma-registration.png";
    image.addEventListener("error", () => {
        elements.memberQrImage.innerHTML = `<div class="qr-fallback qr-fallback-large"><span>JOIN</span><small>PHINMA</small></div>`;
    }, { once: true });
    elements.memberQrImage.replaceChildren(image);
}

let toastTimeout;
function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => elements.toast.classList.remove("show"), 2800);
}

document.querySelector("#openAddBook").addEventListener("click", openModal);
document.querySelector("#emptyAddBook").addEventListener("click", openModal);
document.querySelector("#closeModal").addEventListener("click", closeModal);
document.querySelector("#cancelModal").addEventListener("click", closeModal);
elements.form.addEventListener("submit", addBook);
elements.search.addEventListener("input", render);
elements.filter.addEventListener("change", render);
elements.tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "toggle") toggleBorrow(button.dataset.id);
});

document.querySelector("#copyRegistrationLink").addEventListener("click", async () => {
    const link = registrationUrl();
    try {
        await navigator.clipboard.writeText(link);
        showToast("Registration link copied.");
    } catch (error) {
        showToast(link);
    }
});

async function initialize() {
    try {
        await syncFromServer();
    } catch (error) {
        showToast("Start the PHINMA Library server first.");
        return;
    }
    if (!isAdmin() && !currentMember) {
        window.location.href = "register.html?source=phinma";
        return;
    }
    document.querySelector("#roleLabel").textContent = isAdmin() ? "Admin view" : `User: ${currentMember.name}`;
    document.querySelector("#catalogEyebrow").textContent = isAdmin() ? "Collection" : "Your library view";
    document.querySelector("#catalogTitle").textContent = isAdmin() ? "Book catalog" : "Available and borrowed books";
    document.querySelector("#emptyState p").textContent = isAdmin() ? "Add a title to start building your catalog." : "You have no available or borrowed books to show.";
    document.querySelector("#emptyAddBook").hidden = !isAdmin();
    document.querySelectorAll(".admin-only").forEach((element) => { element.style.display = isAdmin() ? "" : "none"; });
    render();
    renderMemberQr();
    if (new URLSearchParams(window.location.search).get("registered") === "1") {
        showToast("Registration complete. Member record added.");
        window.history.replaceState({}, document.title, `index.html?view=user&member=${encodeURIComponent(currentMemberId)}#catalog`);
    }
    window.setInterval(refreshDashboard, 2000);
}

initialize();
