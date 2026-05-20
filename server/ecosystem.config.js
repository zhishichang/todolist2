module.exports = {
  apps: [
    {
      name: 'todolist-server',
      script: 'app.js',
      instances: 1,
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
