 # Backend Service (FastAPI)

 This backend is a FastAPI service providing APIs for user, camera, RTSP, activity logs, notifications, and related features. It uses MySQL via SQLAlchemy for relational data and integrates with optional Sentry monitoring and AWS utilities.

 Category: Documentation / Overview

 ## Quickstart

 1. **Prerequisites**
    - Python 3.8+
    - MySQL 8.x reachable from your machine
    - FFmpeg installed (needed for RTSP probing)

 2. **Environment variables** (example)
    Create a `.env` or export these vars in your shell:
    ```bash
    export PROJECT_ENV=development
    export MYSQL_HOSTNAME=localhost
    export MYSQL_USERNAME=user
    export MYSQL_PASS=pass
    export MYSQL_PORT=3306
    export MYSQL_DB_NAME=autoserving_db
    export MYSQL_POOL_SIZE=10
    export MYSQL_MAX_OVERFLOW=20
    export MYSQL_POOL_TIMEOUT=30
    export MYSQL_POOL_PRE_PING=true
    export MYSQL_POOL_RECYCLE=1800

    # Mongo vars (used by result utils); keep if features require them
    export MONGO_HOST=localhost
    export MONGO_USER=user
    export MONGO_PASS=pass
    export MONGO_DB_NAME=autoserving_mongo
    export MONGO_PORT=27017
    export MONGO_AUTH_DB_NAME=admin
    export MONGO_COLL_NAME=results
    ```

 3. **Install dependencies**
    ```bash
    python -m venv .venv && source .venv/bin/activate
    pip install -r autoserving-req.txt
    ```

 4. **Run the app**
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```

 5. **Explore APIs**
    - Swagger UI: http://localhost:8000/docs
    - OpenAPI JSON: http://localhost:8000/api/v1/openapi.json

 ## Repository structure (backend)

 ```
 backend/
 ├── api/
 │   ├── api_v1/
 │   │   ├── api.py                     # Aggregates routers and tags
 │   │   └── endpoints/                 # All versioned API endpoints
 │   ├── deps.py                        # DB session & auth dependencies
 │   └── __init__.py
 ├── applogging/
 │   └── applogger.py                   # YAML-based logging config utils
 ├── core/
 │   ├── config.py                      # Pydantic settings (env-driven)
 │   ├── aws_utils.py, result_utils.py  # AWS, result helpers (selected)
 │   └── ...
 ├── crud/                              # CRUD services layer
 ├── db/
 │   ├── base_class.py                  # Declarative Base and helpers
 │   ├── base.py                        # Imports models to register metadata
 │   ├── session.py                     # Engine & SessionLocal
 │   └── init_db.py                     # Create tables on import
 ├── models/                            # SQLAlchemy ORM models
 ├── schemas/                           # Pydantic schemas
 ├── main.py                            # FastAPI app bootstrap
 ├── utils.py                           # JWT reset tokens, RTSP probing
 ├── autoserving-req.txt                # Python dependencies
 ├── Dockerfile                         # Container build (if used)
 └── log_config.yml                     # Logging config (YAML)
 ```

 ## Development notes

 - Do not hardcode secrets in source; prefer env vars or secret managers.
 - Keep commented endpoints in `api/api_v1/endpoints/` for future enablement.
 - Pagination is enabled globally via `fastapi_pagination.add_pagination(app)`.
 - Background jobs (APScheduler) are present but disabled by default in `main.py`.

# AutoServing API Service

## Project Overview
This project implements a robust Python-based microservice with integrated code quality analysis using SonarQube. The service is designed to handle automated serving requests with high performance and reliability. The application is containerized using Docker and includes both MySQL for application data and PostgreSQL for SonarQube analysis.

## Technology Stack
### Backend
- **Language**: Python 3.8
- **Framework**: FastAPI
- **Server**: Uvicorn
- **Database**: 
  - MySQL 8.0 (Primary Database)
  - MongoDB 6.0 (Document Storage)
  - PostgreSQL 13 (SonarQube Database)
- **Code Quality**: 
  - SonarQube Community Edition 9.9
  - JaCoCo for code coverage

### Infrastructure
- **Containerization**: Docker 20.10 & Docker Compose 2.0
- **CI/CD**: Jenkins 2.387
- **Version Control**: Git 2.39
- **Code Analysis**: SonarQube 9.9

## Prerequisites
### System Requirements
- Docker Engine (version 20.10.0 or higher)
- Docker Compose (version 2.0.0 or higher)
- Python 3.8 or higher
- Git 2.39 or higher
- Minimum 4GB RAM
- 20GB free disk space

### Software Dependencies
- MySQL Server 8.0 (if running locally)
- MongoDB 6.0 (if running locally)
- PostgreSQL 13 (if running locally)
- FFmpeg 4.4 (for media processing)
- Python packages (listed in autoserving-req.txt)

## Running the Application

### 1. Clone the Repository
```bash
# Clone the repository
git clone https://github.com/your-username/autoserving-api.git
cd autoserving-api

