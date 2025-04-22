# Multi-Tool Web App

This project is a web application that provides multiple online tools, including an Excel analyzer and a number lookup service. It uses React for the frontend and Django for the backend.

## Project Structure

The project is divided into two main parts:

1. `frontend/`: Contains the React application
2. `backend/`: Contains the Django application

## Setup and Running

### Frontend

1. Navigate to the `frontend` directory
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

The frontend will be available at `http://localhost:3000`

### Backend

1. Navigate to the `backend` directory
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - On Windows: `venv\Scripts\activate`
   - On macOS and Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run migrations: `python manage.py migrate`
6. Start the development server: `python manage.py runserver`

The backend API will be available at `http://localhost:8000`
