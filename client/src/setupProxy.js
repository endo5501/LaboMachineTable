const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Get API URL from environment variable (default to localhost:5001)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: apiUrl,
      changeOrigin: true,
    })
  );
};
