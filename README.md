# SecureAuth - Dynamic Authorization and Authentication System

A comprehensive .NET 9.0 authentication and authorization system with dynamic role-based access control, security features, and audit logging.

## 🏗️ Architecture

This project follows Clean Architecture principles with the following layers:

- **SecureAuth.API** - Web API layer with controllers and middleware
- **SecureAuth.APPLICATION** - Application services, commands, queries, and business logic
- **SecureAuth.DOMAIN** - Domain models, entities, and interfaces
- **SecureAuth.INFRASTRUCTURE** - Data access, external services, and implementations
- **SecureAuth.TESTS** - Unit, integration, and functional tests

## 🚀 Getting Started

### Prerequisites

- .NET 9.0 SDK
- SQL Server (LocalDB, Express, or full version)
- Visual Studio 2022 or VS Code

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd daynamicauthorizationandauthentication/src
   ```

2. **Restore dependencies**
   ```bash
   dotnet restore
   ```

3. **Build the solution**
   ```bash
   dotnet build
   ```

### Database Setup

#### 1. Configure Connection String

Update the connection string in `SecureAuth.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=SecureAuthDb;Trusted_Connection=true;MultipleActiveResultSets=true"
  }
}
```

#### 2. Run Database Migrations

**Important**: This project uses Entity Framework Core migrations. Follow these steps to set up the database:

```bash
# Navigate to the src directory
cd daynamicauthorizationandauthentication/src

# Create initial migration (if no migrations exist)
dotnet ef migrations add InitialCreate --project SecureAuth.INFRASTRUCTURE/SecureAuth.INFRASTRUCTURE.csproj --startup-project SecureAuth.API --context ApplicationDbContext

# Apply migrations to create/update database
dotnet ef database update --project SecureAuth.INFRASTRUCTURE/SecureAuth.INFRASTRUCTURE.csproj --startup-project SecureAuth.API
```

#### 3. Adding New Migrations

When you make changes to entity models or DbContext:

```bash
# Create a new migration
dotnet ef migrations add MigrationName --project SecureAuth.INFRASTRUCTURE/SecureAuth.INFRASTRUCTURE.csproj --startup-project SecureAuth.API --context ApplicationDbContext

# Apply the migration
dotnet ef database update --project SecureAuth.INFRASTRUCTURE/SecureAuth.INFRASTRUCTURE.csproj --startup-project SecureAuth.API
```

**Note**: Always specify the exact project file (`SecureAuth.INFRASTRUCTURE.csproj`) to avoid conflicts with the separate `DaynamicAuthorizationAndAuthentication.Data.csproj` file.

### Running the Application

1. **Start the API**
   ```bash
   cd SecureAuth.API
   dotnet run
   ```

2. **Access Swagger UI**
   - Navigate to `https://localhost:7001/swagger` (or the port shown in your console)
   - Explore the API endpoints and test functionality

## 🔧 Configuration

### JWT Settings

Configure JWT settings in `appsettings.json`:

```json
{
  "JWT": {
    "ValidAudience": "https://localhost:7001",
    "ValidIssuer": "https://localhost:7001",
    "Secret": "your-super-secret-key-here-minimum-16-characters"
  }
}
```

### Email Configuration

Configure email settings for password reset and notifications:

```json
{
  "EmailConfiguration": {
    "From": "noreply@yourapp.com",
    "SmtpServer": "smtp.gmail.com",
    "Port": 587,
    "Username": "your-email@gmail.com",
    "Password": "your-app-password"
  }
}
```

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - Dynamic permission system
- **Password Policies** - Configurable password requirements
- **Rate Limiting** - API request throttling
- **Audit Logging** - Comprehensive activity tracking
- **Two-Factor Authentication** - Enhanced security
- **Account Lockout** - Protection against brute force attacks

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### User Management
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Role Management
- `GET /api/admin/roles` - Get all roles
- `POST /api/admin/roles` - Create role
- `PUT /api/admin/roles/{id}` - Update role
- `DELETE /api/admin/roles/{id}` - Delete role

### System Administration
- `GET /api/admin/system/health` - System health check
- `GET /api/admin/audit-logs` - View audit logs
- `POST /api/admin/system/backup` - System backup

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
dotnet test

# Run specific test project
dotnet test SecureAuth.TESTS

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

## 📁 Project Structure

```
src/
├── SecureAuth.API/                 # Web API layer
│   ├── Controllers/               # API controllers
│   ├── Middleware/               # Custom middleware
│   └── Program.cs                # Application startup
├── SecureAuth.APPLICATION/        # Application layer
│   ├── Commands/                 # CQRS commands
│   ├── Queries/                  # CQRS queries
│   ├── Services/                 # Application services
│   └── DTOs/                     # Data transfer objects
├── SecureAuth.DOMAIN/            # Domain layer
│   ├── Models/                   # Domain entities
│   ├── Interfaces/               # Domain interfaces
│   └── Enums/                    # Domain enums
├── SecureAuth.INFRASTRUCTURE/    # Infrastructure layer
│   ├── Data/                     # Entity Framework context
│   ├── Services/                 # External service implementations
│   └── Migrations/               # Database migrations
└── SecureAuth.TESTS/             # Test projects
    ├── Unit/                     # Unit tests
    ├── Integration/              # Integration tests
    └── Functional/               # Functional tests
```

## 🔄 Migration Troubleshooting

### Common Issues

1. **"More than one project was found"**
   - Solution: Always specify the exact project file: `SecureAuth.INFRASTRUCTURE/SecureAuth.INFRASTRUCTURE.csproj`

2. **"Entity requires a primary key"**
   - Solution: Ensure all entities have a primary key (usually `Id` property)

3. **"DbContext not found"**
   - Solution: Verify the context name in the migration command: `--context ApplicationDbContext`

4. **"DLL not found"**
   - Solution: Build the solution first: `dotnet build`

### Migration Commands Reference

```bash
# List all migrations
dotnet ef migrations list --project SecureAuth.INFRASTRUCTURE/SecureAuth.INFRASTRUCTURE.csproj --startup-project SecureAuth.API

# Remove last migration
dotnet ef migrations remove --project SecureAuth.INFRASTRUCTURE/SecureAuth.INFRASTRUCTURE.csproj --startup-project SecureAuth.API

# Generate SQL script
dotnet ef migrations script --project SecureAuth.INFRASTRUCTURE/SecureAuth.INFRASTRUCTURE.csproj --startup-project SecureAuth.API

# Update database to specific migration
dotnet ef database update MigrationName --project SecureAuth.INFRASTRUCTURE/SecureAuth.INFRASTRUCTURE.csproj --startup-project SecureAuth.API
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the troubleshooting section above
- Review the `SECURITY_FEATURES.md` and `TDD_GUIDE.md` files
- Create an issue in the repository 