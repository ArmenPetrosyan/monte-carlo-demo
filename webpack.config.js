module.exports = {
  entry: './index.html',
  devServer: {
    host: '0.0.0.0',
    port: process.env.PORT || 8080
  }
}