# PHINMA Library Complete Data Flow Diagram

## System Scope

The PHINMA Library is a web-based library system hosted on Render. It has two access paths:

- **User path:** registration QR -> registration/login page -> User dashboard
- **Admin path:** private Admin URL with `ADMIN_KEY` -> Admin dashboard

The application is served by `server.js` and uses the shared `library-data.json` data file.

## Context Diagram: Level 0

```mermaid
flowchart LR
    U[User / Student phone]
    Q[Registration QR code]
    A[Admin / Librarian]
    R[Render public web service]
    S((PHINMA Library System))
    D[(library-data.json)]

    U -->|Scan QR| Q
    Q -->|Open public registration URL| R
    U -->|Registration or Student ID login| S
    A -->|Private Admin URL with ADMIN_KEY| S
    S -->|User dashboard| U
    S -->|Admin dashboard| A
    S <-->|Read and write books, members, activities| D
    R --> S
```

## System Boundary

```mermaid
flowchart TB
    subgraph External_Entities[External Entities]
        USER[User / Student]
        ADMIN[Admin / Librarian]
    end

    subgraph Render[Render Hosting]
        WEB[Public web service]
        SERVER[Node.js server.js]
        API[API routes]
        FRONTEND[HTML, CSS, JavaScript frontend]
    end

    subgraph Data_Stores[Data Stores]
        DATA[(library-data.json)]
    end

    USER -->|HTTPS| WEB
    ADMIN -->|HTTPS + private ADMIN_KEY| WEB
    WEB --> FRONTEND
    WEB --> SERVER
    SERVER --> API
    API <--> DATA
    FRONTEND <--> API
```

## Level 1: User Access and Registration

```mermaid
flowchart TD
    U[User / Student phone]
    Q[PHINMA User QR]
    F[register.html registration page]
    CHOOSE{Has an account?}
    NEW[New account form]
    EXIST[Existing account form]
    DETAILS[Name, email, student ID, program]
    SID[Student ID]
    REG[POST /api/register]
    LOGIN[POST /api/login]
    VALIDATE{Validate details}
    MEMBER[(Members data)]
    ID[Generate PH member ID]
    USER_VIEW[User dashboard]
    ERROR[Show registration or login error]

    U -->|Scan QR| Q
    Q -->|Open public URL| F
    F --> CHOOSE
    CHOOSE -->|No| NEW
    NEW --> DETAILS
    DETAILS --> REG
    REG --> VALIDATE
    VALIDATE -->|Valid| ID
    ID --> MEMBER
    MEMBER --> USER_VIEW
    VALIDATE -->|Duplicate email or Student ID| ERROR
    CHOOSE -->|Yes| EXIST
    EXIST --> SID
    SID --> LOGIN
    LOGIN --> MEMBER
    LOGIN -->|ID not found| ERROR
    MEMBER --> USER_VIEW
```

## Level 1: Admin Access

```mermaid
flowchart TD
    ADMIN[Admin / Librarian]
    LINK[Private Admin URL]
    KEY[ADMIN_KEY environment variable]
    REQUEST[Admin request]
    CHECK{Does URL key match ADMIN_KEY?}
    DASH[Admin dashboard]
    DENY[403 Admin access denied]
    API[Admin API actions]

    ADMIN --> LINK
    LINK --> REQUEST
    KEY --> CHECK
    REQUEST --> CHECK
    CHECK -->|Valid| DASH
    CHECK -->|Missing or incorrect| DENY
    DASH --> API
```

## Level 1: Catalog and Circulation

```mermaid
flowchart LR
    ADMIN[Admin dashboard]
    USER[User dashboard]
    ADD[Add book]
    VIEW_ADMIN[View all books]
    VIEW_USER[View available books and own borrowed books]
    BORROW[Borrow book]
    RETURN[Return book]
    API[Node.js API]
    BOOKS[(Books data)]
    ACTIVITY[(Activity data)]

    ADMIN --> ADD
    ADMIN --> VIEW_ADMIN
    ADMIN --> BORROW
    ADMIN --> RETURN
    USER --> VIEW_USER
    USER --> BORROW
    USER --> RETURN
    ADD -->|POST /api/books + key| API
    VIEW_ADMIN -->|GET /api/state + key| API
    VIEW_USER -->|GET /api/state| API
    BORROW -->|POST /api/borrow| API
    RETURN -->|POST /api/return| API
    API <--> BOOKS
    API <--> ACTIVITY
    API -->|Updated records| ADMIN
    API -->|Updated available and own books| USER
```

