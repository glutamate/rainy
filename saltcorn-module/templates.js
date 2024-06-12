const Handlebars = require("handlebars");
const fsp = require("fs").promises;
const path = require("path");

module.exports = async (fragment) => {
  const templates = {};
  for (const fp of await fsp.readdir(path.join(__dirname, "templates"))) {
    if (!fp.endsWith(".html")) continue;
    const name = fp.replace(".html", "");
    const body = await fsp.readFile(path.join(__dirname, "templates", fp));
    templates[name] = body.toString();
  }
  console.log(templates);
};
