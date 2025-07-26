# Test-Driven Development (TDD) Guide for SecureAuth

## Overview
This guide explains the TDD implementation for the SecureAuth project, following the Red-Green-Refactor cycle and comprehensive testing strategies.

## 🎯 TDD Principles Implemented

### **Red-Green-Refactor Cycle**
1. **Red**: Write a failing test first
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve the code while keeping tests green

### **Test Categories**

#### **1. Unit Tests** (`/Unit/`)
- **Purpose**: Test individual components in isolation
- **Scope**: Single class or method
- **Dependencies**: Mocked using Moq
- **Examples**: 
  - `AuthenticationServiceTests.cs`
  - `TokenServiceTests.cs`
  - `PasswordValidationTests.cs`

#### **2. Integration Tests** (`/Integration/`)
- **Purpose**: Test component interactions
- **Scope**: Multiple components working together
- **Dependencies**: In-memory database, real services
- **Examples**:
  - `AuthenticationControllerIntegrationTests.cs`
  - `DatabaseIntegrationTests.cs`

#### **3. Security Tests** (`/Security/`)
- **Purpose**: Validate security measures
- **Scope**: Security headers, rate limiting, input validation
- **Examples**:
  - `SecurityTests.cs`
  - `AuthenticationSecurityTests.cs`

#### **4. Functional Tests** (`/Functional/`)
- **Purpose**: Test complete user workflows
- **Scope**: End-to-end scenarios
- **Examples**:
  - `EndToEndTests.cs`
  - `UserWorkflowTests.cs`

## 🛠️ Testing Tools & Frameworks

### **Core Testing Framework**
- **xUnit**: Primary testing framework
- **FluentAssertions**: Readable assertions
- **Moq**: Mocking framework
- **AutoFixture**: Test data generation

### **Testing Utilities**
- **TestBase**: Common test setup and utilities
- **WebApplicationFactory**: Integration test support
- **In-Memory Database**: Fast, isolated database testing

## 📋 Test Structure

```
SecureAuth.TESTS/
├── Helpers/
│   └── TestBase.cs                 # Base test classes
├── Unit/
│   ├── AuthenticationServiceTests.cs
│   ├── TokenServiceTests.cs
│   └── PasswordValidationTests.cs
├── Integration/
│   ├── AuthenticationControllerIntegrationTests.cs
│   └── DatabaseIntegrationTests.cs
├── Security/
│   └── SecurityTests.cs
├── Functional/
│   └── EndToEndTests.cs
└── SecureAuth.TESTS.csproj
```

## 🚀 Running Tests

### **Run All Tests**
```bash
cd SecureAuth.TESTS
dotnet test
```

### **Run Specific Test Categories**
```bash
# Unit tests only
dotnet test --filter "Category=Unit"

# Integration tests only
dotnet test --filter "Category=Integration"

# Security tests only
dotnet test --filter "Category=Security"
```

### **Run with Coverage**
```bash
dotnet test --collect:"XPlat Code Coverage"
```

## 📝 Writing Tests

### **Unit Test Example**
```csharp
[Fact]
public void Login_WithValidCredentials_ShouldReturnSuccessResponse()
{
    // Arrange
    var loginRequest = new LoginRequest
    {
        Email = "test@example.com",
        Password = "ValidPassword123!"
    };

    _userManagerMock.Setup(x => x.FindByEmailAsync(loginRequest.Email))
        .ReturnsAsync(mockUser);

    // Act
    var result = Sut.LoginAsync(loginRequest).Result;

    // Assert
    result.Should().NotBeNull();
    result.Success.Should().BeTrue();
}
```

### **Integration Test Example**
```csharp
[Fact]
public async Task Login_WithValidCredentials_ShouldReturnSuccessResponse()
{
    // Arrange
    var loginRequest = new { Email = "test@example.com", Password = "ValidPassword123!" };
    var content = new StringContent(JsonSerializer.Serialize(loginRequest), Encoding.UTF8, "application/json");

    // Act
    var response = await _client.PostAsync("/api/authentication/login", content);

    // Assert
    response.Should().BeSuccessful();
}
```

## 🔒 Security Testing

### **Security Test Categories**
1. **Input Validation**: SQL injection, XSS prevention
2. **Authentication**: Password strength, rate limiting
3. **Authorization**: Role-based access control
4. **Data Protection**: Encryption, secure headers
5. **Session Management**: Token security, logout

