import { Utils, useContext, useState, useMemo, useEffect } from "uu5g05";

const DEFAULT_CMD_PREFIX = "/auth";
const LOGIN_PAGE = "/login.html";

const [SessionContext] = Utils.Context.create({});

function SessionProvider({ cmdPrefix = DEFAULT_CMD_PREFIX, ...props }) {
  const [identity, setIdentity] = useState();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(cmdPrefix, {
          method: "GET",
          credentials: "include", // Important: This ensures cookies are sent with the request
        });

        if (response.status === 200) {
          const data = await response.json();
          setIdentity(data.identity);
        } else {
          setIdentity(null);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setIdentity(null);
      }
    };

    checkAuthStatus();
  }, []);

  useEffect(() => {
    function onMessage(e) {
      if (e.data?.type === "auth" && e.data.identity) {
        setIdentity(e.data.identity);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const value = useMemo(() => {
    let { exp, iat, ...params } = identity || {};
    if (!identity) params = identity;
    return {
      identity: params,
      state: identity === undefined ? "pending" : identity === null ? "notAuthenticated" : "authenticated",
      /**
       * Opens the standalone login page (static/login, carried into the build by
       * caio-devkit) in a popup. The page offers the providers this deployment has
       * credentials for and an e-mail/password form, and hands the identity back
       * through the postMessage listener above -- as does the OAuth callback, since
       * window.opener survives the popup navigating to /auth/<provider>.
       *
       * /login.html, not /login: caio-server answers extensionless paths with the SPA.
       */
      login() {
        const width = Math.min(window.innerWidth, 600);
        const height = Math.min(window.innerHeight, 870);
        window.open(
          LOGIN_PAGE,
          null,
          `top=${window.innerHeight / 2 - height / 2},left=${window.innerWidth / 2 - width / 2},width=${width},height=${height}`,
        );
      },
      async logout() {
        await fetch(cmdPrefix + "/logout", {
          method: "POST",
          credentials: "include", // This ensures cookies are sent with the request
        });
        setIdentity(null);
      },
    };
  }, [identity]);

  return <SessionContext.Provider value={value}>{props.children}</SessionContext.Provider>;
}

function useSession() {
  return useContext(SessionContext);
}

export { SessionProvider, useSession };
