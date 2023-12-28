module.exports = {
  apps : [{
    name      : 'sama-server',
    script    : 'index.js',
    node_args : '-r dotenv/config',
    instances: 2, // 0
    exec_mode: 'cluster',
    increment_var : 'PORT',
      env: {
        'PORT': 9001,
      }
  }]
}