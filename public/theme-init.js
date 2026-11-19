// Apply saved colour theme + light/dark before first paint (avoids a flash). Loaded synchronously from index.html.
(function () {
  var d = document.documentElement;
  try {
    var ct = localStorage.getItem("color_theme");
    d.setAttribute("data-theme", /^(classic|beauty|ocean|emerald|slate)$/.test(ct) ? ct : "classic");
    var m = localStorage.getItem("theme");
    var dark = m === "dark" || (m === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) d.classList.add("dark");
  } catch (e) {
    d.setAttribute("data-theme", "classic");
  }
})();
