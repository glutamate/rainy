const Handlebars = require("handlebars");
const fsp = require("fs").promises;
const path = require("path");
const cheerio = require("cheerio");

module.exports = async (fragment) => {
  const templates = {};
  for (const fp of await fsp.readdir(path.join(__dirname, "templates"))) {
    if (!fp.endsWith(".html")) continue;
    const name = fp.replace(".html", "");
    const body = await fsp.readFile(path.join(__dirname, "templates", fp));
    templates[name] = body.toString();
  }
  const $ = cheerio.load(fragment);

  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, body] of Object.entries(templates)) {
      const matches = $(name);
      matches.each(function () {
        changed = true;
        const $this = $(this);
        const context = {};
        for (const { name, value } of this.attributes) {
          context[name] = value;
        }
        context.body = $this.html();
        for (const child of this.children) {
          if (child.constructor.name === "Element") {
            if (!context[child.name]) context[child.name] = [];
            const pushval = {};
            for (const { name, value } of child.attributes) {
              pushval[name] = value;
            }
            context[child.name].push(pushval);
          }
        }
        const template = Handlebars.compile(body);
        $(this).replaceWith($(template(context)));
      });
    }
  }
  return $.html();
};
