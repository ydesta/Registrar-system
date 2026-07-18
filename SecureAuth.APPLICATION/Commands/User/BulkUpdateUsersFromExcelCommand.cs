namespace SecureAuth.APPLICATION.Commands.User;

public class BulkUpdateUsersFromExcelCommand : ICommand<BulkUpdateUsersFromExcelResult>
{
    public Stream ExcelStream { get; set; } = null!;
}

public class BulkUpdateUsersFromExcelResult
{
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public List<BulkUpdateError> Errors { get; set; } = new();
}

public class BulkUpdateError
{
    public int RowNumber { get; set; }
    public string? OldUser { get; set; }
    public string Message { get; set; } = string.Empty;
}
