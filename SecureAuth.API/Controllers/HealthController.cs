using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureAuth.INFRASTRUCTURE.Data;
using System.Diagnostics;

namespace SecureAuth.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<HealthController> _logger;

        public HealthController(ApplicationDbContext context, ILogger<HealthController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetHealth()
        {
            var healthStatus = new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                uptime = Process.GetCurrentProcess().StartTime,
                version = "1.0.0",
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
            };

            return Ok(healthStatus);
        }

        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok(new { message = "pong", timestamp = DateTime.UtcNow });
        }

        [HttpGet("database")]
        public async Task<IActionResult> CheckDatabase()
        {
            try
            {
                var stopwatch = Stopwatch.StartNew();
                
                // Test database connectivity
                var canConnect = await _context.Database.CanConnectAsync();
                stopwatch.Stop();

                if (canConnect)
                {
                    return Ok(new
                    {
                        status = "healthy",
                        database = "connected",
                        responseTime = $"{stopwatch.ElapsedMilliseconds}ms",
                        timestamp = DateTime.UtcNow
                    });
                }
                else
                {
                    return StatusCode(503, new
                    {
                        status = "unhealthy",
                        database = "disconnected",
                        message = "Database connection failed",
                        timestamp = DateTime.UtcNow
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database health check failed");
                return StatusCode(503, new
                {
                    status = "unhealthy",
                    database = "error",
                    message = "Database connection error",
                    error = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }

        [HttpGet("detailed")]
        public async Task<IActionResult> GetDetailedHealth()
        {
            var healthChecks = new List<object>();

            // Database check
            try
            {
                var dbStopwatch = Stopwatch.StartNew();
                var canConnect = await _context.Database.CanConnectAsync();
                dbStopwatch.Stop();

                healthChecks.Add(new
                {
                    service = "database",
                    status = canConnect ? "healthy" : "unhealthy",
                    responseTime = $"{dbStopwatch.ElapsedMilliseconds}ms"
                });
            }
            catch (Exception ex)
            {
                healthChecks.Add(new
                {
                    service = "database",
                    status = "error",
                    error = ex.Message
                });
            }

            // Memory check
            var memoryInfo = GC.GetGCMemoryInfo();
            healthChecks.Add(new
            {
                service = "memory",
                status = "healthy",
                heapSize = $"{memoryInfo.HeapSizeBytes / 1024 / 1024}MB",
                totalMemory = $"{GC.GetTotalMemory(false) / 1024 / 1024}MB"
            });

            // Process info
            var process = Process.GetCurrentProcess();
            healthChecks.Add(new
            {
                service = "process",
                status = "healthy",
                cpuTime = process.TotalProcessorTime.TotalSeconds,
                workingSet = $"{process.WorkingSet64 / 1024 / 1024}MB",
                threads = process.Threads.Count
            });

            var overallStatus = healthChecks.All(h => h.GetType().GetProperty("status")?.GetValue(h)?.ToString() == "healthy") 
                ? "healthy" 
                : "degraded";

            return Ok(new
            {
                status = overallStatus,
                checks = healthChecks,
                timestamp = DateTime.UtcNow
            });
        }
    }
} 