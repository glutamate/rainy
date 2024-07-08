const db = require("@saltcorn/data/db");
const Form = require("@saltcorn/data/models/form");
const Field = require("@saltcorn/data/models/field");
const File = require("@saltcorn/data/models/file");
const Table = require("@saltcorn/data/models/table");
const FieldRepeat = require("@saltcorn/data/models/fieldrepeat");
const Workflow = require("@saltcorn/data/models/workflow");
const proc_html = require("./templates.js");
const { pre, code, div, script, domReady } = require("@saltcorn/markup/tags");
const {
  jsexprToWhere,
  eval_expression,
  freeVariables,
} = require("@saltcorn/data/models/expression");

const exec = require("child_process").exec;
const path = require("path");

const get_state_fields = () => [];

const configuration_workflow = () =>
  new Workflow({
    steps: [
      {
        name: "Dashboard",
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
                name: "python_bin",
                label: "Python executable",
                sublabel: "If blank, defaults to python3",
                type: "String",
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
      {
        name: "Persistence",
        form: async (context) => {
          const tables = await Table.find();
          const jsonFieldOptions = {};
          const stringFieldOptions = {};
          for (const table of tables) {
            jsonFieldOptions[table.name] = table.fields
              .filter((f) => f.type?.name === "JSON")
              .map((f) => f.name);
            stringFieldOptions[table.name] = table.fields
              .filter((f) => f.type?.name === "String")
              .map((f) => f.name);
          }
          return new Form({
            fields: [
              {
                name: "persistence_table",
                label: "Persistence table",
                type: "String",
                attributes: { options: tables.map((t) => t.name) },
              },
              {
                name: "inputs_field",
                label: "Inputs field",
                type: "String",
                attributes: {
                  calcOptions: ["persistence_table", jsonFieldOptions],
                },
                showIf: { persistence_table: tables.map((t) => t.name) },
              },
              {
                name: "outputs_field",
                label: "Outputs field",
                type: "String",
                attributes: {
                  calcOptions: ["persistence_table", jsonFieldOptions],
                },
                showIf: { persistence_table: tables.map((t) => t.name) },
              },
              {
                name: "name_field",
                label: "Name field",
                type: "String",
                attributes: {
                  calcOptions: ["persistence_table", stringFieldOptions],
                },
                showIf: { persistence_table: tables.map((t) => t.name) },
              },
              {
                name: "field_values_formula",
                label: "Row values formula",
                class: "validate-expression",
                sublabel:
                  'Additional field values set on the persistence table. <code>row</code> referes to the view state. For example <code>{dashboard: "Model1", user: user.id, saved_at: new Date()}</code>',
                type: "String",
                fieldview: "textarea",
              },
              {
                name: "row_query",
                label: "Row query",
                class: "validate-expression",
                sublabel:
                  'Additional query when loading exisitng persistence sets. For example <code>{user: user.id, dashboard: "Model1"}</code>',
                type: "String",
                fieldview: "textarea",
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
  {
    python_file,
    layout_file,
    persistence_table,
    inputs_field,
    outputs_field,
    name_field,
    row_query,
  },
  state,
  extra
) => {
  const layout = await File.findOne(layout_file);
  const foo = await proc_html(await layout.get_contents());
  let persistData = [];
  if (persistence_table) {
    const qextra = row_query
      ? eval_expression(row_query, {}, extra.req.user)
      : {};
    const table = Table.findOne(persistence_table);
    const rows = await table.getRows(qextra);
    persistData = rows.map((r) => ({
      inputs: r[inputs_field],
      name: r[name_field],
      id: r[table.pk_name],
    }));
  }
  return (
    script(`const rainyPersistData = ${JSON.stringify(persistData)}`) +
    div({ class: "rainy-dashboard", "data-viewname": viewname }, foo) +
    (extra.isPreview ? "" : script(domReady(`fetchRender()`)))
  );
};

const runCmd = (cmd, options) => {
  return new Promise((resolve, reject) => {
    const cp = exec(
      cmd,
      options?.cwd ? { cwd: options.cwd } : {},
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            stdout,
            stderr,
          });
        }
      }
    );
    if (options?.stdin) {
      cp.stdin.write(options.stdin);
      cp.stdin.end();
    }
  });
};

const update = async (
  table_id,
  viewname,
  { python_file, python_bin },
  body,
  { req }
) => {
  const pyfile = await File.findOne(python_file);
  const cwd = path.dirname(pyfile.location);
  const name = path.basename(pyfile.location);

  //let options = { stdio: "pipe", cwd: __dirname };
  let cmd = `${python_bin || "python3"} ${name}`;
  try {
    const { stdout, stderr } = await runCmd(cmd, {
      cwd,
      stdin: JSON.stringify(body),
    });
    console.log(stderr);
    return { json: JSON.parse(stdout) };
  } catch (e) {
    console.error("runCmd error ", e);
    return {
      json: {
        error: (e.message || "").replace(`Command failed: ${cmd}`, ""),
      },
    };
  }
};

const save_persist = async (
  table_id,
  viewname,
  {
    persistence_table,
    inputs_field,
    outputs_field,
    name_field,
    field_values_formula,
  },
  body,
  { req }
) => {
  if (persistence_table) {
    let extraVals = {};
    if (field_values_formula) {
      extraVals = eval_expression(field_values_formula, {}, req.user);
    }
    const table = Table.findOne(persistence_table);
    const row = {};
    const id = await table.insertRow({
      ...extraVals,
      [inputs_field]: body.inputs,
      [outputs_field]: body.outputs,
      [name_field]: body.name,
    });
    return { json: { success: "ok", id } };
  } else throw new Error("Persistence not configured");
};

const delete_persist = async (
  table_id,
  viewname,
  {
    persistence_table,
    inputs_field,
    outputs_field,
    name_field,
    field_values_formula,
  },
  body,
  { req }
) => {
  if (persistence_table) {
    const table = Table.findOne(persistence_table);

    await table.deleteRows({ id: body.id });
  } else throw new Error("Persistence not configured");
  return { json: { success: "ok" } };
};

const headers = [
  {
    script: `/plugins/public/rainy@${
      require("./package.json").version
    }/rainy-runtime.js`,
  },
];

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: "rainy",
  headers,
  viewtemplates: [
    {
      name: "Rainy Dashboard",
      display_state_form: false,
      tableless: true,
      get_state_fields,
      configuration_workflow,
      run,
      routes: { update, save_persist, delete_persist },
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
