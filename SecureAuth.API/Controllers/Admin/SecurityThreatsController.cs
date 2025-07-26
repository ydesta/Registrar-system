using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SecureAuth.APPLICATION.Mediator;
using SecureAuth.APPLICATION.Queries.Security;
using SecureAuth.APPLICATION.Commands.Security;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.API.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize(Roles = "Super Admin")]
    public class SecurityThreatsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public SecurityThreatsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<SecurityThreatModel>>> GetSecurityThreats(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string? threatType = null,
            [FromQuery] string? severity = null,
            [FromQuery] bool activeOnly = true,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var query = new GetSecurityThreatsQuery
                {
                    StartDate = startDate,
                    EndDate = endDate,
                    ThreatType = threatType,
                    ThreatLevel = severity,
                    IncludeResolved = !activeOnly,
                    Page = page,
                    PageSize = pageSize
                };

                var result = await _mediator.QueryAsync<GetSecurityThreatsQuery, List<SecurityThreatModel>>(query);
                
                if (result != null && result.Any())
                {
                    return Ok(result);
                }
                
                return Ok(new List<SecurityThreatModel>());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving security threats", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SecurityThreatModel>> GetSecurityThreat(string id)
        {
            try
            {
                var query = new GetSecurityThreatsQuery
                {
                    IncludeResolved = true,
                    Page = 1,
                    PageSize = 1000
                };

                var threats = await _mediator.QueryAsync<GetSecurityThreatsQuery, List<SecurityThreatModel>>(query);
                var threat = threats?.FirstOrDefault(t => t.Id == id);
                
                if (threat != null)
                {
                    return Ok(threat);
                }
                
                return NotFound(new { message = "Security threat not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the security threat", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<SecurityThreatModel>> CreateSecurityThreat([FromBody] CreateSecurityThreatRequest request)
        {
            try
            {
                var command = new CreateSecurityThreatCommand
                {
                    ThreatType = request.ThreatType,
                    Severity = request.Severity,
                    Description = request.Description,
                    SourceIp = request.SourceIp,
                    UserAgent = request.UserAgent,
                    UserId = request.UserId
                };

                var result = await _mediator.SendAsync<CreateSecurityThreatCommand, SecurityThreatModel>(command);
                
                if (result != null && !string.IsNullOrEmpty(result.Id))
                {
                    return CreatedAtAction(nameof(GetSecurityThreat), new { id = result.Id }, result);
                }
                
                return BadRequest(new { message = "Failed to create security threat" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the security threat", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<SecurityThreatModel>> UpdateSecurityThreat(string id, [FromBody] UpdateSecurityThreatRequest request)
        {
            try
            {
                var command = new UpdateSecurityThreatCommand
                {
                    ThreatId = id,
                    Status = request.Status,
                    ResolutionNotes = request.ResolutionNotes,
                    ResolvedBy = request.ResolvedBy
                };

                var result = await _mediator.SendAsync<UpdateSecurityThreatCommand, SecurityThreatModel>(command);
                
                if (result != null && !string.IsNullOrEmpty(result.Id))
                {
                    return Ok(result);
                }
                
                return NotFound(new { message = "Security threat not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the security threat", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteSecurityThreat(string id)
        {
            try
            {
                var command = new DeleteSecurityThreatCommand
                {
                    ThreatId = id
                };

                var result = await _mediator.SendAsync<DeleteSecurityThreatCommand, bool>(command);
                
                if (result)
                {
                    return NoContent();
                }
                
                return NotFound(new { message = "Security threat not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the security threat", error = ex.Message });
            }
        }

        [HttpPost("{id}/resolve")]
        public async Task<ActionResult<SecurityThreatModel>> ResolveSecurityThreat(string id, [FromBody] ResolveSecurityThreatRequest request)
        {
            try
            {
                var command = new UpdateSecurityThreatCommand
                {
                    ThreatId = id,
                    Status = "Resolved",
                    ResolutionNotes = request.ResolutionNotes,
                    ResolvedBy = request.ResolvedBy
                };

                var result = await _mediator.SendAsync<UpdateSecurityThreatCommand, SecurityThreatModel>(command);
                
                if (result != null && !string.IsNullOrEmpty(result.Id))
                {
                    return Ok(result);
                }
                
                return NotFound(new { message = "Security threat not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while resolving the security threat", error = ex.Message });
            }
        }

        [HttpGet("active")]
        public async Task<ActionResult<List<SecurityThreatModel>>> GetActiveThreats()
        {
            try
            {
                var query = new GetSecurityThreatsQuery
                {
                    IncludeResolved = false,
                    Page = 1,
                    PageSize = 100
                };

                var result = await _mediator.QueryAsync<GetSecurityThreatsQuery, List<SecurityThreatModel>>(query);
                
                if (result != null && result.Any())
                {
                    return Ok(result);
                }
                
                return Ok(new List<SecurityThreatModel>());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving active security threats", error = ex.Message });
            }
        }

        [HttpGet("summary")]
        public async Task<ActionResult<SecurityThreatsSummaryModel>> GetThreatsSummary()
        {
            try
            {
                // Get all threats for summary
                var allThreatsQuery = new GetSecurityThreatsQuery
                {
                    IncludeResolved = true,
                    Page = 1,
                    PageSize = 1000 // Get all for summary
                };

                var allThreats = await _mediator.QueryAsync<GetSecurityThreatsQuery, List<SecurityThreatModel>>(allThreatsQuery);
                
                if (allThreats == null)
                {
                    allThreats = new List<SecurityThreatModel>();
                }

                var summary = new SecurityThreatsSummaryModel
                {
                    TotalThreats = allThreats.Count,
                    ActiveThreats = allThreats.Count(t => t.Status == "Active"),
                    ResolvedThreats = allThreats.Count(t => t.Status == "Resolved"),
                    HighSeverityThreats = allThreats.Count(t => t.ThreatLevel == "High"),
                    MediumSeverityThreats = allThreats.Count(t => t.ThreatLevel == "Medium"),
                    LowSeverityThreats = allThreats.Count(t => t.ThreatLevel == "Low"),
                    ThreatsByType = allThreats.GroupBy(t => t.ThreatType)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    RecentThreats = allThreats.Where(t => t.DetectedAt >= DateTime.UtcNow.AddDays(-7)).Count(),
                    GeneratedAt = DateTime.UtcNow
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating threats summary", error = ex.Message });
            }
        }

        [HttpGet("types")]
        public async Task<ActionResult<List<string>>> GetThreatTypes()
        {
            try
            {
                var query = new GetSecurityThreatsQuery
                {
                    IncludeResolved = true,
                    Page = 1,
                    PageSize = 1000
                };

                var threats = await _mediator.QueryAsync<GetSecurityThreatsQuery, List<SecurityThreatModel>>(query);
                
                if (threats != null)
                {
                    var threatTypes = threats.Select(t => t.ThreatType).Distinct().OrderBy(t => t).ToList();
                    return Ok(threatTypes);
                }
                
                return Ok(new List<string>());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving threat types", error = ex.Message });
            }
        }

        [HttpGet("severity-levels")]
        public async Task<ActionResult<List<string>>> GetSeverityLevels()
        {
            try
            {
                var query = new GetSecurityThreatsQuery
                {
                    IncludeResolved = true,
                    Page = 1,
                    PageSize = 1000
                };

                var threats = await _mediator.QueryAsync<GetSecurityThreatsQuery, List<SecurityThreatModel>>(query);
                
                if (threats != null)
                {
                    var severityLevels = threats.Select(t => t.ThreatLevel).Distinct().OrderBy(s => s).ToList();
                    return Ok(severityLevels);
                }
                
                return Ok(new List<string>());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving severity levels", error = ex.Message });
            }
        }

        [HttpGet("trends")]
        public async Task<ActionResult<SecurityThreatsTrendModel>> GetThreatsTrends([FromQuery] int days = 30)
        {
            try
            {
                var query = new GetSecurityThreatsQuery
                {
                    StartDate = DateTime.UtcNow.AddDays(-days),
                    EndDate = DateTime.UtcNow,
                    IncludeResolved = true,
                    Page = 1,
                    PageSize = 1000
                };

                var threats = await _mediator.QueryAsync<GetSecurityThreatsQuery, List<SecurityThreatModel>>(query);
                
                if (threats == null)
                {
                    threats = new List<SecurityThreatModel>();
                }

                var trends = new SecurityThreatsTrendModel
                {
                    PeriodDays = days,
                    TotalThreatsInPeriod = threats.Count,
                    AverageThreatsPerDay = threats.Count / (double)days,
                    ThreatsByDay = threats.GroupBy(t => t.DetectedAt.Date)
                        .OrderBy(g => g.Key)
                        .ToDictionary(g => g.Key.ToString("yyyy-MM-dd"), g => g.Count()),
                    ThreatsBySeverity = threats.GroupBy(t => t.ThreatLevel)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    ThreatsByType = threats.GroupBy(t => t.ThreatType)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    GeneratedAt = DateTime.UtcNow
                };

                return Ok(trends);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating threats trends", error = ex.Message });
            }
        }
    }

    public class CreateSecurityThreatRequest
    {
        public string ThreatType { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? SourceIp { get; set; }
        public string? UserAgent { get; set; }
        public string? UserId { get; set; }
    }

    public class UpdateSecurityThreatRequest
    {
        public string Status { get; set; } = string.Empty;
        public string? ResolutionNotes { get; set; }
        public string? ResolvedBy { get; set; }
    }

    public class ResolveSecurityThreatRequest
    {
        public string? ResolutionNotes { get; set; }
        public string? ResolvedBy { get; set; }
    }

    public class SecurityThreatsSummaryModel
    {
        public int TotalThreats { get; set; }
        public int ActiveThreats { get; set; }
        public int ResolvedThreats { get; set; }
        public int HighSeverityThreats { get; set; }
        public int MediumSeverityThreats { get; set; }
        public int LowSeverityThreats { get; set; }
        public Dictionary<string, int> ThreatsByType { get; set; } = new Dictionary<string, int>();
        public int RecentThreats { get; set; }
        public DateTime GeneratedAt { get; set; }
    }

    public class SecurityThreatsTrendModel
    {
        public int PeriodDays { get; set; }
        public int TotalThreatsInPeriod { get; set; }
        public double AverageThreatsPerDay { get; set; }
        public Dictionary<string, int> ThreatsByDay { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> ThreatsBySeverity { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> ThreatsByType { get; set; } = new Dictionary<string, int>();
        public DateTime GeneratedAt { get; set; }
    }
} 