# InventoryManager — FastAPI Backend

A robust FastAPI backend for an inventory management system, featuring secure JWT authentication, advanced password hashing, and seamless deployment. This project includes interactive API documentation and a simple static frontend for immediate use.

---

## ✨ Features

-   **Interactive API Docs:** Automatically generated documentation with Swagger UI at `/docs`.
-   **Secure Authentication:** JWT-based authentication for protected routes.
-   **Advanced Password Hashing:** Uses **Argon2** as the primary hashing algorithm with a **bcrypt** fallback for maximum security.
-   **Database Integration:** Built with SQLAlchemy and SQLModel for easy interaction with a Postgres database.
-   **Full CRUD Functionality:** Complete Create, Read, Update, and Delete operations for inventory products.
-   **Clean Architecture:** Organized code with distinct routers, schemas, and services.

---

## 🛠️ Tech Stack

-   **Backend:** Python 3.10+, FastAPI, SQLAlchemy, SQLModel
-   **Authentication:** `python-jose` for JWT, `passlib` with `argon2-cffi` and `bcrypt`
-   **Database:** PostgreSQL
-   **Frontend:** Simple HTML, CSS, and JavaScript (served from the `/static` directory)
-   **Deployment:** Railway (API + Database) & Netlify (Static Frontend)

---

## 🚀 Quick Start (Local Setup)

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/](https://github.com/)<your-username>/InventoryManager.git
    cd InventoryManager
    ```

2.  **Create a Virtual Environment and Install Dependencies:**
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    pip install -r requirements.txt
    ```

3.  **Set Up Environment Variables:**
    Create a `.env` file in the root directory and add the following variables:
    ```
    DATABASE_URL=postgresql://user:password@host:5432/dbname
    SECRET_KEY=your_super_secret_jwt_key
    CORS_ORIGINS=http://localhost:3000,[http://127.0.0.1:5500](http://127.0.0.1:5500)
    ```

4.  **Run the Server:**
    ```bash
    uvicorn app.main:app --reload
    ```

5.  **Access the API:**
    -   **API Docs (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
    -   **Alternate Docs (ReDoc):** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📝 API Endpoints

### Authentication

-   `POST /auth/register`: Register a new user.
-   `POST /auth/login`: Log in to receive a JWT access token.
-   `GET /users/me`: Get information about the currently authenticated user.

### Products (Requires Authentication)

-   `GET /products`: Retrieve a list of all products.
-   `POST /products`: Add a new product to the inventory.
-   `PUT /products/{id}`: Update an existing product by its ID.
-   `DELETE /products/{id}`: Delete a product by its ID.

---

## ☁️ Deployment

### Backend on Railway

1.  Create a new project on Railway and link it to your GitHub repository.
2.  Add a **Postgres** database service. Railway will automatically provide the `DATABASE_URL`.
3.  In your service settings, add `SECRET_KEY` and `CORS_ORIGINS` as environment variables.
4.  Set the start command to:
    ```bash
    uvicorn app.main:app --host 0.0.0.0 --port $PORT
    ```
5.  Railway will automatically deploy your application upon pushing to the main branch.

### Frontend on Netlify

1.  Connect your GitHub repository to Netlify.
2.  Set the **Publish directory** to `static`.
3.  Leave the **Build command** empty.
4.  Deploy the site.
5.  Remember to add your Netlify site URL to the `CORS_ORIGINS` variable in your Railway backend settings.

---

## 🛣️ Roadmap

-   [ ] Implement refresh tokens for extended sessions.
-   [ ] Add role-based access control (Admin vs. User).
-   [ ] Integrate CI/CD pipelines for automated testing and deployment.
-   [ ] Implement password reset and email verification features.

---

## 📄 License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.
