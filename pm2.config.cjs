module.exports = {
  apps : [{
    name      : 'sama-server',
    script    : 'index.js',
    node_args : '-r dotenv/config',
    instances: 0,
    exec_mode: "cluster",
  }]
}