## Level 1: Live Synchronization

```mermaid
sequenceDiagram
    participant Phone as User phone
    participant Render as Render server
    participant Data as library-data.json
    participant Laptop as Admin dashboard

    Phone->>Render: Register or borrow/return request
    Render->>Data: Save updated record
    Data-->>Render: Updated shared state
    Render-->>Phone: User response
    loop Every 2 seconds
        Laptop->>Render: GET /api/state
        Render->>Data: Read latest state
        Data-->>Render: Current books and members
        Render-->>Laptop: Updated dashboard data
    end
```

## Data Stores

| Store | Contents | Read by | Written by |
| --- | --- | --- | --- |
| `library-data.json` | Complete shared application data | Node.js server | Node.js server |
| `books` | Book ID, title, author, borrowed status, borrower ID | Admin and User dashboards | Admin add-book and borrow/return processes |
| `members` | Member ID, name, email, Student ID, program, date joined | Admin dashboard and User login | Registration process |
| `activities` | Add, borrow, and return events | Admin dashboard | Catalog and circulation processes |
| `ADMIN_KEY` | Private Admin access secret | Admin authorization process | Render environment settings |

## API Process Table

| Process | Endpoint | Description | Access |
| --- | --- | --- | --- |
| Load shared state | `GET /api/state` | Returns books, members, and activity records | User and Admin dashboard |
| Register member | `POST /api/register` | Validates details, creates member ID, saves member | Public registration |
| Login member | `POST /api/login` | Finds member by Student ID | Public user login |
| Add book | `POST /api/books?key=...` | Creates a new book record | Admin only |
| Borrow book | `POST /api/borrow` | Marks an available book with borrower ID | User or Admin |
| Return book | `POST /api/return` | Clears borrower ID and marks book available | Owner or Admin |
| Admin page | `GET /index.html?view=admin&key=...` | Serves Admin dashboard after key validation | Admin only |

## Access Rules

```mermaid
flowchart TD
    START[Incoming request]
    TYPE{Request type}
    PUBLIC[Public registration/login]
    USER[User dashboard]
    ADMIN_KEY_CHECK{Valid ADMIN_KEY?}
    ADMIN[Admin dashboard and admin controls]
    BLOCK[403 Forbidden]

    START --> TYPE
    TYPE -->|Registration or login| PUBLIC
    TYPE -->|User URL with member ID| USER
    TYPE -->|Admin URL| ADMIN_KEY_CHECK
    ADMIN_KEY_CHECK -->|Yes| ADMIN
    ADMIN_KEY_CHECK -->|No| BLOCK
```

## File and Component Mapping

| Component | Responsibility |
| --- | --- |
| `register.html` | Public registration and Student ID login UI |
| `register.js` | Sends register/login requests and redirects to User dashboard |
| `index.html` | Admin and User dashboard UI |
| `app.js` | Renders role-based views, catalog actions, and live refresh |
| `server.js` | HTTP server, API routes, access control, and file serving |
| `library-data.json` | Shared books, members, and activity records |
| `qrcodes/phinma-registration.png` | QR code pointing to public registration page |
| `ADMIN_KEY` | Render secret used to protect Admin access |
| `package.json` | Render start command: `npm start` |

## Complete User Journey

1. User scans the PHINMA registration QR code.
2. User sees the registration/login page, never the Admin dashboard.
3. New user submits name, email, Student ID, and program.
4. Existing user selects the existing-account option and submits Student ID only.
5. The server validates or creates the member record.
6. The user is redirected to the User dashboard.
7. The User dashboard shows available books and that user's borrowed books.
8. Borrow or return actions update the shared server data.
9. The Admin dashboard receives the updated records through live refresh.

## Complete Admin Journey

1. Admin opens the private URL containing the Render `ADMIN_KEY`.
2. The server compares the URL key with the Render environment variable.
3. Invalid or missing keys receive `403 Forbidden`.
4. Valid Admin access opens the full Admin dashboard.
5. Admin can view all books, member records, activity, and circulation status.
6. Admin can add books and manage circulation records.
7. User registration and borrowing updates are reflected on the Admin dashboard.
