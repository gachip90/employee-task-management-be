# Employee Task Management Back-end

The back-end for the Employee Task Management application, built with Node.js and Express (currently under development).

## Table of Contents

- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)

## Project Structure

The project is organized as follows:

```
employee-task-management-be/
├── (to be implemented)    # Source code (routes, controllers, etc.)
├── .gitignore             # Git ignore file
└── README.md              # Project documentation
```

## Technologies Used

- **Back-end**: Node.js, Express.js
- **Database**: Firebase
- **Others**: npm, Git

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/gachip90/employee-task-management-be.git
   cd employee-task-management-be
   ```

2. **Install dependencies** (when implemented):

   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Create a `.env` file in the root directory with the following variables:
     ```env
     PORT=5000
     DATABASE_URL=[Your_Database_URL]
     TWILIO_ACCOUNT_SID=[Your_Twilio_SID]
     GOOGLE_CREDENTIALS=[Your_Google_Credentials_JSON]
     ```

## Running the Application

1. **Start the back-end** (when implemented):
   ```bash
   npm start
   ```
   - The back-end will run on `http://localhost:5000`.

## Environment Variables

To securely manage sensitive information, use environment variables in a `.env` file. Example usage in code:

```javascript
// For Google Cloud credentials
const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);

// For Twilio
const twilioSid = process.env.TWILIO_ACCOUNT_SID;
```

Ensure the `.env` file is listed in `.gitignore` to prevent it from being pushed to the repository.
