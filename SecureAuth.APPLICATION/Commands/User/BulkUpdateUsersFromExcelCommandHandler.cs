using Microsoft.AspNetCore.Identity;
using OfficeOpenXml;
using SecureAuth.APPLICATION.Mediator;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.User;

public class BulkUpdateUsersFromExcelCommandHandler : ICommandHandler<BulkUpdateUsersFromExcelCommand, BulkUpdateUsersFromExcelResult>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IMediator _mediator;

    public BulkUpdateUsersFromExcelCommandHandler(
        UserManager<ApplicationUser> userManager,
        IMediator mediator)
    {
        _userManager = userManager;
        _mediator = mediator;
    }

    public async Task<BulkUpdateUsersFromExcelResult> HandleAsync(BulkUpdateUsersFromExcelCommand command)
    {
        var result = new BulkUpdateUsersFromExcelResult();

        if (command.ExcelStream == null || command.ExcelStream.Length == 0)
        {
            result.Errors.Add(new BulkUpdateError { RowNumber = 0, Message = "No file or empty file uploaded." });
            return result;
        }

        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

        using var package = new ExcelPackage(command.ExcelStream);
        var sheet = package.Workbook.Worksheets[0];
        var rowCount = sheet.Dimension?.Rows ?? 0;

        if (rowCount < 2)
        {
            result.Errors.Add(new BulkUpdateError { RowNumber = 0, Message = "Excel file has no data rows." });
            return result;
        }

        int colFirstName = 0, colLastName = 0, colNewEmail = 0, colOldUser = 0;
        for (int col = 1; col <= (sheet.Dimension?.Columns ?? 0); col++)
        {
            var header = (sheet.Cells[1, col].Text ?? "").Trim();
            if (string.Equals(header, "firstName", StringComparison.OrdinalIgnoreCase)) colFirstName = col;
            if (string.Equals(header, "lastName", StringComparison.OrdinalIgnoreCase)) colLastName = col;
            if (string.Equals(header, "newemail", StringComparison.OrdinalIgnoreCase)) colNewEmail = col;
            if (string.Equals(header, "olduser", StringComparison.OrdinalIgnoreCase)) colOldUser = col;
        }

        if (colOldUser == 0)
        {
            result.Errors.Add(new BulkUpdateError { RowNumber = 0, Message = "Required column 'olduser' not found in Excel." });
            return result;
        }
        if (colNewEmail == 0)
        {
            result.Errors.Add(new BulkUpdateError { RowNumber = 0, Message = "Required column 'newemail' not found in Excel." });
            return result;
        }

        for (int row = 2; row <= rowCount; row++)
        {
            var oldUser = (sheet.Cells[row, colOldUser].Text ?? "").Trim();
            if (string.IsNullOrWhiteSpace(oldUser)) continue;

            var newEmail = colNewEmail > 0 ? (sheet.Cells[row, colNewEmail].Text ?? "").Trim() : "";
            if (string.IsNullOrWhiteSpace(newEmail))
            {
                result.FailureCount++;
                result.Errors.Add(new BulkUpdateError { RowNumber = row, OldUser = oldUser, Message = "newemail is required." });
                continue;
            }

            var user = await _userManager.FindByNameAsync(oldUser);
            if (user == null)
            {
                result.FailureCount++;
                result.Errors.Add(new BulkUpdateError { RowNumber = row, OldUser = oldUser, Message = "User not found." });
                continue;
            }

            var firstName = colFirstName > 0 ? (sheet.Cells[row, colFirstName].Text ?? "").Trim() : "";
            var lastName = colLastName > 0 ? (sheet.Cells[row, colLastName].Text ?? "").Trim() : "";

            try
            {
                var updateCommand = new UpdateUserCommand
                {
                    UserId = user.Id,
                    FirstName = string.IsNullOrWhiteSpace(firstName) ? null : firstName,
                    LastName = string.IsNullOrWhiteSpace(lastName) ? null : lastName,
                    RoleName = "ApprovedApplicant"
                };
                await _mediator.SendAsync<UpdateUserCommand, bool>(updateCommand);

                var emailResult = await _mediator.SendAsync<AdminUpdateEmailCommand, UpdateEmailResponse>(
                    new AdminUpdateEmailCommand { UserId = user.Id, NewEmail = newEmail });

                if (emailResult.Success)
                    result.SuccessCount++;
                else
                {
                    result.FailureCount++;
                    result.Errors.Add(new BulkUpdateError { RowNumber = row, OldUser = oldUser, Message = emailResult.Message ?? "Email/password update failed." });
                }
            }
            catch (Exception ex)
            {
                result.FailureCount++;
                result.Errors.Add(new BulkUpdateError { RowNumber = row, OldUser = oldUser, Message = ex.Message });
            }
        }

        return result;
    }
}
