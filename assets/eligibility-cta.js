/**
 * Eternahot — injects a single secondary "Check eligibility" CTA under the Call button.
 * Loaded from index.html only; keeps the homepage markup change to one script tag.
 */
(function () {
  try {
    if (document.getElementById("eh-check-eligibility")) return;

    var wrap = document.querySelector(".call-wrap");
    if (!wrap) return;

    var callBtn = wrap.querySelector(".btn-call");
    if (!callBtn) return;

    // Styles (scoped via unique ids / classes)
    var style = document.createElement("style");
    style.textContent =
      ".btn-check{width:min(420px,92vw);background:transparent;color:var(--ink,#fff);border:1px solid var(--line,#2A262E);font-size:1.05rem;font-weight:800;letter-spacing:.01em;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:12px 26px;min-height:56px;line-height:1.15;border-radius:13px;cursor:pointer;text-decoration:none;transition:transform .2s cubic-bezier(0.16,1,0.3,1),box-shadow .2s cubic-bezier(0.16,1,0.3,1),background .2s cubic-bezier(0.16,1,0.3,1),border-color .2s cubic-bezier(0.16,1,0.3,1)}" +
      ".btn-check:hover{transform:translateY(-2px);border-color:#4A4450;background:rgba(255,255,255,.04)}" +
      ".btn-check:active{transform:translateY(0)}" +
      ".btn-check .btn-check-label{display:block}" +
      ".btn-check .btn-check-sub{display:block;font-size:.72rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--dim,#6A646F)}" +
      ".call-note.eh-refined{text-align:center;max-width:28rem;justify-content:center}";
    document.head.appendChild(style);

    var a = document.createElement("a");
    a.id = "eh-check-eligibility";
    a.className = "btn btn-check";
    a.href = "/check.html";
    a.innerHTML =
      '<span class="btn-check-label">Check eligibility</span>' +
      '<span class="btn-check-sub">Weekend install · West LA · ~2 min</span>';

    // Insert right after the primary Call button
    callBtn.insertAdjacentElement("afterend", a);

    var note = wrap.querySelector(".call-note, #callNote");
    if (note) {
      note.classList.add("eh-refined");
      // Keep LED if present
      var led = note.querySelector(".led");
      note.textContent = "";
      if (led) note.appendChild(led);
      note.appendChild(
        document.createTextNode("Free check · no obligation · or call to schedule")
      );
    }
  } catch (e) {
    /* never break the homepage */
  }
})();
