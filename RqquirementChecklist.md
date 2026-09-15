## Project Requirements – Checklist
### Database Requirements
- [x] Use a relational database
- [x] At least 3 database tables with clear responsibilities
- [x] Meaningful relationships between tables using proper foreign keys
- [x] A users table (or equivalent authentication user persistence) as part of the model
- [x] At least one 1:N (one-to-many) relationship implemented and actively used
### Authentication & Authorization (Server-side + Client-side)
- Authentication implemented using
- [x] Laravel Breeze
- [x] Laravel Sanctum (API tokens)
- [x] Logged-in users cannot access data owned by other users
- [x] This rule is enforced at the API level, not only via UI hiding
- [x] Sensitive actions are protected by roles and/or permissions
### API (REST)
- [x] Full CRUD support for every core persisted resource exposed by the API
- [x] At least one persisted entity uses owner-scoped CRUD
### Client-side Pages / UI Quality
- [x] Polished, user-friendly interface
- Responsive design
- [x] Desktop
- [x] Mobile
- [x] Use of a component library