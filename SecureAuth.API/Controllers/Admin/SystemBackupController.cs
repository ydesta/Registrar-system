using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.API.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/system-backups")]
    [Authorize(Roles = "Super Admin,Admin")]
    public class SystemBackupController : ControllerBase
    {
        private readonly ISystemBackupService _systemBackupService;
        private readonly ILogger<SystemBackupController> _logger;

        public SystemBackupController(
            ISystemBackupService systemBackupService,
            ILogger<SystemBackupController> logger)
        {
            _systemBackupService = systemBackupService;
            _logger = logger;
        }

        /// <summary>
        /// Get all system backups
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetAllBackups()
        {
            try
            {
                var backups = await _systemBackupService.GetAllBackupsAsync();
                return Ok(new ApiResponse<List<object>>
                {
                    IsSuccess = true,
                    Message = "System backups retrieved successfully",
                    StatusCode = 200,
                    Response = backups
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving system backups");
                return StatusCode(500, new ApiResponse<List<object>>
                {
                    IsSuccess = false,
                    Message = "Error retrieving system backups",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Get a specific backup by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> GetBackup(string id)
        {
            try
            {
                var backup = await _systemBackupService.GetBackupByIdAsync(id);

                if (backup == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        IsSuccess = false,
                        Message = $"Backup with ID {id} not found",
                        StatusCode = 404
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    IsSuccess = true,
                    Message = "Backup retrieved successfully",
                    StatusCode = 200,
                    Response = backup
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving backup {Id}", id);
                return StatusCode(500, new ApiResponse<object>
                {
                    IsSuccess = false,
                    Message = "Error retrieving backup",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Create a new backup
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<bool>>> CreateBackup([FromBody] CreateBackupRequest request)
        {
            try
            {
                var result = await _systemBackupService.CreateBackupAsync(
                    request.Description, 
                    request.BackupType);

                if (!result)
                {
                    return BadRequest(new ApiResponse<bool>
                    {
                        IsSuccess = false,
                        Message = "Failed to create backup",
                        StatusCode = 400
                    });
                }

                return Ok(new ApiResponse<bool>
                {
                    IsSuccess = true,
                    Message = "Backup created successfully",
                    StatusCode = 200,
                    Response = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating backup");
                return StatusCode(500, new ApiResponse<bool>
                {
                    IsSuccess = false,
                    Message = "Error creating backup",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Restore a backup
        /// </summary>
        [HttpPost("{id}/restore")]
        public async Task<ActionResult<ApiResponse<bool>>> RestoreBackup(string id)
        {
            try
            {
                var result = await _systemBackupService.RestoreBackupAsync(id);

                if (!result)
                {
                    return BadRequest(new ApiResponse<bool>
                    {
                        IsSuccess = false,
                        Message = "Failed to restore backup",
                        StatusCode = 400
                    });
                }

                return Ok(new ApiResponse<bool>
                {
                    IsSuccess = true,
                    Message = "Backup restored successfully",
                    StatusCode = 200,
                    Response = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error restoring backup {Id}", id);
                return StatusCode(500, new ApiResponse<bool>
                {
                    IsSuccess = false,
                    Message = "Error restoring backup",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Delete a backup
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteBackup(string id)
        {
            try
            {
                var result = await _systemBackupService.DeleteBackupAsync(id);

                if (!result)
                {
                    return NotFound(new ApiResponse<bool>
                    {
                        IsSuccess = false,
                        Message = $"Backup with ID {id} not found",
                        StatusCode = 404
                    });
                }

                return Ok(new ApiResponse<bool>
                {
                    IsSuccess = true,
                    Message = "Backup deleted successfully",
                    StatusCode = 200,
                    Response = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting backup {Id}", id);
                return StatusCode(500, new ApiResponse<bool>
                {
                    IsSuccess = false,
                    Message = "Error deleting backup",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Get backup statistics
        /// </summary>
        [HttpGet("statistics")]
        public async Task<ActionResult<ApiResponse<object>>> GetStatistics()
        {
            try
            {
                var statistics = await _systemBackupService.GetBackupStatisticsAsync();
                return Ok(new ApiResponse<object>
                {
                    IsSuccess = true,
                    Message = "Backup statistics retrieved successfully",
                    StatusCode = 200,
                    Response = statistics
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving backup statistics");
                return StatusCode(500, new ApiResponse<object>
                {
                    IsSuccess = false,
                    Message = "Error retrieving backup statistics",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Schedule automatic backups
        /// </summary>
        [HttpPost("schedule-automatic")]
        public async Task<ActionResult<ApiResponse<bool>>> ScheduleAutomatic([FromBody] ScheduleAutomaticRequest request)
        {
            try
            {
                var result = await _systemBackupService.ScheduleAutomaticBackupAsync(request.IntervalHours);

                if (!result)
                {
                    return BadRequest(new ApiResponse<bool>
                    {
                        IsSuccess = false,
                        Message = "Failed to schedule automatic backup",
                        StatusCode = 400
                    });
                }

                return Ok(new ApiResponse<bool>
                {
                    IsSuccess = true,
                    Message = "Automatic backup scheduled successfully",
                    StatusCode = 200,
                    Response = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scheduling automatic backup");
                return StatusCode(500, new ApiResponse<bool>
                {
                    IsSuccess = false,
                    Message = "Error scheduling automatic backup",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Cancel scheduled automatic backups
        /// </summary>
        [HttpPost("cancel-scheduled")]
        public async Task<ActionResult<ApiResponse<bool>>> CancelScheduled()
        {
            try
            {
                var result = await _systemBackupService.CancelScheduledBackupAsync();

                return Ok(new ApiResponse<bool>
                {
                    IsSuccess = true,
                    Message = "Scheduled automatic backup cancelled successfully",
                    StatusCode = 200,
                    Response = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling scheduled backup");
                return StatusCode(500, new ApiResponse<bool>
                {
                    IsSuccess = false,
                    Message = "Error cancelling scheduled backup",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Validate backup integrity
        /// </summary>
        [HttpPost("{id}/validate")]
        public async Task<ActionResult<ApiResponse<bool>>> ValidateBackup(string id)
        {
            try
            {
                var result = await _systemBackupService.ValidateBackupIntegrityAsync(id);

                if (!result)
                {
                    return BadRequest(new ApiResponse<bool>
                    {
                        IsSuccess = false,
                        Message = "Backup integrity validation failed",
                        StatusCode = 400
                    });
                }

                return Ok(new ApiResponse<bool>
                {
                    IsSuccess = true,
                    Message = "Backup integrity validation passed",
                    StatusCode = 200,
                    Response = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating backup {Id}", id);
                return StatusCode(500, new ApiResponse<bool>
                {
                    IsSuccess = false,
                    Message = "Error validating backup",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Export backup to file
        /// </summary>
        [HttpPost("{id}/export")]
        public async Task<ActionResult<ApiResponse<bool>>> ExportBackup(string id, [FromBody] ExportBackupRequest request)
        {
            try
            {
                var result = await _systemBackupService.ExportBackupAsync(id, request.FilePath);

                if (!result)
                {
                    return BadRequest(new ApiResponse<bool>
                    {
                        IsSuccess = false,
                        Message = "Failed to export backup",
                        StatusCode = 400
                    });
                }

                return Ok(new ApiResponse<bool>
                {
                    IsSuccess = true,
                    Message = "Backup exported successfully",
                    StatusCode = 200,
                    Response = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting backup {Id}", id);
                return StatusCode(500, new ApiResponse<bool>
                {
                    IsSuccess = false,
                    Message = "Error exporting backup",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Import backup from file
        /// </summary>
        [HttpPost("import")]
        public async Task<ActionResult<ApiResponse<bool>>> ImportBackup([FromBody] ImportBackupRequest request)
        {
            try
            {
                var result = await _systemBackupService.ImportBackupAsync(request.FilePath);

                if (!result)
                {
                    return BadRequest(new ApiResponse<bool>
                    {
                        IsSuccess = false,
                        Message = "Failed to import backup",
                        StatusCode = 400
                    });
                }

                return Ok(new ApiResponse<bool>
                {
                    IsSuccess = true,
                    Message = "Backup imported successfully",
                    StatusCode = 200,
                    Response = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing backup");
                return StatusCode(500, new ApiResponse<bool>
                {
                    IsSuccess = false,
                    Message = "Error importing backup",
                    StatusCode = 500
                });
            }
        }
    }

    public class CreateBackupRequest
    {
        public string? Description { get; set; }
        public string BackupType { get; set; } = "Manual";
    }

    public class ScheduleAutomaticRequest
    {
        public int IntervalHours { get; set; } = 24;
    }

    public class ExportBackupRequest
    {
        public required string FilePath { get; set; }
    }

    public class ImportBackupRequest
    {
        public required string FilePath { get; set; }
    }
} 