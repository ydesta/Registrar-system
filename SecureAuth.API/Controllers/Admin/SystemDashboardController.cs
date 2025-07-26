using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.Mediator;
using SecureAuth.APPLICATION.Queries.Admin;
using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.API.Controllers.Admin
{
    [Authorize(Roles = "Admin,Super Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class SystemDashboardController : ControllerBase
    {
        private readonly ISystemHealthService _systemHealthService;
        private readonly IMediator _mediator;

        public SystemDashboardController(
            ISystemHealthService systemHealthService,
            IMediator mediator)
        {
            _systemHealthService = systemHealthService;
            _mediator = mediator;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetSystemOverview()
        {
            try
            {
                var healthSummary = await _systemHealthService.GetSystemHealthSummaryAsync();
                
                return Ok(new
                {
                    Success = true,
                    Message = "System overview retrieved successfully",
                    Data = healthSummary,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Error retrieving system overview",
                    Error = ex.Message
                });
            }
        }

        [HttpGet("health")]
        public async Task<IActionResult> GetSystemHealth()
        {
            try
            {
                var dbHealth = await _systemHealthService.CheckDatabaseHealthAsync();
                var authServiceHealth = await _systemHealthService.CheckServiceHealthAsync("AuthenticationService");
                var userServiceHealth = await _systemHealthService.CheckServiceHealthAsync("UserManagementService");

                return Ok(new
                {
                    Success = true,
                    Message = "System health check completed",
                    Data = new
                    {
                        Database = new { Status = dbHealth ? "Healthy" : "Unhealthy", LastChecked = DateTime.UtcNow },
                        AuthenticationService = new { Status = authServiceHealth ? "Healthy" : "Unhealthy", LastChecked = DateTime.UtcNow },
                        UserManagementService = new { Status = userServiceHealth ? "Healthy" : "Unhealthy", LastChecked = DateTime.UtcNow },
                        OverallStatus = dbHealth && authServiceHealth && userServiceHealth ? "Healthy" : "Unhealthy"
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Error checking system health",
                    Error = ex.Message
                });
            }
        }

        [HttpPost("record-health")]
        public async Task<IActionResult> RecordSystemHealth()
        {
            try
            {
                await _systemHealthService.RecordDatabaseHealthAsync();
                await _systemHealthService.RecordServiceHealthAsync("AuthenticationService", "Healthy", 50);
                await _systemHealthService.RecordServiceHealthAsync("UserManagementService", "Healthy", 30);
                await _systemHealthService.RecordServiceHealthAsync("EmailService", "Healthy", 20);

                return Ok(new
                {
                    Success = true,
                    Message = "System health recorded successfully",
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Error recording system health",
                    Error = ex.Message
                });
            }
        }

        [HttpGet("metrics")]
        public async Task<IActionResult> GetSystemMetrics()
        {
            try
            {
                // Record current metrics
                await _systemHealthService.RecordSystemMetricsAsync("MemoryUsage", GC.GetGCMemoryInfo().HeapSizeBytes / (1024 * 1024), "MB");
                await _systemHealthService.RecordSystemMetricsAsync("ActiveThreads", System.Threading.ThreadPool.ThreadCount, "count");
                await _systemHealthService.RecordSystemMetricsAsync("Uptime", (DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime.ToUniversalTime()).TotalHours, "hours");

                return Ok(new
                {
                    Success = true,
                    Message = "System metrics recorded and retrieved successfully",
                    Data = new
                    {
                        MemoryUsage = GC.GetGCMemoryInfo().HeapSizeBytes / (1024 * 1024),
                        ActiveThreads = System.Threading.ThreadPool.ThreadCount,
                        Uptime = (DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime.ToUniversalTime()).TotalHours,
                        Timestamp = DateTime.UtcNow
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Error retrieving system metrics",
                    Error = ex.Message
                });
            }
        }

        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var query = new GetAuditLogsQuery
                {
                    Page = page,
                    PageSize = pageSize,
                    SortBy = "Timestamp",
                    SortDescending = true
                };

                var result = await _mediator.QueryAsync<GetAuditLogsQuery, List<AuditLogModel>>(query);

                return Ok(new
                {
                    Success = true,
                    Message = "Audit logs retrieved successfully",
                    Data = result,
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = result.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Error retrieving audit logs",
                    Error = ex.Message
                });
            }
        }
    }
} 