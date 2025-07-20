# CAN – A Modern E-Commerce Platform for Fashion

**CAN** is a modern, AI-powered e-commerce platform tailored for the fashion retail industry. Built using **Next.js**, **TypeScript**, and **MongoDB**, it combines elegant design, efficient management, and smart AI recommendations. The platform offers a seamless shopping experience for users and a powerful admin dashboard for store owners.

> 🎓 This project was developed as part of a **university academic project** by a team of three students.

---

## 🚀 Features

- 🛍️ Stylish storefront with fashion-forward UI
- 👩‍💼 Admin panel for product, order, and user management
- 🤖 AI Stylist – get smart outfit suggestions (powered by Genkit)
- 🔒 JWT-based user authentication and role-based access
- 📦 Backend powered by Express and MongoDB
- 📱 Fully responsive design

---

## 👥 Team Members & Roles

| Member | Role |
|--------|------|
| **Chironto Rudra Paul** | Admin panel – frontend & backend |
| **Najir Hossain Sahinur** | Customer side – UI/UX, frontend & backend |
| **Arnob Das** | Database management and testing |

> The project name **CAN** is derived from the initials of the developers:  
> **C** – Chironto, **A** – Arnob, **N** – Najir

---

## ⚙️ Tech Stack

- **Frontend**: Next.js, Tailwind CSS, TypeScript
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **AI Integration**: Google Genkit
- **Authentication**: JWT

---

## 🛠️ Setup & Installation

### ✅ Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Git
- (Optional) Google Cloud SDK + Genkit (for AI stylist)

---


---

### 📦 2. Install Dependencies

```bash
npm install
# or
yarn
```

---

### 🔐 3. Configure Environment Variables

Create a `.env.local` file in the root directory and add the following:

```
MONGODB_URI=mongodb://localhost:27017/can-db
JWT_SECRET=your_jwt_secret_here
GENKIT_API_KEY=your_google_genkit_api_key
GENKIT_PROJECT_ID=your_gcp_project_id
```

---

### 🚴 4. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

Then open your browser and go to:

```
http://localhost:9002
```

---

### 🤖 5. (Optional) Enable Genkit AI Features

If you want to enable the AI stylist features, run:

```bash
npx genkit dev
```

Make sure Genkit is installed and your Google Cloud credentials are configured correctly.

---

## 📁 Project Structure

```
CAN_v5/
│
├── src/
│   ├── app/               # Next.js pages and layouts
│   ├── components/        # Reusable UI components
│   ├── lib/               # Utility functions and helpers
│   ├── api/               # Express backend endpoints
│   └── ai/                # Genkit AI logic
│
├── public/                # Static assets
├── .env.local             # Environment variables
├── package.json
└── README.md
```

---

## 📸 Screenshots

> *(Optional — include screenshots of the homepage, product page, admin dashboard, and AI stylist interface if available)*

---

## 🙌 Contribution

We welcome contributions!  
Please fork the repo, create a feature branch, and submit a pull request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---



## 📞 Contact

CHECK PRESENATION SLIDE FOR CLARITY

For questions or feedback, feel free to contact any of the team members via GitHub.
