namespace SecureAuth.APPLICATION.DTOs.Admin
{
    public class SystemReportModel
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string ReportId { get; set; } = string.Empty;
        public string ReportType { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Format { get; set; } = string.Empty;
        public object? Data { get; set; }
    }
} 
