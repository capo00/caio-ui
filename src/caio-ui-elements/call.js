function serializeDtoIn(dtoIn) {
  const newDtoIn = {};
  for (let k in dtoIn) {
    if (dtoIn[k] !== undefined) {
      if (dtoIn[k] != null && typeof dtoIn[k] === "object") newDtoIn[k] = JSON.stringify(dtoIn[k]);
      else newDtoIn[k] = dtoIn[k];
    }
  }
  return newDtoIn;
}

function checkResponse(response, dtoIn) {
  if (response.status >= 400) {
    const e = new Error(response.data.message);
    e.dtoIn = dtoIn;
    e.dtoOut = response.data;
    throw e;
  }
}
const Call = {
  async get(uri, dtoIn = undefined, opts = undefined) {
    // Always absolute (see post()'s comment) -- previously only built when dtoIn was given,
    // which happened to cover every call site so far but left a plain relative "entity/list"
    // (no leading slash) unsafe for a caller without a dtoIn.
    uri = new URL(uri, location.origin);
    if (dtoIn) {
      uri.search = new URLSearchParams(serializeDtoIn(dtoIn));
    }

    let response;
    try {
      response = await fetch(uri, { credentials: "include", ...opts });
    } catch (e) {
      console.error("Error in fetch", e);
      throw e;
    }

    response.data = await response.json();
    checkResponse(response, dtoIn);

    return response;
  },

  async post(uri, dtoIn = undefined, opts = undefined) {
    // Absolute, same as get() -- a relative string reaching the loader's patched fetch()
    // (uu5loaderg01, injected for module resolution) throws "Failed to construct 'URL':
    // Invalid URL" instead of ever leaving the browser. get() only hits this path when dtoIn
    // is given (building the query string needs a URL object anyway); post() needs it always.
    uri = new URL(uri, location.origin);

    let body,
      contentType = "application/json";

    if (dtoIn) {
      if (Object.values(dtoIn).find((v) => v instanceof File)) {
        body = new FormData();
        for (let k in dtoIn) {
          const v = dtoIn[k];
          if (v !== undefined) {
            body.append(k, v && typeof v === "object" && !(v instanceof File) ? JSON.stringify(dtoIn[k]) : dtoIn[k]);
          }
        }
        contentType = undefined;
      } else {
        body = JSON.stringify(dtoIn);
      }
    }

    let response;

    try {
      response = await fetch(uri, {
        credentials: "include",
        ...opts,
        method: "POST",
        body,
        headers: {
          ...(contentType ? { "Content-Type": contentType } : null),
          ...opts?.headers,
        },
      });
    } catch (e) {
      console.error("Error in fetch", e);
      throw e;
    }

    response.data = await response.json();
    checkResponse(response, dtoIn);

    return response;
  },

  async cmdGet(...args) {
    const res = await Call.get(...args);
    return res.data;
  },

  async cmdPost(...args) {
    const res = await Call.post(...args);
    return res.data;
  },
};

export { Call };
export default Call;
