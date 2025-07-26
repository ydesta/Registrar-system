using AutoFixture;
using AutoFixture.AutoMoq;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;
using Xunit;

namespace SecureAuth.TESTS.Helpers
{
    public abstract class TestBase
    {
        protected readonly IFixture Fixture;
        protected readonly IServiceProvider ServiceProvider;

        protected TestBase()
        {
            Fixture = new Fixture()
                .Customize(new AutoMoqCustomization());

            var services = new ServiceCollection();
            ConfigureServices(services);
            ServiceProvider = services.BuildServiceProvider();
        }

        protected virtual void ConfigureServices(IServiceCollection services)
        {
            // Add common services for testing
            services.AddLogging(builder => builder.AddConsole());
        }

        protected T GetService<T>() where T : notnull
        {
            return ServiceProvider.GetRequiredService<T>();
        }

        protected Mock<T> GetMock<T>() where T : class
        {
            return Fixture.Freeze<Mock<T>>();
        }
    }

    public abstract class TestBase<T> : TestBase where T : class
    {
        protected T Sut { get; private set; }

        protected TestBase()
        {
            Sut = CreateSystemUnderTest();
        }

        protected abstract T CreateSystemUnderTest();
    }
} 