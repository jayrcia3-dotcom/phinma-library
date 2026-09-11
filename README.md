# PHINMA Library

## Run the website again

Open PowerShell in this folder and run:

```powershell
.\start-library.ps1
```

Then open:

```text
http://localhost:8080
```

The computer root address opens the Admin dashboard. Users enter through the registration QR and are redirected to their own User dashboard after registration or Student ID login.

For phone access, connect the phone and computer to the same Wi-Fi and open:

```text
http://192.168.100.16:8080
```

## Important

- Keep the PowerShell window open while using the website.
- The website files, QR image, books, and registration flow are saved in this folder.
- Books, member records, and borrow/return status are saved in `library-data.json` by the local server, so the laptop admin and phone users share the same records.
- The registration QR image is at `qrcodes/phinma-registration.png`.

## Main files

- `index.html` - PHINMA Library dashboard
- `register.html` - user registration form
- `app.js` - catalog, roles, books, and admin/user views
- `register.js` - member registration, Student ID login, and user redirect
- `styles.css` - page design
- `qrcodes/phinma-registration.png` - registration QR code
- `start-library.ps1` - starts the local website server
- `server.js` - shared local API and website server

## Existing user login

On the registration page, choose **I already have an account**, enter the registered Student ID, and select **Open my library account**. The user will be sent to their own User view.
