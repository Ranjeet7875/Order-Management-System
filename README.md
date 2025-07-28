# Order Management System (Frontend)

A modern, responsive React-based frontend for managing orders, inventory, and users. Features authentication, role-based access, real-time notifications, and a clean dashboard UI.

## Features

- **Authentication**: Login and signup with role selection (`user`, `staff`). JWT-based session management.
- **Role-Based Access**: Admin, staff, and user roles with different permissions.
- **Dashboard**: Visual summary of users, orders, inventory, and pending orders.
- **Order Management**:
  - List, search, and filter orders by customer name and status.
  - Create, view, edit, and delete orders.
  - Update order status (Pending, Paid, Fulfilled, Cancelled).
  - Mark payment received.
- **Inventory Management**:
  - List inventory items with product ID, name, quantity, reserved, and available stock.
  - Add new inventory items.
- **User Management** (Admin only):
  - List all users with role, status, and creation date.
- **Profile**: View logged-in user's profile and account details.
- **Notifications**: Real-time feedback for actions (success, error, info).
- **Responsive UI**: Clean, modern design with navigation and consistent styling.

## Project Structure

```
frontend/
  src/
    component/
      OrderManagementSystem.jsx   # Main React component (SPA)
    ...
  ...
```

## Setup Instructions

### Prerequisites

- Node.js (v14+ recommended)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the development server:
   ```sh
   npm start
   ```
   The app will run at `http://localhost:3000`.

> **Note:** The frontend expects the backend API to be running at  
> `https://order-management-system-fe5y.onrender.com`  
> (see `API_BASE_URL` in the code). Update this if your backend runs elsewhere.

## Usage

- **Login/Signup**: Enter your credentials to log in or create a new account. Choose your role during signup.
- **Dashboard**: View stats and recent orders.
- **Orders**:  
  - View all orders, filter/search, and perform actions (view, edit, delete, status update).
  - Create new orders with multiple items.
- **Inventory**:  
  - View inventory list and add new items.
- **Users** (Admin):  
  - View all users and their roles/status.
- **Profile**:  
  - View your account details.
- **Notifications**:  
  - See real-time feedback for all actions in the top-right corner.

## Technologies Used

- **React** (SPA, Hooks)
- **lucide-react** (icons)
- **Fetch API** (for backend communication)
- **Custom CSS-in-JS** (inline styles)

## Customization

- To change the backend API URL, edit the `API_BASE_URL` constant in [`OrderManagementSystem.jsx`](frontend/frontend/src/component/OrderManagementSystem.jsx).
- To add more roles or permissions, update the backend and adjust role checks in the frontend as needed.

## License

MIT

---

*This README was generated based on the actual code and functionality in the project. For backend/API details, see the backend README.*
