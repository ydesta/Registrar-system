using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.API.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/security-settings")]
    [Authorize(Roles = "Super Admin,Admin")]
    public class SecuritySettingsController : ControllerBase
    {
        private readonly ISecuritySettingsService _securitySettingsService;
        private readonly ILogger<SecuritySettingsController> _logger;

        public SecuritySettingsController(
            ISecuritySettingsService securitySettingsService,
            ILogger<SecuritySettingsController> logger)
        {
            _securitySettingsService = securitySettingsService;
            _logger = logger;
        }

        /// <summary>
        /// Get all security settings
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<Dictionary<string, string>>>> GetAllSettings()
        {
            try
            {
                var settings = await _securitySettingsService.GetAllSecuritySettingsAsync();
                return Ok(new ApiResponse<Dictionary<string, string>>
                {
                    IsSuccess = true,
                    Message = "Security settings retrieved successfully",
                    StatusCode = 200,
                    Response = settings
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving security settings");
                return StatusCode(500, new ApiResponse<Dictionary<string, string>>
                {
                    IsSuccess = false,
                    Message = "Error retrieving security settings",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Get a specific security setting by key
        /// </summary>
        [HttpGet("{key}")]
        public async Task<ActionResult<ApiResponse<string>>> GetSetting(string key)
        {
            try
            {
                var value = await _securitySettingsService.GetSecuritySettingAsync(key);
                if (value == null)
                {
                    return NotFound(new ApiResponse<string>
                    {
                        IsSuccess = false,
                        Message = $"Security setting '{key}' not found",
                        StatusCode = 404
                    });
                }

                return Ok(new ApiResponse<string>
                {
                    IsSuccess = true,
                    Message = "Security setting retrieved successfully",
                    StatusCode = 200,
                    Response = value
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving security setting {Key}", key);
                return StatusCode(500, new ApiResponse<string>
                {
                    IsSuccess = false,
                    Message = "Error retrieving security setting",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Create a new security setting
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<bool>>> CreateSetting([FromBody] CreateSecuritySettingRequest request)
        {
            try
            {
                var result = await _securitySettingsService.SetSecuritySettingAsync(
                    request.Key, 
                    request.Value, 
                    request.Description);

                if (!result)
                {
                    return BadRequest(new ApiResponse<bool>
                    {
                        IsSuccess = false,
                        Message = "Failed to create security setting. Setting may already exist.",
                        StatusCode = 400
                    });
                }

                return Ok(new ApiResponse<bool>
                {
                    IsSuccess = true,
                    Message = "Security setting created successfully",
                    StatusCode = 200,
                    Response = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating security setting");
                return StatusCode(500, new ApiResponse<bool>
                {
                    IsSuccess = false,
                    Message = "Error creating security setting",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Update an existing security setting
        /// </summary>
        [HttpPut("{key}")]
        public async Task<ActionResult<ApiResponse<bool>>> UpdateSetting(string key, [FromBody] UpdateSecuritySettingRequest request)
        {
            try
            {
                var result = await _securitySettingsService.UpdateSecuritySettingAsync(
                    key, 
                    request.Value, 
                    request.Description);

                if (!result)
                {
                    return NotFound(new ApiResponse<bool>
                    {
                        IsSuccess = false,
                        Message = $"Security setting '{key}' not found",
                        StatusCode = 404
                    });
                }

                return Ok(new ApiResponse<bool>
                {
                    IsSuccess = true,
                    Message = "Security setting updated successfully",
                    StatusCode = 200,
                    Response = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating security setting {Key}", key);
                return StatusCode(500, new ApiResponse<bool>
                {
                    IsSuccess = false,
                    Message = "Error updating security setting",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Delete a security setting
        /// </summary>
        [HttpDelete("{key}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteSetting(string key)
        {
            try
            {
                var result = await _securitySettingsService.DeleteSecuritySettingAsync(key);

                if (!result)
                {
                    return NotFound(new ApiResponse<bool>
                    {
                        IsSuccess = false,
                        Message = $"Security setting '{key}' not found",
                        StatusCode = 404
                    });
                }

                return Ok(new ApiResponse<bool>
                {
                    IsSuccess = true,
                    Message = "Security setting deleted successfully",
                    StatusCode = 200,
                    Response = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting security setting {Key}", key);
                return StatusCode(500, new ApiResponse<bool>
                {
                    IsSuccess = false,
                    Message = "Error deleting security setting",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Initialize default security settings
        /// </summary>
        [HttpPost("initialize-defaults")]
        public async Task<ActionResult<ApiResponse<bool>>> InitializeDefaults()
        {
            try
            {
                var result = await _securitySettingsService.InitializeDefaultSecuritySettingsAsync();

                if (!result)
                {
                    return BadRequest(new ApiResponse<bool>
                    {
                        IsSuccess = false,
                        Message = "Failed to initialize default security settings",
                        StatusCode = 400
                    });
                }

                return Ok(new ApiResponse<bool>
                {
                    IsSuccess = true,
                    Message = "Default security settings initialized successfully",
                    StatusCode = 200,
                    Response = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initializing default security settings");
                return StatusCode(500, new ApiResponse<bool>
                {
                    IsSuccess = false,
                    Message = "Error initializing default security settings",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Get security settings summary
        /// </summary>
        [HttpGet("summary")]
        public async Task<ActionResult<ApiResponse<object>>> GetSummary()
        {
            try
            {
                var summary = await _securitySettingsService.GetSecuritySettingsSummaryAsync();
                return Ok(new ApiResponse<object>
                {
                    IsSuccess = true,
                    Message = "Security settings summary retrieved successfully",
                    StatusCode = 200,
                    Response = summary
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving security settings summary");
                return StatusCode(500, new ApiResponse<object>
                {
                    IsSuccess = false,
                    Message = "Error retrieving security settings summary",
                    StatusCode = 500
                });
            }
        }
    }

    public class CreateSecuritySettingRequest
    {
        public required string Key { get; set; }
        public required string Value { get; set; }
        public string? Description { get; set; }
    }

    public class UpdateSecuritySettingRequest
    {
        public required string Value { get; set; }
        public string? Description { get; set; }
    }
} 