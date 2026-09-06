using MimeKit;
using System.Collections.Generic;
using System.Linq;

namespace SecureAuth.DOMAIN.Models
{
    public class Message
    {
        public List<MailboxAddress> To { get; set; }
        public string Subject { get; set; }
        public string Content { get; set; }
        public string HtmlContent { get; set; }

        public Message(IEnumerable<string> to, string subject, string content)
            : this(to, subject, content, content)
        {
        }

        public Message(IEnumerable<string> to, string subject, string content, string htmlContent)
        {
            To = new List<MailboxAddress>();
            foreach (var address in to.Where(x => !string.IsNullOrWhiteSpace(x)))
            {
                To.Add(MailboxAddress.Parse(address.Trim()));
            }
            Subject = subject;
            Content = content;
            HtmlContent = htmlContent;
        }
    }
}
