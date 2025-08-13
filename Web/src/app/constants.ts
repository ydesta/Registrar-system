export class Constants {
  // Development environment (commented out)
  // public static apiRoot = 'https://localhost:7123/api';
  // public static clientRoot = 'http://localhost:4200';
  // public static idpAuthority = 'https://localhost:7123';
  // public static clientId = 'angular-client';

  // Production environment - Cross-domain setup
  public static apiRoot = 'https://hilcoe.edu.et:7123/api';
  public static clientRoot = 'http://staging.hilcoe.edu.et';
  public static idpAuthority = 'https://hilcoe.edu.et:7123';
  public static clientId = 'angular-client';
  
  // SSL Certificate Validation Bypass
  public static bypassSslValidation = true;
}
