using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecureAuth.APPLICATION.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SecureAuth.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/authentication/grade-action-otp")]
    public class GradeActionOtpController : ControllerBase
    {
        private readonly IGradeActionOtpService _gradeActionOtpService;

        public GradeActionOtpController(IGradeActionOtpService gradeActionOtpService)
        {
            _gradeActionOtpService = gradeActionOtpService;
        }

        [HttpPost("send")]
        public async Task<IActionResult> Send([FromBody] GradeActionOtpRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _gradeActionOtpService.SendAsync(userId, request?.Purpose ?? string.Empty);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("verify")]
        public async Task<IActionResult> Verify([FromBody] GradeActionOtpRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _gradeActionOtpService.VerifyAsync(userId, request?.Purpose ?? string.Empty, request?.Otp ?? string.Empty);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }

    public class GradeActionOtpRequest
    {
        public string Purpose { get; set; } = string.Empty;
        public string? Otp { get; set; }
    }
}
