(function () {
  var root = document.querySelector(".post-content");
  var lang = document.documentElement.lang || "en";
  var permalinkLabel = lang === "ko" ? "고유 링크" : "Permalink";
  var footnotesTitle = lang === "ko" ? "각주" : "Footnotes";

  if (root) {
    var headings = root.querySelectorAll("h1[id], h2[id], h3[id], h4[id]");
    for (var i = 0; i < headings.length; i++) {
      var heading = headings[i];
      if (heading.querySelector(".permalink")) continue;
      var link = document.createElement("a");
      link.className = "permalink";
      link.href = "#" + heading.id;
      link.title = permalinkLabel;
      link.setAttribute("aria-label", permalinkLabel);
      link.textContent = "#";
      heading.appendChild(link);
    }

    var tables = root.querySelectorAll("table");
    for (var t = 0; t < tables.length; t++) {
      var table = tables[t];
      if (table.parentNode && table.parentNode.classList.contains("table-wrap")) continue;
      var wrap = document.createElement("div");
      wrap.className = "table-wrap";
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    }
  }

  var footnotes = document.querySelector(".footnotes");
  if (footnotes) {
    footnotes.setAttribute("role", "doc-endnotes");
    if (!footnotes.querySelector("#footnotes-title")) {
      var title = document.createElement("h2");
      title.id = "footnotes-title";
      title.textContent = footnotesTitle;
      footnotes.insertBefore(title, footnotes.firstChild);
    }
    var backs = footnotes.querySelectorAll("a.reversefootnote, a[href^='#fnref']");
    for (var b = 0; b < backs.length; b++) {
      var href = backs[b].getAttribute("href") || "";
      var num = href.replace("#fnref:", "").replace("#fnref", "");
      var backLabel =
        lang === "ko" ? "참고 " + num + "로 돌아가기" : "Back to reference " + num;
      backs[b].setAttribute("aria-label", backLabel);
      backs[b].setAttribute("role", "doc-backlink");
    }
  }
})();
