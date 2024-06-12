const Form = require("@saltcorn/data/models/form");
const Field = require("@saltcorn/data/models/field");
const File = require("@saltcorn/data/models/file");
const Table = require("@saltcorn/data/models/table");
const FieldRepeat = require("@saltcorn/data/models/fieldrepeat");
const Workflow = require("@saltcorn/data/models/workflow");
const proc_html = require("./templates.js");
const { pre, code } = require("@saltcorn/markup/tags");

const get_state_fields = () => [];

const configuration_workflow = () =>
  new Workflow({
    steps: [
      {
        name: "dashboard",
        form: async (context) => {
          const allFiles = await File.find();
          const pyFiles = allFiles.filter((f) => f.location.endsWith(".py"));
          const htmlFiles = allFiles.filter((f) =>
            f.location.endsWith(".html")
          );
          return new Form({
            fields: [
              {
                name: "compute_type",
                label: "Compute type",
                type: "String",
                required: true,
                attributes: { options: ["Python file"] },
              },
              {
                name: "python_file",
                label: "Python file",
                type: "String",
                required: true,
                attributes: { options: pyFiles.map((f) => f.path_to_serve) },
              },

              {
                name: "layout_type",
                label: "Layout type",
                type: "String",
                required: true,
                attributes: { options: ["File"] },
              },
              {
                name: "layout_file",
                label: "Layout file",
                type: "String",
                required: true,
                attributes: { options: htmlFiles.map((f) => f.path_to_serve) },
              },
            ],
          });
        },
      },
    ],
  });

const run = async (
  table_id,
  viewname,
  { python_file, layout_file },
  state,
  { req }
) => {
  const layout = await File.findOne(layout_file);
  console.log(layout);
  const foo = await proc_html(await layout.get_contents());
  console.log(foo);
  return showHtml(foo);
};

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: "rainy",
  viewtemplates: [
    {
      name: "Rainy Dashboard",
      display_state_form: false,
      tableless: true,
      get_state_fields,
      configuration_workflow,
      run,
    },
  ],
};

const showHtml = (v) =>
  pre(
    code(
      (v || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
    )
  );
