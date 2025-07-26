# Admin DTOs Documentation

## Overview
This directory contains Data Transfer Objects (DTOs) for the Admin module, following clean architecture principles and best practices.

## Structure

### ActivityLogFilterParams.cs
**Purpose**: Defines parameters for filtering activity logs at the repository level.

**Key Features**:
- Comprehensive filtering options (date range, user, action, entity type, etc.)
- Nullable properties for optional filters
- Pagination support (Limit/Offset)
- XML documentation for all properties

**Usage**:
```csharp
var filterParams = new ActivityLogFilterParams
{
    StartDate = DateTime.Today.AddDays(-7),
    EndDate = DateTime.Today,
    UserEmail = "user@example.com",
    Action = "Login",
    Limit = 50,
    Offset = 0
};
```

### ActivityLogWithUserInfo.cs
**Purpose**: Represents an activity log entry with associated user information.

**Key Features**:
- Complete activity log data with user details
- User full name and email information
- Comprehensive activity metadata (IP, user agent, timestamps)
- XML documentation for all properties

**Usage**:
```csharp
var activityLog = new ActivityLogWithUserInfo
{
    Id = "log-123",
    UserId = "user-456",
    FullName = "John Doe",
    UserEmail = "john.doe@example.com",
    Action = "Login",
    EntityType = "User",
    EntityId = "user-456",
    Timestamp = DateTime.UtcNow,
    Status = true
};
```

### SystemModels.cs
**Purpose**: Contains DTOs for system-related operations including activity logs.

**Key DTOs**:
- `ActivityLogModel`: Represents activity log data for API responses
- `ActivityLogPagedResult`: Paginated result wrapper for activity logs

## Best Practices Applied

### 1. **Separation of Concerns**
- Filter parameters are separated from interface definitions
- Each DTO has a single responsibility
- Clear distinction between input and output DTOs

### 2. **Documentation**
- XML documentation for all public properties
- Clear purpose statements for each class
- Usage examples where appropriate

### 3. **Type Safety**
- Nullable reference types for optional properties
- Strong typing for all properties
- Validation support through extension methods

### 4. **Extensibility**
- Extension methods for common operations
- Validation logic separated into extensions
- Easy to add new filter parameters

### 5. **Performance**
- Database-level filtering support
- Pagination built into filter parameters
- Efficient query building through extensions

## Extension Methods

### ActivityLogFilterExtensions
Located in `SecureAuth.APPLICATION.Extensions.ActivityLogFilterExtensions`

**Key Methods**:
- `ApplyFilters()`: Applies all filters to an IQueryable
- `ApplyEmailFilter()`: Specialized email filtering
- `ApplyPagination()`: Handles pagination logic
- `Validate()`: Validates filter parameters

### ActivityLogWithUserInfoExtensions
Located in `SecureAuth.APPLICATION.Extensions.ActivityLogWithUserInfoExtensions`

**Key Methods**:
- `GetActivityDescription()`: Gets a display-friendly activity description
- `GetActivitySummary()`: Gets a short summary of the activity
- `IsPerformedByUser()`: Checks if activity was performed by specific user
- `IsPerformedByEmail()`: Checks if activity was performed by user with specific email
- `GetTimeElapsed()`: Gets time elapsed since activity occurred
- `GetTimeElapsedString()`: Gets human-readable time elapsed string
- `IsRecent()`: Checks if activity is recent within specified time span
- `GetStatusCssClass()`: Gets CSS class name based on activity status
- `GetStatusText()`: Gets display-friendly status text

## Validation Rules

### ActivityLogFilterParams Validation
- Start date cannot be after end date
- Offset cannot be negative
- Limit must be greater than zero
- String lengths are validated (email max 256, action/entity max 100)

## Usage in Application Layer

### Query Handlers
```csharp
// Create filter parameters from query
var filterParams = new ActivityLogFilterParams
{
    StartDate = query.StartDate,
    UserEmail = query.UserEmail,
    // ... other properties
};

// Validate and apply filters
var (isValid, errorMessage) = filterParams.Validate();
if (!isValid)
    throw new ArgumentException(errorMessage);

// Get filtered results
var results = await _repository.GetFilteredWithUserInfoAsync(filterParams);
```

### Repository Layer
```csharp
// Apply filters using extension methods
var query = _context.Set<ActivityLog>().Include(x => x.User);
query = query.ApplyFilters(filterParams);
query = query.ApplyEmailFilter(filterParams.UserEmail);
```

### Using ActivityLogWithUserInfo Extensions
```csharp
// Get activity description
var description = activityLog.GetActivityDescription();
// Output: "John Doe performed Login on User"

// Check if recent activity
var isRecent = activityLog.IsRecent(TimeSpan.FromHours(1));

// Get time elapsed string
var timeElapsed = activityLog.GetTimeElapsedString();
// Output: "2 hours ago"

// Get status information
var statusClass = activityLog.GetStatusCssClass();
var statusText = activityLog.GetStatusText();

// Check if performed by specific user
var isByUser = activityLog.IsPerformedByUser("user-123");
var isByEmail = activityLog.IsPerformedByEmail("john@example.com");
```

## Benefits of This Approach

1. **Maintainability**: Clear separation makes code easier to maintain
2. **Testability**: Each component can be tested independently
3. **Reusability**: Extension methods can be reused across different queries
4. **Performance**: Database-level filtering reduces memory usage
5. **Type Safety**: Strong typing prevents runtime errors
6. **Documentation**: Self-documenting code with XML comments 