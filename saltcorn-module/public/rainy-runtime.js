/* eslint-env browser */
/* globals notifyAlert, $, view_post */
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
async function fetchRender() {
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
  document.querySelectorAll(".rainy-loading-indicator").forEach((el, i) => {
    el.style.display = "";
  });
  document.querySelectorAll(".rainy-hide-loading").forEach((el, i) => {
    el.style.display = "none";
  });
  console.log("inputs", inputStore);
  view_post(viewname, "update", inputStore, (data) => {
    globalRainyContext = { ...inputStore, ...data };
    rainyOutputs = data;
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
    document.querySelectorAll(".rainy-loading-indicator").forEach((el, i) => {
      el.style.display = "none";
    });
    document.querySelectorAll(".rainy-hide-loading").forEach((el, i) => {
      el.style.display = "";
    });
  });
}
