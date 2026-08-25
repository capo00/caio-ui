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

  var PROVIDER_LABELS = { google: "Přihlásit se přes Google", facebook: "Přihlásit se přes Facebook" };

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
  };

  var registering = false;
  var passwordRule = null;

  function setMessage(text, kind) {
    el.message.textContent = text || "";
    el.message.hidden = !text;
    el.message.className = "message" + (kind === "info" ? " info" : "");
  }

  function setMode(next) {
    registering = next;
    el.submit.textContent = registering ? "Registrovat se" : "Přihlásit se";
    el.switchText.textContent = registering ? "Už máte účet?" : "Nemáte účet?";
    el.switch.textContent = registering ? "Přihlásit se" : "Registrovat se";
    el.password.autocomplete = registering ? "new-password" : "current-password";
    Array.prototype.forEach.call(document.querySelectorAll(".register-only"), function (node) {
      // The password hint only has something to say once there is a rule to show.
      node.hidden = !registering || (node === el.passwordHint && !el.passwordHint.textContent);
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
      var button = document.createElement("button");
      button.type = "button";
      button.className = "provider";
      button.textContent = PROVIDER_LABELS[provider] || provider;
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

  async function submit(event) {
    event.preventDefault();

    var email = el.email.value.trim();
    var password = el.password.value;

    if (!email || !password) return setMessage("Vyplňte e-mail a heslo.");

    if (registering) {
      var problem = localPasswordProblem(password);
      if (problem) return setMessage(problem);
    }

    var body = { email: email, password: password };
    if (registering) {
      body.firstName = el.firstName.value.trim();
      body.surname = el.surname.value.trim();
    }

    el.submit.disabled = true;
    setMessage("");

    try {
      var response = await fetch(CMD_PREFIX + (registering ? "/register" : "/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      var payload = await response.json().catch(function () {
        return null;
      });

      if (!response.ok) {
        return setMessage(errorMessage(payload, "Přihlášení se nepovedlo (" + response.status + ")."));
      }
      done(payload && payload.identity);
    } catch (e) {
      setMessage("Server neodpovídá.");
    } finally {
      el.submit.disabled = false;
    }
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
        el.passwordHint.textContent = describeRule(passwordRule);
        renderProviders(config.providerList);
      }
    } catch (e) {
      // No config means no provider buttons and no hint -- e-mail and password still work.
    }

    setMode(false);
    el.card.hidden = false;
    el.email.focus();
  }

  el.form.addEventListener("submit", submit);
  el.switch.addEventListener("click", function () {
    setMode(!registering);
  });

  init();
})();
