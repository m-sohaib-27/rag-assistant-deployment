export const jupyterConfig = {
  // Increase timeouts for Jupyter environment
  requestTimeout: 600000, // 10 minutes
  serverTimeout: 600000,  // 10 minutes
  
  // Enable CORS for Jupyter
  cors: {
    origin: ['http://localhost:8888', 'http://127.0.0.1:8888'],
    credentials: true
  },
  
  // Jupyter-specific settings
  jupyter: {
    enablePolling: true,
    maxQueryTime: 300, // 5 minutes max per query
    pollInterval: 3000 // Check every 3 seconds
  }
};

export type JupyterConfig = typeof jupyterConfig;