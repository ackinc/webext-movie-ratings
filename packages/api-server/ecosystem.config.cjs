module.exports = {
  apps: [
    {
      name: "sift-server",
      script: "./main.ts",
      instances: -1,
      exec_mode: "cluster",
      watch: false,
      ignore_watch: ["node_modules"],
      interpreter: "node",
      node_args: "--unhandled-rejections=strict",
      autorestart: true,
      max_restarts: 3,
      min_uptime: 5000,
    },
  ],
};
