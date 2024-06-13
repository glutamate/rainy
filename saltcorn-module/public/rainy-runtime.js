/* eslint-env browser */
/* globals notifyAlert, $, view_post */
const inputStore = {};

document
  .querySelectorAll("div.rainy-dashboard input[name]")
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

async function fetchRender() {
  const viewname = document
    .querySelectorAll("div.rainy-dashboard")[0]
    .getAttribute("data-viewname");
  console.log("vn", viewname);
  document
    .querySelectorAll("div.rainy-dashboard input[name]")
    .forEach((el, i) => {
      inputStore[el.name] = el.type === "number" ? +el.value : el.value;
    });
  view_post(viewname, "update", inputStore, (data) => {
    globalRainyContext = { ...inputStore, ...data };
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
  });
}
