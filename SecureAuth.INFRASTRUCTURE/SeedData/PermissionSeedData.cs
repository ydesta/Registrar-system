using System;
using SecureAuth.DOMAIN.Models.Security;

namespace SecureAuth.INFRASTRUCTURE.SeedData
{
    public static class PermissionSeedData
    {
        // Generate GUIDs once and store them as static readonly to prevent duplication
        public static readonly string ViewId = Guid.NewGuid().ToString();
        public static readonly string RequestId = Guid.NewGuid().ToString();
        public static readonly string EditId = Guid.NewGuid().ToString();
        public static readonly string ApproveId = Guid.NewGuid().ToString();
        public static readonly string PayId = Guid.NewGuid().ToString();
        public static readonly string EnrollId = Guid.NewGuid().ToString();

        public static Permission[] GetPermissions()
        {
            return new Permission[]
            {
                new Permission { Id = ViewId, Name = "View", Category = "General", Description = "View basic information" },
                new Permission { Id = RequestId, Name = "Request", Category = "General", Description = "Submit requests" },
                new Permission { Id = EditId, Name = "Edit", Category = "Management", Description = "Edit information" },
                new Permission { Id = ApproveId, Name = "Approve", Category = "Administration", Description = "Approve requests and changes" },
                new Permission { Id = PayId, Name = "Pay", Category = "Financial", Description = "Process payments" },
                new Permission { Id = EnrollId, Name = "Enroll", Category = "Academic", Description = "Enroll students" }
            };
        }
    }
}
