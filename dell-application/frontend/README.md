# TUSKER AI Frontend Application

## Project Overview
This is the frontend application for the TUSKER AI project, built with React and modern web technologies. The application provides a user interface for interacting with AI-powered features and services, including admin and super admin functionalities.

## Technology Stack

### Core Technologies
- React 18.3.1
- Redux Toolkit with Redux Saga
- Material-UI (MUI) v6
- React Router v6
- Formik with Yup validation
- Axios for API calls
- SCSS for styling
- ESLint and Prettier for code quality

### Key Features
- Internationalization support (react-intl)
- Advanced data visualization (Highcharts, ApexCharts)
- Form handling and validation
- File handling and image processing
- Date/Time handling with multiple pickers
- Responsive design with Bootstrap
- Role-based access control (Admin, SuperAdmin)
- Protected routes and authentication
- Metronic theme integration

## Prerequisites

- Node.js (version 14.x or higher)
- npm (version 6.x or higher)
- Git
- Docker (for containerized deployment)

## Environment Setup

The project uses multiple environment configurations:
- `.env` - Base environment variables
- `.env.development` - Development environment
- `.env.producation` - Production environment
- `.env.local` - Local development
- `.env.dev.local` - Local development with HTTPS

Required environment variables:
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_BASE_URL` - Application base URL
- Other environment-specific variables

## Running the Application

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Choose the appropriate start command based on your environment:

   For development:
   ```bash
   npm run start:dev
   ```

   For production:
   ```bash
   npm run start:prod
   ```

   For local development:
   ```bash
   npm run start:local
   ```

   For local development with HTTPS:
   ```bash
   npm run start:localdev
   ```

4. The application will be available at:
   - Development: http://localhost:3000
   - HTTPS: https://localhost:3000 (when using start:localdev)

## Project Structure

```
frontend/
├── src/                    # Source code
│   ├── app/               # Application core
│   │   ├── Admin/        # Admin module
│   │   ├── SuperAdmin/   # Super Admin module
│   │   ├── ResultManager/# Result management
│   │   ├── Routes.js     # Route definitions
│   │   └── App.js        # Root component
│   ├── _metronic/        # Metronic theme files
│   ├── redux/            # Redux store and sagas
│   ├── utils/            # Utility functions
│   ├── enums/            # Enumeration definitions
│   ├── scss/             # Global styles
│   └── index.js          # Application entry point
├── public/               # Public assets
├── patches/             # Patch files
├── .env.*              # Environment configurations
├── Dockerfile          # Docker configuration
├── nginx.conf         # Nginx configuration
├── Jenkinsfile        # CI/CD pipeline configuration
└── sonar-project.properties # SonarQube configuration
```

## Development Guidelines

1. Code Style
   - Use ESLint for code linting: `npm run lint`
   - Format code with Prettier: `npm run format`
   - Follow the existing code structure in src/app
   - Use SCSS for styling with BEM methodology
   - Keep components small and focused
   - Use TypeScript for type safety

2. Git Workflow
   - Create feature branches from main
   - Follow conventional commit messages
   - Create pull requests for code review
   - Ensure all tests pass before merging
   - Keep commits atomic and focused
   - Use meaningful commit messages

3. Testing
   - Run tests: `npm test`
   - Ensure code coverage meets requirements
   - Test all routes and protected components
   - Verify role-based access control
   - Write unit tests for utilities
   - Test edge cases and error handling

4. Security
   - Never commit sensitive data or API keys
   - Use environment variables for configuration
   - Follow security best practices for authentication
   - Implement proper input validation
   - Sanitize user inputs
   - Use HTTPS in production

## Available Scripts

- `npm run lint` - Run ESLint for code quality
- `npm run format` - Format code with Prettier
- `npm run rtl` - Generate RTL styles
- `npm run test` - Run tests
- `npm run build:dev` - Build for development
- `npm run build:prod` - Build for production
- `npm run start:localdev` - Start with HTTPS

## SonarQube Analysis

### Prerequisites
- SonarQube server running (version 8.x or higher)
- SonarQube Scanner installed
- SonarQube token generated from your account

### Running SonarQube Analysis

1. Configure SonarQube properties in `sonar-project.properties`:
   ```properties
   sonar.projectKey=tusker-frontend
   sonar.projectName=Tusker Frontend
   sonar.sources=src
   sonar.tests=src
   sonar.test.inclusions=**/*.test.js,**/*.test.jsx
   sonar.javascript.lcov.reportPaths=coverage/lcov.info
   ```

2. Run the analysis:
   ```bash
   # Using npm script
   npm run sonar

   # Or directly using sonar-scanner
   sonar-scanner
   ```

3. View the report:
   - Open your SonarQube server (default: http://localhost:9000)
   - Navigate to your project
   - Review code quality metrics, bugs, vulnerabilities, and code smells

### Key Metrics Monitored
- Code coverage
- Code duplications
- Code smells
- Bugs and vulnerabilities
- Technical debt
- Code complexity

## Docker Setup

### Building the Docker Image

1. Build the image:
   ```bash
   docker build -t hiro-frontend:latest .
   ```

2. The Dockerfile includes:
   ```dockerfile
   # Build stage
   FROM node:14-alpine as build
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build:prod

   # Production stage
   FROM nginx:alpine
   COPY --from=build /app/build /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

### Running with Docker

1. Run the container:
   ```bash
   docker run -d -p 80:80 --name hiro-frontend hiro-frontend:latest
   ```

2. Access the application:
   - Open http://localhost in your browser

### Docker Commands

- View running containers:
  ```bash
  docker ps
  ```

- Stop the container:
  ```bash
  docker stop hiro-frontend
  ```

- Remove the container:
  ```bash
  docker rm hiro-frontend
  ```

- View container logs:
  ```bash
  docker logs hiro-frontend
  ```

### Environment Variables in Docker

1. Using .env file:
   ```bash
   docker run -d -p 80:80 --env-file .env.production hiro-frontend:latest
   ```

2. Using individual variables:
   ```bash
   docker run -d -p 80:80 \
     -e REACT_APP_API_URL=https://api.example.com \
     -e REACT_APP_BASE_URL=https://app.example.com \
     tusker-frontend:latest
   ```

## Troubleshooting

1. If you encounter dependency issues:
   ```bash
   rm -rf node_modules
   npm cache clean --force
   npm install
   ```

2. For build failures:
   - Check environment variables
   - Verify all dependencies are installed
   - Check for syntax errors
   - Clear browser cache
   - Check console for errors

## Acknowledgments

- Material-UI for the component library
- React team for the amazing framework
- Metronic for the theme and components
- All contributors to the open-source libraries used in this project
