/*
 * Login and registration for a caio app, served as a standalone page so the popup does
 * not have to load the whole SPA (docs/auth.md, 5.2 in caio-server).
 *
 * Opened by SessionProvider.login() as a popup: on success it hands the identity to the
 * opener through postMessage and closes itself. Opened directly in a tab it goes to "/"
 * instead, so the page is never a dead end.
 */
(function () {
  "use strict";

  var CONFIG = window.CAIO_LOGIN || {};
  var CMD_PREFIX = CONFIG.cmdPrefix || "/auth";
  var APP_NAME = CONFIG.appName || "";

  /*
   * Provider buttons follow each brand's sign-in guidelines: Google is a white button
   * with a #747775 border, #1f1f1f Roboto-ish label and the four-colour G; Facebook is
   * #1877f2 with white text and the white f. Both keep the logo at 18-20px with the
   * label beside it, and the wording is the sanctioned "Sign in with X" / "Continue
   * with X" form. Do not restyle these into the app's own colours -- both brands
   * require their own.
   */
  var PROVIDERS = {
    google: {
      label: "Přihlásit se přes Google",
      className: "provider provider--google",
      logo:
        '<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true" focusable="false">' +
        '<path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z"/>' +
        '<path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86a5.36 5.36 0 0 1-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z"/>' +
        '<path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.96H.96a9 9 0 0 0 0 8.08l3.01-2.32z"/>' +
        '<path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.32A5.36 5.36 0 0 1 9 3.58z"/>' +
        "</svg>",
    },
    facebook: {
      label: "Přihlásit se přes Facebook",
      className: "provider provider--facebook",
      logo:
        '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">' +
        '<path fill="#ffffff" d="M13.06 20v-7.75h2.6l.39-3.02h-2.99V7.3c0-.87.24-1.47 1.5-1.47h1.6V3.13c-.28-.04-1.23-.12-2.34-.12-2.31 0-3.9 1.41-3.9 4v2.22H7.31v3.02h2.61V20h3.14z"/>' +
        "</svg>",
    },
  };

  var el = {
    card: document.querySelector(".card"),
    appName: document.getElementById("app-name"),
    providers: document.getElementById("providers"),
    separator: document.getElementById("separator"),
    form: document.getElementById("form"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
    firstName: document.getElementById("firstName"),
    surname: document.getElementById("surname"),
    passwordHint: document.getElementById("password-hint"),
    message: document.getElementById("message"),
    submit: document.getElementById("submit"),
    switch: document.getElementById("switch"),
    switchText: document.getElementById("switch-text"),
    forgot: document.getElementById("forgot"),
    back: document.getElementById("back"),
    intro: document.getElementById("intro"),
    password2: document.getElementById("password2"),
  };

  // login | register | forgot | reset. `reset` is only reachable with a token in the
  // query string -- it is the second half of the flow that starts in `forgot`.
  var mode = "login";
  var passwordRule = null;
  var passwordResetEnabled = false;
  var resetToken = null;

  var SUBMIT_LABEL = {
    login: "Přihlásit se",
    register: "Registrovat se",
    forgot: "Poslat odkaz",
    reset: "Nastavit heslo",
  };

  var INTRO = {
    forgot: "Zadejte e-mail, kterým se přihlašujete. Pošleme na něj odkaz pro nastavení nového hesla.",
    reset: "Zvolte si nové heslo.",
  };

  function setMessage(text, kind) {
    el.message.textContent = text || "";
    el.message.hidden = !text;
    el.message.className = "message" + (kind === "info" ? " info" : "");
  }

  function setMode(next) {
    mode = next;
    el.submit.textContent = SUBMIT_LABEL[mode];
    el.switchText.textContent = mode === "register" ? "Už máte účet?" : "Nemáte účet?";
    el.switch.textContent = mode === "register" ? "Přihlásit se" : "Registrovat se";
    el.password.autocomplete = mode === "login" ? "current-password" : "new-password";
    el.intro.textContent = INTRO[mode] || "";

    Array.prototype.forEach.call(document.querySelectorAll("[data-modes]"), function (node) {
      var belongs = node.getAttribute("data-modes").split(" ").indexOf(mode) !== -1;
      // Two nodes have something to say only sometimes: the password hint needs a rule
      // to show, and the "forgot password" link needs the deployment to support it.
      if (node === el.passwordHint) belongs = belongs && Boolean(el.passwordHint.textContent);
      if (node === el.forgot.parentNode) belongs = belongs && passwordResetEnabled;
      node.hidden = !belongs;
    });

    setMessage("");
  }

  function describeRule(rule) {
    if (!rule || !rule.minLength) return "";
    return "Alespoň " + rule.minLength + " znaků, malé i velké písmeno a číslice.";
  }

  /** The server is the one that enforces this; here it only saves a round trip. */
  function localPasswordProblem(value) {
    if (!passwordRule) return null;
    if (value.length < passwordRule.minLength) return describeRule(passwordRule);
    if (passwordRule.patternSource) {
      try {
        if (!new RegExp(passwordRule.patternSource, passwordRule.patternFlags || "").test(value)) {
          return describeRule(passwordRule);
        }
      } catch (e) {
        // An unsupported pattern in this browser is not a reason to block the attempt.
      }
    }
    return null;
  }

  function renderProviders(providerList) {
    el.providers.innerHTML = "";
    (providerList || []).forEach(function (provider) {
      var brand = PROVIDERS[provider];
      var button = document.createElement("button");
      button.type = "button";
      button.className = brand ? brand.className : "provider";

      if (brand) {
        var logo = document.createElement("span");
        logo.className = "provider-logo";
        logo.innerHTML = brand.logo;
        button.appendChild(logo);
      }

      var label = document.createElement("span");
      label.className = "provider-label";
      label.textContent = brand ? brand.label : provider;
      button.appendChild(label);

      button.addEventListener("click", function () {
        // Same window on purpose: the opener survives the navigation, so the callback
        // page can still postMessage into the app and close this popup.
        window.location.href = CMD_PREFIX + "/" + provider;
      });
      el.providers.appendChild(button);
    });
    el.separator.hidden = !(providerList && providerList.length);
  }

  function errorMessage(payload, fallback) {
    if (payload && payload.error && payload.error.message) return payload.error.message;
    if (payload && payload.message) return payload.message;
    return fallback;
  }

  function done(identity) {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: "auth", identity: identity }, window.location.origin);
      window.close();
      // Closing can be refused (a tab, not a popup), so say something either way.
      setMessage("Přihlášeno. Okno můžete zavřít.", "info");
      return;
    }
    window.location.href = "/";
  }

  async function post(path, body) {
    var response = await fetch(CMD_PREFIX + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    var payload = await response.json().catch(function () {
      return null;
    });
    return { ok: response.ok, status: response.status, payload: payload };
  }

  async function submit(event) {
    event.preventDefault();

    var email = el.email.value.trim();
    var password = el.password.value;
    var body;
    var path;
    var fallbackMessage;

    if (mode === "forgot") {
      if (!email) return setMessage("Vyplňte e-mail.");
      path = "/password/reset-request";
      body = { email: email };
      fallbackMessage = "Odeslání se nepovedlo";
    } else if (mode === "reset") {
      if (!password) return setMessage("Vyplňte nové heslo.");
      if (password !== el.password2.value) return setMessage("Hesla se neshodují.");
      var resetProblem = localPasswordProblem(password);
      if (resetProblem) return setMessage(resetProblem);
      path = "/password/reset";
      body = { token: resetToken, password: password };
      fallbackMessage = "Nastavení hesla se nepovedlo";
    } else {
      if (!email || !password) return setMessage("Vyplňte e-mail a heslo.");
      if (mode === "register") {
        var problem = localPasswordProblem(password);
        if (problem) return setMessage(problem);
      }
      path = mode === "register" ? "/register" : "/login";
      body = { email: email, password: password };
      if (mode === "register") {
        body.firstName = el.firstName.value.trim();
        body.surname = el.surname.value.trim();
      }
      fallbackMessage = "Přihlášení se nepovedlo";
    }

    el.submit.disabled = true;
    setMessage("");

    try {
      var result = await post(path, body);

      if (!result.ok) {
        return setMessage(errorMessage(result.payload, fallbackMessage + " (" + result.status + ")."));
      }

      if (mode === "forgot") {
        // Deliberately the same answer whether the address is registered or not -- the
        // server does not say either, so neither does the page.
        return setMessage("Pokud e-mail známe, odkaz je na cestě. Zkontrolujte schránku.", "info");
      }
      if (mode === "reset") {
        // No cookie comes back from /password/reset on purpose: reading the mailbox is
        // not the same as sitting at a trusted device. So: sign in with the new password.
        resetToken = null;
        clearResetFromUrl();
        setMode("login");
        el.password.value = "";
        return setMessage("Heslo je nastavené. Teď se přihlaste.", "info");
      }
      done(result.payload && result.payload.identity);
    } catch (e) {
      setMessage("Server neodpovídá.");
    } finally {
      el.submit.disabled = false;
    }
  }

  /** Keeps the one-time token out of the address bar, history and any later Referer. */
  function clearResetFromUrl() {
    if (!window.history || !window.history.replaceState) return;
    window.history.replaceState({}, "", window.location.pathname);
  }

  async function init() {
    if (APP_NAME) {
      el.appName.textContent = APP_NAME;
      document.title = APP_NAME + " — přihlášení";
    }

    try {
      var response = await fetch(CMD_PREFIX + "/config", { credentials: "include" });
      if (response.ok) {
        var config = await response.json();
        passwordRule = config.password || null;
        passwordResetEnabled = Boolean(config.passwordResetEnabled);
        el.passwordHint.textContent = describeRule(passwordRule);
        renderProviders(config.providerList);
      }
    } catch (e) {
      // No config means no provider buttons, no hint and no reset -- e-mail and password
      // still work.
    }

    resetToken = new URLSearchParams(window.location.search).get("reset");

    if (resetToken) {
      setMode("reset");
      el.card.hidden = false;
      el.password.focus();
      return;
    }

    setMode("login");
    el.card.hidden = false;
    el.email.focus();
  }

  el.form.addEventListener("submit", submit);
  el.switch.addEventListener("click", function () {
    setMode(mode === "register" ? "login" : "register");
  });
  el.forgot.addEventListener("click", function () {
    setMode("forgot");
    el.email.focus();
  });
  el.back.addEventListener("click", function () {
    resetToken = null;
    clearResetFromUrl();
    setMode("login");
    el.email.focus();
  });

  init();
})();
