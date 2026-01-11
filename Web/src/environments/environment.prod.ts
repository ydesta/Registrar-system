/**
 * Production Environment Configuration
 * 
 * requireHttps: true - Enforces HTTPS-only connections via CSP upgrade-insecure-requests
 * This prevents HTTP downgrade attacks in production environments.
 */
 export const environment = {
  production: true,
  requireHttps: true,
  secureUrl: "https://hilcoe.edu.et:5001/api",
  baseUrl: "https://hilcoe.edu.et:36201/api",
  fileUrl: "https://hilcoe.edu.et:36201",
  apiVersion: "v1.0",
  frontendClientKey: "HSCRS-2024-FRONTEND-SECURE-KEY-A7B9C3D5E8F1G2H4I6J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6"
};

// Alternative production configurations (commented out)
// export const environment = {
//   production: true,
//   requireHttps: true,
//   secureUrl: "https://hilcoe.edu.et:7123/api",
//   baseUrl: "https://hilcoe.edu.et:5000/api",
//   fileUrl: "https://hilcoe.edu.et:5000",
//   apiVersion: "v1.0",
//   frontendClientKey: "HSCRS-2024-FRONTEND-SECURE-KEY-A7B9C3D5E8F1G2H4I6J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6"
// };

// export const environment = {
//   production: false,
//   requireHttps: false,
//   secureUrl: "https://localhost:7123/api",
//   baseUrl: "http://localhost:5000/api",
//   fileUrl: "http://localhost:5000",
//   apiVersion: "v1.0",
//   frontendClientKey: "HSCRS-2024-FRONTEND-SECURE-KEY-A7B9C3D5E8F1G2H4I6J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6"
// };