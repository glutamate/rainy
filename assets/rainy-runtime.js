const inputStore = {};

document.querySelectorAll("input[name]").forEach((el, i) => {
  el.addEventListener("change", fetchRender);
});
document.querySelectorAll("[data-eval]").forEach((el, i) => {
  if (!el.getAttribute("data-eval-expr"))
    el.setAttribute("data-eval-expr", el.textContent);
  el.textContent = "";
});
async function fetchRender() {
  document.querySelectorAll("input[name]").forEach((el, i) => {
    inputStore[el.name] = el.type === "number" ? +el.value : el.value;
  });
  const response = await fetch("/calc", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(inputStore),
  });
  const data = await response.json();
  const evalCtx = { ...inputStore, ...data };
  document.querySelectorAll("[data-eval-expr]").forEach((el, i) => {
    const expr = el.getAttribute("data-eval-expr");
    const f = new Function(Object.keys(evalCtx).join(","), `return ${expr}`);
    const val = f(...Object.values(evalCtx));
    el.textContent = val;
  });
}

fetchRender();
