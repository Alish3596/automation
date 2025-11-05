module.exports = {
  default: `--require-module ts-node/register --require "steps/**/*.ts" --format @cucumber/html-formatter:reports/login-report.html`,
};
