using System;
using System.Collections.Generic;
using SecureAuth.DOMAIN.Models.Security;
using SecureAuth.INFRASTRUCTURE.SeedData;

namespace SecureAuth.INFRASTRUCTURE.SeedData
{
    public static class RolePermissionSeedData
    {
        public static RolePermission[] GetRolePermissions()
        {
            return new RolePermission[]
            {
                // Super Admin gets all permissions
                new RolePermission { RoleId = RoleSeedData.SuperAdminRoleId, PermissionId = PermissionSeedData.ViewId },
                new RolePermission { RoleId = RoleSeedData.SuperAdminRoleId, PermissionId = PermissionSeedData.RequestId },
                new RolePermission { RoleId = RoleSeedData.SuperAdminRoleId, PermissionId = PermissionSeedData.EditId },
                new RolePermission { RoleId = RoleSeedData.SuperAdminRoleId, PermissionId = PermissionSeedData.ApproveId },
                new RolePermission { RoleId = RoleSeedData.SuperAdminRoleId, PermissionId = PermissionSeedData.PayId },
                new RolePermission { RoleId = RoleSeedData.SuperAdminRoleId, PermissionId = PermissionSeedData.EnrollId },
                // Student
                new RolePermission { RoleId = RoleSeedData.StudentRoleId, PermissionId = PermissionSeedData.ViewId }, // View
                new RolePermission { RoleId = RoleSeedData.StudentRoleId, PermissionId = PermissionSeedData.RequestId }, // Request
                new RolePermission { RoleId = RoleSeedData.StudentRoleId, PermissionId = PermissionSeedData.EnrollId }, // Enroll
                // Instructor
                new RolePermission { RoleId = RoleSeedData.InstructorRoleId, PermissionId = PermissionSeedData.ViewId }, // View
                new RolePermission { RoleId = RoleSeedData.InstructorRoleId, PermissionId = PermissionSeedData.EditId }, // Edit
                new RolePermission { RoleId = RoleSeedData.InstructorRoleId, PermissionId = PermissionSeedData.EnrollId }, // Enroll
                // Finance
                new RolePermission { RoleId = RoleSeedData.FinanceRoleId, PermissionId = PermissionSeedData.ViewId }, // View
                new RolePermission { RoleId = RoleSeedData.FinanceRoleId, PermissionId = PermissionSeedData.PayId }, // Pay
                // Applicant
                new RolePermission { RoleId = RoleSeedData.ApplicantRoleId, PermissionId = PermissionSeedData.ViewId }, // View
                new RolePermission { RoleId = RoleSeedData.ApplicantRoleId, PermissionId = PermissionSeedData.RequestId }, // Request
                // ApprovedApplicant
                new RolePermission { RoleId = RoleSeedData.ApprovedApplicantRoleId, PermissionId = PermissionSeedData.ViewId }, // View
                new RolePermission { RoleId = RoleSeedData.ApprovedApplicantRoleId, PermissionId = PermissionSeedData.ApproveId }  // Approve
            };
        }
    }
} 
