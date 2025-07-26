using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecureAuth.APPLICATION.Mediator;
using SecureAuth.APPLICATION.Commands.Admin;
using SecureAuth.APPLICATION.Queries.Admin;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.API.Controllers.Admin
{
    [Authorize(Roles = "Admin,Super Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class SystemController : ControllerBase
    {
        private readonly IMediator _mediator;

        public SystemController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("activity-logs")]
        public async Task<ActionResult<PaginatedResponseModel<ActivityLogResponseModel>>> GetActivityLogs([FromQuery] ActivityLogFilterModel filter)
        {
            try
            {
                if (filter == null)
                {
                    filter = new ActivityLogFilterModel();
                }

                var query = new GetActivityLogsQuery
                {
                    Page = filter.Page ?? 1,
                    PageSize = filter.PageSize ?? 10,
                    StartDate = filter.StartDate,
                    EndDate = filter.EndDate,
                    UserId = filter.UserId,
                    UserEmail = filter.UserEmail,
                    ActionType = filter.Action,
                    EntityType = filter.EntityType
                };

                var result = await _mediator.QueryAsync<GetActivityLogsQuery, ActivityLogPagedResult>(query);
                
                return Ok(new PaginatedResponseModel<ActivityLogResponseModel>
                {
                    TotalCount = result.TotalCount,
                    Page = result.Page,
                    PageSize = result.PageSize,
                    TotalPages = result.TotalPages,
                    Items = result.Items.Select(log => new ActivityLogResponseModel
                    {
                        Id = log.Id,
                        UserId = log.UserId,
                        FullName = log.FullName,
                        UserEmail = log.UserEmail,
                        Action = log.Action,
                        EntityType = log.EntityType,
                        EntityId = log.EntityId,
                        Details = log.Details,
                        IpAddress = log.IpAddress ?? string.Empty,
                        UserAgent = log.UserAgent ?? string.Empty,
                        Timestamp = log.Timestamp,
                        Status = log.Status,
                        ErrorMessage = log.ErrorMessage
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<PaginatedResponseModel<ActivityLogResponseModel>>
                {
                    IsSuccess = false,
                    Message = "An error occurred while retrieving activity logs",
                    Response = null,
                    StatusCode = 500
                });
            }
        }

        [HttpGet("activity-logs/{id}")]
        public async Task<IActionResult> GetActivityLog(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest(new ApiResponse<ActivityLogResponseModel>
                    {
                        IsSuccess = false,
                        Message = "Activity log ID is required",
                        Response = null,
                        StatusCode = 400
                    });
                }

                var query = new GetActivityLogByIdQuery { Id = id };
                var result = await _mediator.QueryAsync<GetActivityLogByIdQuery, ActivityLogModel>(query);
                
                if (result == null)
                {
                    return NotFound(new ApiResponse<ActivityLogResponseModel>
                    {
                        IsSuccess = false,
                        Message = "Activity log not found",
                        Response = null,
                        StatusCode = 404
                    });
                }

                var response = new ActivityLogResponseModel
                {
                    Id = result.Id,
                    UserId = result.UserId,
                    FullName = result.FullName,
                    UserEmail = result.UserEmail,
                    Action = result.Action,
                    EntityType = result.EntityType,
                    EntityId = result.EntityId,
                    Details = result.Details,
                    IpAddress = result.IpAddress ?? string.Empty,
                    UserAgent = result.UserAgent ?? string.Empty,
                    Timestamp = result.Timestamp,
                    Status = result.Status,
                    ErrorMessage = result.ErrorMessage
                };

                return Ok(new ApiResponse<ActivityLogResponseModel>
                {
                    IsSuccess = true,
                    Message = "Activity log retrieved successfully",
                    Response = response,
                    StatusCode = 200
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<ActivityLogResponseModel>
                {
                    IsSuccess = false,
                    Message = "An error occurred while retrieving activity log",
                    Response = null,
                    StatusCode = 500
                });
            }
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetSystemStatus()
        {
            try
            {
                var query = new GetSystemHealthQuery();
                var result = await _mediator.QueryAsync<GetSystemHealthQuery, SystemHealthModel>(query);
                
                if (result != null)
                {
                    return Ok(new ApiResponse<SystemHealthModel>
                    {
                        IsSuccess = true,
                        Message = "System status retrieved successfully",
                        Response = result,
                        StatusCode = 200
                    });
                }
                
                return NotFound(new ApiResponse<SystemHealthModel>
                {
                    IsSuccess = false,
                    Message = "System status not available",
                    Response = null,
                    StatusCode = 404
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<SystemHealthModel>
                {
                    IsSuccess = false,
                    Message = "An error occurred while retrieving system status",
                    Response = null,
                    StatusCode = 500
                });
            }
        }

        [HttpPost("backup")]
        public async Task<IActionResult> BackupDatabase()
        {
            try
            {
                var command = new BackupSystemDataCommand();
                var result = await _mediator.SendAsync<BackupSystemDataCommand, BackupResultModel>(command);
                
                if (result.Success)
                {
                    return Ok(new ApiResponse<BackupResultModel>
                    {
                        IsSuccess = true,
                        Message = "Database backup completed successfully",
                        Response = result,
                        StatusCode = 200
                    });
                }
                
                return BadRequest(new ApiResponse<BackupResultModel>
                {
                    IsSuccess = false,
                    Message = result.Message,
                    Response = result,
                    StatusCode = 400
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<BackupResultModel>
                {
                    IsSuccess = false,
                    Message = "An error occurred during database backup",
                    Response = null,
                    StatusCode = 500
                });
            }
        }

        [HttpPost("restore")]
        public async Task<IActionResult> RestoreDatabase([FromBody] DatabaseRestoreRequest request)
        {
            try
            {
                var command = new RestoreSystemDataCommand
                {
                    BackupFilePath = request.BackupFileName,
                    RestoreType = "Full"
                };

                var result = await _mediator.SendAsync<RestoreSystemDataCommand, RestoreResultModel>(command);
                
                if (result.Success)
                {
                    return Ok(new ApiResponse<RestoreResultModel>
                    {
                        IsSuccess = true,
                        Message = "Database restore completed successfully",
                        Response = result,
                        StatusCode = 200
                    });
                }
                
                return BadRequest(new ApiResponse<RestoreResultModel>
                {
                    IsSuccess = false,
                    Message = result.Message,
                    Response = result,
                    StatusCode = 400
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<RestoreResultModel>
                {
                    IsSuccess = false,
                    Message = "An error occurred during database restore",
                    Response = null,
                    StatusCode = 500
                });
            }
        }

        [HttpGet("configuration")]
        public async Task<IActionResult> GetConfiguration()
        {
            try
            {
                var query = new GetSystemConfigurationQuery();
                var result = await _mediator.QueryAsync<GetSystemConfigurationQuery, SystemConfigurationModel>(query);
                
                if (result != null)
                {
                    return Ok(new ApiResponse<SystemConfigurationModel>
                    {
                        IsSuccess = true,
                        Message = "System configuration retrieved successfully",
                        Response = result,
                        StatusCode = 200
                    });
                }
                
                return NotFound(new ApiResponse<SystemConfigurationModel>
                {
                    IsSuccess = false,
                    Message = "System configuration not found",
                    Response = null,
                    StatusCode = 404
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<SystemConfigurationModel>
                {
                    IsSuccess = false,
                    Message = "An error occurred while retrieving system configuration",
                    Response = null,
                    StatusCode = 500
                });
            }
        }

        [HttpPut("configuration")]
        public async Task<IActionResult> UpdateConfiguration([FromBody] SystemConfigurationRequest request)
        {
            try
            {
                var command = new UpdateSystemConfigurationCommand
                {
                    Configuration = new SystemConfigurationModel
                    {
                        Success = true,
                        Message = "Configuration updated",
                        ConfigurationSection = "All"
                    }
                };

                var result = await _mediator.SendAsync<UpdateSystemConfigurationCommand, bool>(command);
                
                if (result)
                {
                    return Ok(new { success = true, message = "System configuration updated successfully" });
                }
                
                return BadRequest(new { success = false, message = "Failed to update system configuration" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while updating system configuration" });
            }
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetSystemStatistics()
        {
            try
            {
                var query = new GetSystemStatisticsQuery();
                var result = await _mediator.QueryAsync<GetSystemStatisticsQuery, SystemStatisticsModel>(query);
                
                if (result != null)
                {
                    return Ok(new ApiResponse<SystemStatisticsModel>
                    {
                        IsSuccess = true,
                        Message = "System statistics retrieved successfully",
                        Response = result,
                        StatusCode = 200
                    });
                }
                
                return NotFound(new ApiResponse<SystemStatisticsModel>
                {
                    IsSuccess = false,
                    Message = "System statistics not available",
                    Response = null,
                    StatusCode = 404
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<SystemStatisticsModel>
                {
                    IsSuccess = false,
                    Message = "An error occurred while retrieving system statistics",
                    Response = null,
                    StatusCode = 500
                });
            }
        }

        [HttpPost("generate-report")]
        public async Task<IActionResult> GenerateSystemReport()
        {
            try
            {
                var command = new GenerateSystemReportCommand();
                var result = await _mediator.SendAsync<GenerateSystemReportCommand, SystemReportModel>(command);
                
                if (result.Success)
                {
                    return Ok(new ApiResponse<SystemReportModel>
                    {
                        IsSuccess = true,
                        Message = "System report generated successfully",
                        Response = result,
                        StatusCode = 200
                    });
                }
                
                return BadRequest(new ApiResponse<SystemReportModel>
                {
                    IsSuccess = false,
                    Message = result.Message,
                    Response = result,
                    StatusCode = 400
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<SystemReportModel>
                {
                    IsSuccess = false,
                    Message = "An error occurred while generating system report",
                    Response = null,
                    StatusCode = 500
                });
            }
        }
    }
} 