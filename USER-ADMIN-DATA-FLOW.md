# PHINMA Library: User and Admin Data Flow

## Simple Overview

```mermaid
flowchart LR
    USER[User / Student phone]
    QR[Registration QR]
    FORM[Registration or Student ID login]
    UDB[User dashboard]
    SERVER((PHINMA Library server))
    DATA[(Shared library records)]
    ADMIN[Admin / Librarian]
    ADB[Admin dashboard]

    USER -->|Scan| QR
    QR -->|Open| FORM
    FORM -->|Register or log in| SERVER
    SERVER -->|User books only| UDB
    ADMIN -->|Private Admin link| ADB
    ADB -->|Add books, view members, manage records| SERVER
    SERVER <--> DATA
    SERVER -->|Updated records| ADB
```

## User Flow

```mermaid
flowchart TD
    U[User scans QR code]
    P[Registration / Login page]
    C{Does the user have an account?}
    R[Fill out name, email, Student ID, and program]
    L[Enter Student ID only]
    S[Server checks or creates the account]
    D[User dashboard]
    B[See available books and own borrowed books]
    T[Borrow or return a book]

    U --> P
    P --> C
    C -->|No| R
    C -->|Yes| L
    R --> S
    L --> S
    S --> D
    D --> B
    B --> T
    T -->|Save update| S
```

## Admin Flow

```mermaid
flowchart TD
    A[Admin opens private Admin link]
    K{Is the ADMIN_KEY correct?}
    X[Access denied]
    D[Admin dashboard]
    C[View all books]
    M[View member records]
    B[Manage borrow and return records]
    N[Add new books]
    S[Server saves changes]
    DATA[(Shared library records)]

    A --> K
    K -->|No| X
    K -->|Yes| D
    D --> C
    D --> M
    D --> B
    D --> N
    C --> S
    M --> S
    B --> S
    N --> S
    S <--> DATA
```

## Difference Between User and Admin

| User | Admin |
| --- | --- |
| Enters through the QR code | Uses a private Admin link |
| Registers or logs in using Student ID | Uses the `ADMIN_KEY` for access |
| Sees available books | Sees the entire catalog |
| Sees only their own borrowed books | Sees all borrowed books and borrowers |
| Can borrow an available book | Can add books and manage records |
| Can return their own borrowed book | Can manage any book transaction |

## Simple Presentation Explanation

> The User scans the QR code and is sent to the registration or login page. A new User fills out the registration form, while an existing User only enters a Student ID. After logging in, the User sees the User dashboard with available books and their own borrowed books.
>
> The Admin has a separate private link protected by an `ADMIN_KEY`. The Admin dashboard shows all books, members, and activities. The User and Admin dashboards use the same server and shared records, so changes in registration, borrowing, and returning are updated in the system.
