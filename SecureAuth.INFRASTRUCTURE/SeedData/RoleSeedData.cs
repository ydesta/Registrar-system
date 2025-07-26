using SecureAuth.DOMAIN.Models;

namespace SecureAuth.INFRASTRUCTURE.SeedData
{
    public static class RoleSeedData
    {
        // Generate GUIDs once and store them as static readonly to prevent duplication
        public static readonly string SuperAdminRoleId = Guid.NewGuid().ToString();
        public static readonly string StudentRoleId = Guid.NewGuid().ToString();
        public static readonly string InstructorRoleId = Guid.NewGuid().ToString();
        public static readonly string FinanceRoleId = Guid.NewGuid().ToString();
        public static readonly string ApplicantRoleId = Guid.NewGuid().ToString();
        public static readonly string ApprovedApplicantRoleId = Guid.NewGuid().ToString();

        public static ApplicationRole[] GetRoles()
        {
            return new ApplicationRole[]
            {
                new ApplicationRole { Id = SuperAdminRoleId, Name = "Super Admin", NormalizedName = "SUPER ADMIN" },
                new ApplicationRole { Id = StudentRoleId, Name = "Student", NormalizedName = "STUDENT" },
                new ApplicationRole { Id = InstructorRoleId, Name = "Instructor", NormalizedName = "INSTRUCTOR" },
                new ApplicationRole { Id = FinanceRoleId, Name = "Finance", NormalizedName = "FINANCE" },
                new ApplicationRole { Id = ApplicantRoleId, Name = "Applicant", NormalizedName = "APPLICANT" },
                new ApplicationRole { Id = ApprovedApplicantRoleId, Name = "ApprovedApplicant", NormalizedName = "APPROVEDAPPLICANT" }
            };
        }
    }
} 
