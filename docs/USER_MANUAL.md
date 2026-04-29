# User Manual

## Workspaces

A workspace is a shared area for an office or team. Users can keep private notes for themselves or create workspace notes that other members of the same workspace can see.

## Create a Workspace

1. Open Settings from the dashboard header.
2. Enter a workspace name in the Workspace section.
3. Select Create workspace.

The creator becomes the workspace owner.

## Add Staff

Workspace owners and managers can add members from Settings. Enter the member name, email, and choose either Staff or Manager. If the email already belongs to a user without another workspace, that user is added to your workspace. Otherwise, a placeholder user is created for now.

## Workspace Invitations

Workspace owners and managers can create invitation links from Settings. Enter the invitee email address, choose Staff or Manager, and select Create invite. The app returns an invite link that can be copied and shared manually.

Real email sending is not enabled yet. The invite link opens `/invite/:token`, where the invitee can review the workspace name, invited email, and role. The invitee must log in with the same email address that was invited before accepting. Accepted invites add the user to the workspace and set their workspace role.

Invites expire automatically after seven days or once accepted.

## Private Notes vs Workspace Notes

Private notes are visible only to the note owner. Workspace notes are visible to members of the same workspace.

Staff can create workspace notes and edit or delete their own workspace notes. Owners and managers can manage workspace members and can delete workspace notes created by other members.

## Comments and Collaboration

Each note can have comments. Open the comments section on a note card, type a message, and post it.

Private note comments are only available to the note owner. Workspace note comments are available to members of the same workspace, so teams can discuss shared notes in context.

Users can edit or delete their own comments. Workspace owners and managers can delete any comment on a workspace note when moderation is needed.

## File Attachments

Notes can include file attachments for office knowledge sharing. Open the Attachments section on a note card, choose Upload file, and select a supported file.

Supported file types are PDF, images (`jpg`, `jpeg`, `png`, `webp`), documents (`doc`, `docx`), text files (`txt`), and Markdown files (`md`). Each file can be up to 10MB.

Private note attachments are visible only to the note owner. Workspace note attachments are visible to members of the same workspace.

The uploader, note owner, workspace owner, or workspace manager can delete an attachment. Other workspace members can view and download workspace attachments but cannot delete files they do not own.

## Workspace Roles

Owner: creates and controls the workspace, manages members, and can manage shared workspace notes.

Manager: can view members, add staff or managers, and manage shared workspace notes.

Staff: can create workspace notes and manage their own workspace notes.

App roles still exist separately: user, admin, and superadmin. Admins can view users, and superadmins can edit app roles.

## Settings Page

Use Settings to update your name, language preference, and default note scope. You can also see your email, app role, plan, workspace name, and workspace role. Billing and plan changes still happen through the dashboard billing controls.
