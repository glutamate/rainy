/* eslint-env browser */
/* globals notifyAlert, $, view_post, Plotly */
const inputStore = {};
let rainyOutputs;

document
  .querySelectorAll(
    "div.rainy-dashboard input[name], div.rainy-dashboard select[name]"
  )
  .forEach((el, i) => {
    el.addEventListener("change", fetchRender);
  });
document.querySelectorAll("[data-eval]").forEach((el, i) => {
  if (!el.getAttribute("data-eval-expr"))
    el.setAttribute("data-eval-expr", el.textContent);
  el.textContent = "";
});

let globalRainyContext = {};

const rainyEvalExpr = (expr) => {
  const f = new Function(
    Object.keys(globalRainyContext).join(","),
    `return ${expr}`
  );
  return f(...Object.values(globalRainyContext));
};
document.querySelectorAll(".rainy-loading-indicator").forEach((el, i) => {
  el.style.display = "none";
});

let globalRainyPause = false;

async function fetchRender() {
  if (globalRainyPause) return;
  const viewname = document
    .querySelectorAll("div.rainy-dashboard")[0]
    .getAttribute("data-viewname");
  document
    .querySelectorAll("div.rainy-dashboard input[name]")
    .forEach((el, i) => {
      inputStore[el.name] = el.type === "number" ? +el.value : el.value;
    });
  document
    .querySelectorAll("div.rainy-dashboard select[name]")
    .forEach((el, i) => {
      inputStore[el.name] = el.options[el.selectedIndex].value;
    });
  indicateLoading(true);
  console.log("inputs", inputStore);
  const rawData = await fetch(`/view/${viewname}/update`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "CSRF-Token": window._sc_globalCsrf,
    },
    body: JSON.stringify(inputStore),
  });
  const data = await rawData.json();
  if (data.error && Object.keys(data).length === 1) {
    notifyAlert({ type: "danger", text: `<pre>${data.error}</pre>` });
    indicateLoading(false);
    return;
  }
  globalRainyContext = { ...inputStore, ...data };
  rainyOutputs = data;
  try {
    //render
    document
      .querySelectorAll('script[type="text/rainy-loop-js"]')
      .forEach((el, i) => {
        const f = new Function(
          Object.keys(globalRainyContext).join(","),
          el.textContent
        );
        f(...Object.values(globalRainyContext));
      });
    document.querySelectorAll("[data-show-if]").forEach((el, i) => {
      const expr = el.getAttribute("data-show-if");
      const show_it = rainyEvalExpr(expr);
      if (show_it) el.style.display = "";
      else el.style.display = "none";
    });

    document.querySelectorAll("[data-eval-expr]").forEach((el, i) => {
      const expr = el.getAttribute("data-eval-expr");

      el.textContent = rainyEvalExpr(expr);
    });
  } catch (e) {
    notifyAlert({ type: "danger", text: e.message });
    console.error(e);
  } finally {
    indicateLoading(false);
  }
}

function indicateLoading(isLoading) {
  document.querySelectorAll(".rainy-loading-indicator").forEach((el, i) => {
    el.style.display = isLoading ? "" : "none";
  });
  document.querySelectorAll(".rainy-hide-loading").forEach((el, i) => {
    el.style.display = isLoading ? "none" : "";
  });
}

function rainyRerenderChildren(target) {
  if (!target) return;
  const plots = document.querySelectorAll(`${target} .rainy-plotly`);
  for (const plot of plots) Plotly.Plots.resize(`${plot.getAttribute("id")}`);
}