### **Security Test Example**
```csharp
[Fact]
public async Task SecurityHeaders_ShouldBePresent()
{
    var response = await _client.GetAsync("/api/authentication/csrf-token");

    response.Headers.Should().ContainKey("X-Content-Type-Options");
    response.Headers.Should().ContainKey("X-Frame-Options");
    response.Headers.Should().ContainKey("Content-Security-Policy");
}
```

## 📊 Test Coverage Goals

### **Coverage Targets**
- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: 80%+ API endpoint coverage
- **Security Tests**: 100% security feature coverage
- **Functional Tests**: 70%+ user workflow coverage

### **Coverage Report**
```bash
dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage
```

## 🔄 TDD Workflow

### **1. Feature Development**
```bash
# 1. Write failing test
# 2. Run test (should fail - Red)
dotnet test --filter "TestName"

# 3. Write minimal implementation
# 4. Run test (should pass - Green)
dotnet test --filter "TestName"

# 5. Refactor code
# 6. Run all tests (should still pass)
dotnet test
```

### **2. Bug Fixing**
```bash
# 1. Write test that reproduces the bug
# 2. Run test (should fail)
# 3. Fix the bug
# 4. Run test (should pass)
# 5. Run all tests to ensure no regressions
```

## 🎯 Best Practices

### **Test Naming Convention**
- **Format**: `MethodName_Scenario_ExpectedResult`
- **Example**: `Login_WithValidCredentials_ShouldReturnSuccessResponse`

### **Arrange-Act-Assert Pattern**
```csharp
[Fact]
public void MethodName_Scenario_ExpectedResult()
{
    // Arrange - Set up test data and mocks
    
    // Act - Execute the method under test
    
    // Assert - Verify the results
}
```

### **Test Data Management**
- Use AutoFixture for test data generation
- Create test data builders for complex objects
- Use constants for test values

### **Mocking Guidelines**
- Mock external dependencies
- Mock time-dependent operations
- Mock database operations in unit tests
- Use real dependencies in integration tests

## 🚨 Common Anti-Patterns to Avoid

### **❌ Don't Do This**
```csharp
// Testing implementation details
[Fact]
public void ShouldSetPrivateField()
{
    // Don't test private implementation
}

// Testing multiple things in one test
[Fact]
public void ShouldDoEverything()
{
    // Don't test multiple scenarios in one test
}

// Testing framework behavior
[Fact]
public void ShouldReturnHttpOk()
{
    // Don't test framework behavior
}
```

### **✅ Do This Instead**
```csharp
// Testing behavior
[Fact]
public void Login_WithValidCredentials_ShouldAuthenticateUser()
{
    // Test the behavior, not implementation
}

// Testing one thing per test
[Fact]
public void Login_WithValidEmail_ShouldReturnSuccess()
{
    // Test one specific scenario
}

// Testing business logic
[Fact]
public void Login_WithInvalidPassword_ShouldReturnFailure()
{
    // Test business logic, not framework
}
```

## 📈 Continuous Integration

### **CI/CD Pipeline**
```yaml
# .github/workflows/tests.yml
- name: Run Tests
  run: |
    cd SecureAuth.TESTS
    dotnet test --collect:"XPlat Code Coverage"
    dotnet test --filter "Category=Security"
```

### **Quality Gates**
- All tests must pass
- Minimum 80% code coverage
- All security tests must pass
- No critical security vulnerabilities

## 🔍 Test Maintenance

### **Regular Tasks**
1. **Update tests** when requirements change
2. **Refactor tests** to improve readability
3. **Add tests** for new features
4. **Remove obsolete tests**
5. **Monitor test performance**

### **Test Review Checklist**
- [ ] Test name clearly describes the scenario
- [ ] Test follows AAA pattern
- [ ] Test is independent of other tests
- [ ] Test uses appropriate assertions
- [ ] Test covers edge cases
- [ ] Test is maintainable and readable

---

## 🎉 Benefits of TDD

1. **Better Design**: Tests drive better architecture
2. **Regression Prevention**: Catch bugs early
3. **Documentation**: Tests serve as living documentation
4. **Confidence**: Safe refactoring and changes
5. **Quality**: Higher code quality and maintainability

**Remember**: TDD is not just about testing - it's about design and development methodology that leads to better, more maintainable code! 