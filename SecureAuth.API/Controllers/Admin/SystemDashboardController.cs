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
        private readonly IEmailService _emailService;

        public SystemDashboardController(
            ISystemHealthService systemHealthService,
            IMediator mediator,
            IEmailService emailService)
        {
            _systemHealthService = systemHealthService;
            _mediator = mediator;
            _emailService = emailService;
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

        [HttpGet("email-health")]
        public async Task<IActionResult> CheckEmailHealth()
        {
            try
            {
                var isHealthy = await _emailService.TestConnectionAsync();
                return Ok(new
                {
                    Success = true,
                    Message = "Email service health check completed",
                    Data = new
                    {
                        EmailService = new { Status = isHealthy ? "Healthy" : "Unhealthy", LastChecked = DateTime.UtcNow }
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Email service health check failed",
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
                var memoryMb = GC.GetGCMemoryInfo().HeapSizeBytes / (1024 * 1024);
                var threadCount = System.Threading.ThreadPool.ThreadCount;
                var uptime = 0.0;
                try
                {
                    uptime = (DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime.ToUniversalTime()).TotalHours;
                    if (!double.IsFinite(uptime) || uptime < 0) uptime = 0;
                }
                catch { /* ignore */ }
                await _systemHealthService.RecordSystemMetricsAsync("MemoryUsage", memoryMb, "MB");
                await _systemHealthService.RecordSystemMetricsAsync("ActiveThreads", threadCount, "count");
                await _systemHealthService.RecordSystemMetricsAsync("Uptime", uptime, "hours");

                return Ok(new
                {
                    Success = true,
                    Message = "System metrics recorded and retrieved successfully",
                    Data = new
                    {
                        MemoryUsage = memoryMb,
                        ActiveThreads = threadCount,
                        Uptime = uptime,
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