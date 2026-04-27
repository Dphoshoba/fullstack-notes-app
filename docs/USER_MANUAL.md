# User Manual

This guide explains how to use the full-stack multilingual notes app.

The app has:

- A backend API for accounts, notes, profiles, and admin tools
- A React frontend for using the app in your browser
- Login, registration, notes, profile editing, admin tools, role management, and language selection

## Quick Start

1. Start the backend API:

```bash
npm run dev:api
```

2. Start the React frontend:

```bash
npm run dev:client
```

3. Open the frontend in your browser:

```text
http://localhost:5173
```

4. Make sure the backend is running at:

```text
http://localhost:4000
```

You can also start both backend and frontend together:

```bash
npm run dev:full
```

## Register

Use Register when you do not have an account yet.

1. Open the app.
2. Click Register.
3. Enter your name.
4. Enter your email.
5. Enter your password.
6. Click Register.

After registration, the app signs you in and opens the dashboard.

## Login

Use Login when you already have an account.

1. Open the app.
2. Click Log in.
3. Enter your email.
4. Enter your password.
5. Click Log in.

If the login is successful, you will go to the dashboard.

## Dashboard

The dashboard is the main screen after logging in.

You can see:

- Total notes
- Pinned notes
- Your user role
- Language selector
- Create note form
- Notes list
- Search bar
- Profile button
- Admin button, if your role allows it
- Log out button

## Language Selector

The dashboard has a language selector in the header.

Supported languages:

- English
- French
- Spanish
- Portuguese
- Arabic
- Krio / Sierra Leone Creole

To change language:

1. Open the dashboard.
2. Use the language dropdown in the header.
3. Select a language.

The app saves your selected language in the browser.

When you come back later, the app remembers your choice.

Arabic uses right-to-left page direction.

## Create Notes

Use the Create note form on the dashboard.

1. Enter a title.
2. Enter the note body.
3. Add tags if you want. Separate tags with commas.
4. Check Pin this note if you want the note to stay near the top.
5. Click Create note.

The note appears in the notes list.

## Edit Notes

Each note card has an Edit button.

1. Find the note you want to change.
2. Click Edit.
3. Update the title, body, tags, or pinned status.
4. Click Save.

To stop editing without saving, click Cancel.

## Delete Notes

Each note card has a delete button.

1. Find the note you want to remove.
2. Click the delete button.
3. The note is removed from the list.

Be careful. Deleted notes are removed from the app.

## Pin Notes

Pinned notes appear before unpinned notes.

You can pin a note when creating or editing it.

To pin a new note:

1. Fill out the create note form.
2. Check Pin this note.
3. Click Create note.

To pin or unpin an existing note:

1. Click Edit on the note.
2. Check or uncheck Pinned.
3. Click Save.

Pinned notes are sorted newest first. Unpinned notes are also sorted newest first.

## Search Notes

Use the search bar above the notes list.

Search matches:

- Title
- Body
- Tags

The list updates as you type.

If no notes match, the app shows a friendly empty state.

## Profile Editing

Use the Profile button to view and update your account name.

1. Click Profile in the dashboard header.
2. Click Edit Profile.
3. Change your name.
4. Click Save.

You can only edit your name here.

You cannot edit your email or role from the profile modal.

## User Roles

The app has three roles.

### user

A normal user can:

- Register and log in
- Create notes
- Edit notes
- Delete notes
- Pin notes
- Search notes
- Edit their own profile name

A normal user cannot open the Admin panel.

### admin

An admin can do everything a normal user can do.

An admin can also:

- Open the Admin panel
- View the users list

An admin cannot change user roles.

### superadmin

A superadmin can do everything an admin can do.

A superadmin can also:

- Change other users' roles

A superadmin cannot change their own role from the Admin modal.

## Admin Panel

The Admin button appears only for users with one of these roles:

- admin
- superadmin

Click Admin to open the admin panel.

Admins and superadmins can view:

- User names
- User emails
- User roles
- User created dates

Normal users do not see the Admin button.

## Superadmin Role Editing

Only a superadmin can change user roles.

Available roles are:

- user
- admin
- superadmin

To change a role:

1. Log in as a superadmin.
2. Open the Admin panel.
3. Find the user.
4. Use the role dropdown.
5. Choose the new role.

The app saves the change and refreshes the users list.

A superadmin cannot change their own role from the modal.

## Log Out

To sign out:

1. Click Log out in the dashboard header.
2. The app ends your session.
3. You will need to log in again to access protected pages.

## Troubleshooting

### The frontend does not load

Check that the frontend dev server is running:

```bash
npm run dev:client
```

Then open:

```text
http://localhost:5173
```

### The API does not respond

Check that the backend is running:

```bash
npm run dev:api
```

Then test:

```text
http://localhost:4000/api/health
```

### Login does not work

Check:

- The backend is running
- MongoDB is running or MongoDB Atlas is connected
- Your email and password are correct
- Your `.env` file has the right `MONGODB_URI`
- Your JWT secrets are set

### Notes do not load

Check:

- You are logged in
- The backend is running
- Your access token has not expired
- The frontend `VITE_API_BASE_URL` points to the backend URL

### Admin button is missing

The Admin button only appears for:

- admin
- superadmin

If you are a normal user, this is expected.

### Role dropdown is missing

Only superadmins can edit roles.

Admins can view users, but cannot change roles.

### Profile name does not update

Check:

- You entered at least 2 characters
- The backend is running
- You are still logged in

### Language does not change

Try refreshing the browser.

The selected language is saved in browser localStorage.

### Cookies or refresh login do not work in production

Check:

- Backend `CLIENT_ORIGIN` matches your frontend URL
- Backend `COOKIE_SECURE=true` in production
- Frontend `VITE_API_BASE_URL` points to the deployed backend
- Your browser is not blocking the cookie
