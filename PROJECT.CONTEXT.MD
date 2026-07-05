# HomeSpace - Project Context

## Project
HomeSpace (Airbnb Clone)

## Developer
Abhay Shakya

## Tech Stack
- Node.js
- Express.js
- MongoDB
- Mongoose
- EJS
- Tailwind CSS
- Multer
- Express Session

---

# Completed Features ✅

✔ User Authentication
- Signup
- Login
- Logout
- Session Management

✔ Home Management
- Add Home
- Edit Home
- Delete Home
- View Home Details

✔ Image Upload
- Multer
- Images stored inside uploads/
- Static folder configured

✔ Favourite Homes

✔ GitHub Repository

✔ Git Ignore
- node_modules
- .env
- .DS_Store

---

# Current Folder Structure

controllers/
models/
routes/
views/
public/
uploads/
utils/

app.js
package.json

---

# Important Notes

Image Path:

/uploads/filename.jpg

Multer stores images inside uploads folder.

Do not use req.body.photo.

Use:

const photo = req.file
? "/uploads/" + req.file.filename
: "";

---

# Coding Style

Always explain:

1. Why
2. Where
3. What to change
4. Code
5. Result

Never directly give the final code without explanation.

---

# Git Workflow

After every working feature:

git add .
git commit -m "Feature name"
git push

---

# Pending Features

[ ] Booking System

[ ] Reviews & Ratings

[ ] Search & Filters

[ ] Pagination

[ ] Cloudinary

[ ] Admin Panel

[ ] Payment

[ ] Email Verification

[ ] Forgot Password

[ ] Deployment

---

# Debugging Style

Always debug step by step.

Never jump directly to the solution.

Explain the reason of every error.

---

# Current Status

Project is stable.

Authentication works.

File upload works.

Images work.

Favourite works.

GitHub backup completed.

Ready for next feature.