namespace SecureAuth.APPLICATION.DTOs
{
    public class Response
    {
        public bool Success { get; set; }
        public string Message { get; set; }
    }

    public class Result
    {
        public bool IsSuccess { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;

        public static Result Success() => new Result { IsSuccess = true };
        public static Result Failure(string errorMessage) => new Result { IsSuccess = false, ErrorMessage = errorMessage };
    }
} 