# Switch to the desired branch
git checkout main
```

### 2. Environment Setup
Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
MYSQL_HOSTNAME=localhost
MYSQL_USERNAME=your_username
MYSQL_PASS=your_secure_password
MYSQL_PORT=3306
MYSQL_DB_NAME=autoserving_db
MYSQL_POOL_SIZE=10

# MongoDB Configuration
MONGO_HOSTNAME=localhost
MONGO_PORT=27017
MONGO_USERNAME=your_username
MONGO_PASSWORD=your_secure_password
MONGO_DB_NAME=autoserving_mongo
MONGO_AUTH_SOURCE=admin

# SonarQube Configuration
SONAR_HOST_URL=http://localhost:9000
SONAR_TOKEN=your_sonar_token
```

### 3. Running with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app
docker-compose logs -f sonarqube
docker-compose logs -f mysql
docker-compose logs -f mongodb

# Stop all services
docker-compose down
```

### 4. Accessing Services
- **Main Application**: http://localhost:80
  - API Documentation: http://localhost:80/docs
  - ReDoc Documentation: http://localhost:80/redoc

- **SonarQube**: http://localhost:9000
  - Default credentials: admin/admin
  - Change password on first login

- **Database Management**:
  - MySQL: localhost:3306
  - MongoDB: localhost:27017
  - PostgreSQL: localhost:5432

## Project Structure
```
.
├── Dockerfile                 # Main application container configuration
├── docker-compose.yml        # Multi-container orchestration
├── sonar-project.properties  # SonarQube configuration
├── autoserving-req.txt      # Python dependencies
├── main.py                  # Application entry point
├── src/                     # Source code directory
│   ├── api/                # API endpoints
│   ├── core/               # Core business logic
│   ├── models/             # Database models
│   │   ├── mysql/         # MySQL models
│   │   └── mongodb/       # MongoDB models
│   └── utils/              # Utility functions
├── tests/                  # Test directory
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
└── README.md              # Project documentation
```

## Development Guidelines

### Code Quality Standards
1. **SonarQube Analysis**
   - Run analysis before each commit
   - Maintain code coverage above 80%
   - Address all critical and blocker issues
   - Follow SonarQube best practices

2. **Python Coding Standards**
   - Follow PEP 8 style guide
   - Use type hints
   - Write docstrings for all functions
   - Maximum line length: 88 characters

3. **Testing Requirements**
   - Write unit tests for all new features
   - Maintain minimum 80% code coverage
   - Run tests before committing
   - Include integration tests for API endpoints

### Git Workflow
1. **Branch Strategy**
   - `main`: Production-ready code
   - `develop`: Development branch
   - `feature/*`: New features
   - `bugfix/*`: Bug fixes
   - `hotfix/*`: Urgent production fixes

2. **Commit Guidelines**
   - Use conventional commit messages
   - Format: `type(scope): description`
   - Types: feat, fix, docs, style, refactor, test, chore
   - Keep commits atomic and focused

3. **Pull Request Process**
   - Create PR from feature branch to develop
   - Include description of changes
   - Reference related issues
   - Ensure CI/CD pipeline passes
   - Get at least one review approval

### Deployment Steps
1. **Pre-deployment**
   - Update version numbers
   - Run full test suite
   - Perform SonarQube analysis
   - Update documentation

2. **Deployment Process**
   - Build Docker images
   - Run security scans
   - Deploy to staging
   - Run smoke tests
   - Deploy to production

3. **Post-deployment**
   - Monitor application logs
   - Verify all services are running
   - Check database connections
   - Validate API endpoints

## Troubleshooting
### Common Issues
1. **Database Connection Issues**
   - Verify database credentials
   - Check network connectivity
   - Ensure database is running
   - Check database logs for errors

2. **SonarQube Analysis Failures**
   - Check SonarQube server status
   - Verify project configuration
   - Check token validity
   - Review analysis logs

3. **Docker Issues**
   - Clear Docker cache: `docker system prune`
   - Rebuild containers: `docker-compose build --no-cache`
   - Check container logs
   - Verify port availability

4. **MongoDB Specific Issues**
   - Check authentication settings
   - Verify replica set configuration
   - Monitor connection pool size
   - Check index usage

5. **MySQL Specific Issues**
   - Check connection pool settings
   - Verify character set configuration
   - Monitor query performance
   - Check buffer pool size

## Acknowledgments
- FastAPI framework and community
- SonarQube team for code quality tools
- Docker team for containerization
- All project contributors
