const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "library-data.json");
const seedBooks = [
    { id: "PH10-FIL-001", title: "21st Century Literature from the Philippines and the World", author: "Senior High School Learning Module", borrowed: false, borrowedBy: null },
    { id: "PH10-MAT-002", title: "General Mathematics", author: "Senior High School Learning Module", borrowed: false, borrowedBy: null },
    { id: "PH10-SCI-003", title: "Science 10: Matter, Energy and Life", author: "Philippine K-12 Learning Guide", borrowed: false, borrowedBy: null },
    { id: "PH10-AP-004", title: "Araling Panlipunan 8: Kasaysayan ng Daigdig", author: "K-12 Learning Module", borrowed: false, borrowedBy: null },
    { id: "PH10-ESP-005", title: "Edukasyon sa Pagpapakatao 10", author: "K-12 Learning Module", borrowed: false, borrowedBy: null },
    { id: "PH10-MIL-006", title: "Media and Information Literacy", author: "Senior High School Learning Module", borrowed: false, borrowedBy: null },
    { id: "PH10-PS-007", title: "Physical Science", author: "Senior High School Learning Module", borrowed: false, borrowedBy: null }
];

function loadData() {
    if (!fs.existsSync(DATA_FILE)) return { books: seedBooks, members: [], activities: [] };
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
        return { books: data.books || seedBooks, members: data.members || [], activities: data.activities || [] };
    } catch (error) {
        return { books: seedBooks, members: [], activities: [] };
    }
}

let data = loadData();
function saveData() { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
function sendJson(response, status, payload) {
    response.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    response.end(JSON.stringify(payload));
}
function body(request) {
    return new Promise((resolve, reject) => {
        let content = "";
        request.on("data", (chunk) => content += chunk);
        request.on("end", () => { try { resolve(JSON.parse(content || "{}")); } catch (error) { reject(error); } });
        request.on("error", reject);
    });
}
function addActivity(type, book) {
    data.activities.unshift({ type, title: book.title, time: "Just now" });
    data.activities = data.activities.slice(0, 12);
}
function serveStatic(request, response) {
    if (request.url === "/") {
        response.writeHead(302, { Location: "/index.html?view=admin#catalog" });
        response.end();
        return;
    }
    const requested = request.url === "/" ? "/index.html" : request.url.split("?")[0];
    const filePath = path.resolve(ROOT, `.${requested}`);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        response.writeHead(404); response.end("Not found"); return;
    }
    const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".json": "application/json" };
    response.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (request, response) => {
    if (request.method === "OPTIONS") { response.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" }); response.end(); return; }
    if (request.url === "/api/state" && request.method === "GET") return sendJson(response, 200, data);
    try {
        if (request.url === "/api/register" && request.method === "POST") {
            const input = await body(request);
            if (data.members.some((member) => member.email === input.email || member.studentId.toLowerCase() === input.studentId.toLowerCase())) return sendJson(response, 409, { error: "A member record already exists for that email or student ID." });
            const member = { memberId: `PH-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`, name: input.name, email: input.email, studentId: input.studentId, program: input.program, joinedAt: new Date().toISOString() };
            data.members.unshift(member); saveData(); return sendJson(response, 201, { member });
        }
        if (request.url === "/api/login" && request.method === "POST") {
            const input = await body(request);
            const studentId = String(input.studentId || "").trim().toLowerCase();
            const member = data.members.find((item) => item.studentId.toLowerCase() === studentId);
            if (!member) return sendJson(response, 404, { error: "Student ID not found. Please create an account first." });
            return sendJson(response, 200, { member });
        }
        if (request.url === "/api/books" && request.method === "POST") {
            const input = await body(request);
            const book = { id: `BK${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`, title: input.title, author: input.author, borrowed: false, borrowedBy: null };
            data.books.unshift(book); addActivity("add", book); saveData(); return sendJson(response, 201, { book, ...data });
        }
        if (request.url === "/api/borrow" && request.method === "POST") {
            const input = await body(request); const book = data.books.find((item) => item.id === input.bookId);
            if (!book || book.borrowed) return sendJson(response, 409, { error: "Book is not available." });
            book.borrowed = true; book.borrowedBy = input.memberId; addActivity("borrow", book); saveData(); return sendJson(response, 200, data);
        }
        if (request.url === "/api/return" && request.method === "POST") {
            const input = await body(request); const book = data.books.find((item) => item.id === input.bookId);
            if (!book || !book.borrowed || (input.role !== "admin" && book.borrowedBy !== input.memberId)) return sendJson(response, 403, { error: "You cannot return this book." });
            book.borrowed = false; book.borrowedBy = null; addActivity("return", book); saveData(); return sendJson(response, 200, data);
        }
        serveStatic(request, response);
    } catch (error) { sendJson(response, 500, { error: "Server error." }); }
});
server.listen(PORT, "0.0.0.0", () => console.log(`PHINMA Library running on http://localhost:${PORT}`));
