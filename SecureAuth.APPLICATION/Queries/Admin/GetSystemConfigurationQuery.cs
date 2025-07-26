using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetSystemConfigurationQuery : IQuery<SystemConfigurationModel>
    {
        public string ConfigurationSection { get; set; } = "All"; // "All", "Security", "Email", "Database", "Logging"
    }
} 
