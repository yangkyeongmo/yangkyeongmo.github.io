(function () {
  var KEY = "blog-lang";

  document.addEventListener("click", function (e) {
    var target = e.target.closest("[data-set-lang]");
    if (!target) return;
    try {
      localStorage.setItem(KEY, target.getAttribute("data-set-lang"));
    } catch (err) {}
  });

  var homeLang = document.body.getAttribute("data-home");
  if (!homeLang) return;

  var pref;
  try {
    pref = localStorage.getItem(KEY);
  } catch (err) {
    return;
  }
  if (!pref || pref === homeLang) return;

  if (pref === "ko") {
    location.replace("/ko/");
  } else if (pref === "en") {
    location.replace("/");
  }
})();
