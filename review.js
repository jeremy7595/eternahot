(function () {
  var PAGE = "https://eternahot.com/review";
  var SEND = "https://eternahot.com/review?go=1";
  var GOOGLE = "https://maps.google.com/?cid=2518757138518795632";
  var SMS =
    "Hi — we finished at the house. If you have 20 seconds, this opens Eternahot on Google Maps (you don’t search). Tap Write a review: " +
    SEND +
    " — Jeremy, Eternahot (213) 222-3457";

  function openGoogle() {
    window.location.href = GOOGLE;
  }

  function copyText(text, btn, label) {
    var done = function () {
      if (!btn) return;
      var prev = btn.textContent;
      btn.textContent = "Copied";
      btn.classList.add("copied");
      window.setTimeout(function () {
        btn.textContent = label || prev;
        btn.classList.remove("copied");
      }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        window.prompt("Copy this link", text);
      });
    } else {
      window.prompt("Copy this link", text);
    }
  }

  var params = new URLSearchParams(window.location.search);
  if (params.has("go")) {
    document.documentElement.classList.add("going");
    if (window.history && history.replaceState) {
      history.replaceState({}, "", window.location.pathname);
    }
    window.setTimeout(openGoogle, 500);
  }

  var goBtn = document.getElementById("openGoogle");
  if (goBtn) goBtn.addEventListener("click", openGoogle);

  var preview = document.getElementById("smsPreview");
  if (preview) preview.textContent = SMS;

  var smsLink = document.getElementById("smsSend");
  if (smsLink) {
    smsLink.setAttribute("href", "sms:?&body=" + encodeURIComponent(SMS));
  }

  var copySend = document.getElementById("copySend");
  if (copySend) {
    copySend.addEventListener("click", function () {
      copyText(SEND, copySend, "Copy link");
    });
  }

  var printBtn = document.getElementById("printQr");
  if (printBtn) {
    printBtn.addEventListener("click", function () {
      window.print();
    });
  }
})();

