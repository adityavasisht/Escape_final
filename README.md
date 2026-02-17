Here is a comprehensive `README.md` file for your **Escape** project. It covers the tech stack, features, installation instructions, and environment setup for both the frontend and backend.

---
## 🎥 Video Walkthrough

[![Watch the video]([https://cdn.loom.com/sessions/thumbnails/YOUR_LOOM_VIDEO_ID-with-play-button.gif](https://www.loom.com/share/599428dea0434cc98b33db94624b148b))](https://www.loom.com/share/YOUR_LOOM_VIDEO_ID)

# Escape - Travel Booking Platform

**Escape** is a full-stack travel booking application designed to help users discover, book, and negotiate customized travel packages. It features a robust admin dashboard for managing trips and bookings, alongside a user-friendly interface for travelers to explore destinations and secure the best deals.

*(Replace with actual screenshot from `public/assets/hero1.avif`)*

## 🚀 Features

### User Features

* **Explore Destinations:** Browse a wide range of curated travel packages with detailed itineraries and pricing.
* **Smart Search:** Filter trips by budget, duration, location, and rating.
* **Booking System:** Securely book trips with integrated payment gateways.
* **Bargain Feature:** Unique negotiation system allowing users to propose their own budget for specific packages.
* **User Dashboard:** View booking history, negotiation status, and profile management.
* **Authentication:** Secure sign-up and login via Clerk (Email, Google, etc.).

### Admin Features

* **Trip Management:** Create, edit, and delete travel packages (CRUD operations).
* **Booking Oversight:** View and manage all user bookings and their statuses.
* **Bargain Management:** Review, accept, or reject user budget proposals.
* **Analytics Dashboard:** Visual insights into revenue, popular destinations, and user growth.
* **Secure Access:** Protected admin routes and role-based authentication.

## 🛠️ Tech Stack

### Frontend (`/escape`)

* **Framework:** React.js (Create React App)
* **Styling:** Tailwind CSS
* **Routing:** React Router DOM
* **Authentication:** Clerk (`@clerk/clerk-react`)
* **Icons:** Lucide React / Heroicons
* **State Management:** React Hooks (`useState`, `useEffect`, `useContext`)

### Backend (`/backend`)

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (Mongoose ODM)
* **Cloud Functions:** Firebase Functions (for scalable backend logic)
* **Security:** CORS, Helmet, Dotenv
* **Email:** Nodemailer (for booking confirmations)

---

## 📦 Installation & Setup

### Prerequisites

* [Node.js]() (v14 or higher)
* [MongoDB]() (Local or Atlas URI)
* [Clerk Account]() (For authentication keys)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/escape.git
cd escape

```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install

```

**Environment Variables:**
Create a `.env` file in the `backend/` root:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
ADMIN_EMAIL=admin@escape.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

```

Start the backend server:

```bash
npm start
# Server runs on http://localhost:5001

```

### 3. Frontend Setup

Open a new terminal, navigate to the frontend directory, and install dependencies:

```bash
cd ../escape
npm install

```

**Environment Variables:**
Create a `.env` file (or `.env.local`) in the `escape/` root:

```env
REACT_APP_API_URL=http://localhost:5001
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

```

Start the frontend application:

```bash
npm start
# App runs on http://localhost:3000

```

---

## 📂 Project Structure

```text
Escape/
├── backend/                # Express API & Server
│   ├── models/             # Mongoose Schemas (Trip, User, Booking)
│   ├── routes/             # API Endpoints (auth, trips, admin)
│   ├── controllers/        # Logic for route handling
│   └── server.js           # Entry point
│
└── escape/                 # React Frontend
    ├── public/             # Static assets (images, icons)
    └── src/
        ├── components/     # Reusable UI components (Navbar, Footer, Cards)
        ├── pages/          # Full page views (Home, TripDetails, Dashboard)
        ├── context/        # React Context (Auth, Global State)
        └── utils/          # Helper functions and API calls

```

## 🔗 API Endpoints

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| **GET** | `/api/trips` | Get all available trips | Public |
| **GET** | `/api/trips/:id` | Get single trip details | Public |
| **POST** | `/api/bookings` | Create a new booking | User |
| **POST** | `/api/bargain` | Submit a bargain request | User |
| **GET** | `/api/admin/trips` | Get all trips (Admin view) | Admin |
| **POST** | `/api/admin/trips` | Create a new trip | Admin |
| **DELETE** | `/api/admin/trips/:id` | Delete a trip | Admin |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed with ❤️ by the Escape Team**
