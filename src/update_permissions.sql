-- Update existing permissions with categories and descriptions
UPDATE Permissions SET Category = 'General', Description = 'View basic information' WHERE Name = 'View';
UPDATE Permissions SET Category = 'General', Description = 'Submit requests' WHERE Name = 'Request';
UPDATE Permissions SET Category = 'Management', Description = 'Edit information' WHERE Name = 'Edit';
UPDATE Permissions SET Category = 'Administration', Description = 'Approve requests and changes' WHERE Name = 'Approve';
UPDATE Permissions SET Category = 'Financial', Description = 'Process payments' WHERE Name = 'Pay';
UPDATE Permissions SET Category = 'Academic', Description = 'Enroll students' WHERE Name = 'Enroll'; 