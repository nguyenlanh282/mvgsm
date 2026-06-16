var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-jGiGBf/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-jGiGBf/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// ../../node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// ../../node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// ../../node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// ../../node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// ../../node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = /* @__PURE__ */ __name(class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
}, "HonoRequest");

// ../../node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// ../../node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = /* @__PURE__ */ __name(class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
}, "Context");

// ../../node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = /* @__PURE__ */ __name(class extends Error {
}, "UnsupportedPathError");

// ../../node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../../node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = /* @__PURE__ */ __name(class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
}, "_Hono");

// ../../node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }, "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// ../../node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = /* @__PURE__ */ __name(class _Node {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
}, "_Node");

// ../../node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = /* @__PURE__ */ __name(class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
}, "Trie");

// ../../node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = /* @__PURE__ */ __name(class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
}, "RegExpRouter");

// ../../node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = /* @__PURE__ */ __name(class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
}, "SmartRouter");

// ../../node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = /* @__PURE__ */ __name(class _Node2 {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
}, "_Node");

// ../../node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = /* @__PURE__ */ __name(class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
}, "TrieRouter");

// ../../node_modules/hono/dist/hono.js
var Hono2 = /* @__PURE__ */ __name(class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
}, "Hono");

// ../../node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        if (opts.credentials) {
          return (origin) => origin || null;
        }
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*" || opts.credentials) {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*" || opts.credentials) {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// ../../node_modules/hono/dist/utils/color.js
function getColorEnabled() {
  const { process, Deno: Deno2 } = globalThis;
  const isNoColor = typeof Deno2?.noColor === "boolean" ? Deno2.noColor : process !== void 0 ? (
    // eslint-disable-next-line no-unsafe-optional-chaining
    "NO_COLOR" in process?.env
  ) : false;
  return !isNoColor;
}
__name(getColorEnabled, "getColorEnabled");
async function getColorEnabledAsync() {
  const { navigator: navigator2 } = globalThis;
  const cfWorkers = "cloudflare:workers";
  const isNoColor = navigator2 !== void 0 && navigator2.userAgent === "Cloudflare-Workers" ? await (async () => {
    try {
      return "NO_COLOR" in ((await import(cfWorkers)).env ?? {});
    } catch {
      return false;
    }
  })() : !getColorEnabled();
  return !isNoColor;
}
__name(getColorEnabledAsync, "getColorEnabledAsync");

// ../../node_modules/hono/dist/middleware/logger/index.js
var humanize = /* @__PURE__ */ __name((times) => {
  const [delimiter, separator] = [",", "."];
  const orderTimes = times.map((v) => v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter));
  return orderTimes.join(separator);
}, "humanize");
var time = /* @__PURE__ */ __name((start) => {
  const delta = Date.now() - start;
  return humanize([delta < 1e3 ? delta + "ms" : Math.round(delta / 1e3) + "s"]);
}, "time");
var colorStatus = /* @__PURE__ */ __name(async (status) => {
  const colorEnabled = await getColorEnabledAsync();
  if (colorEnabled) {
    switch (status / 100 | 0) {
      case 5:
        return `\x1B[31m${status}\x1B[0m`;
      case 4:
        return `\x1B[33m${status}\x1B[0m`;
      case 3:
        return `\x1B[36m${status}\x1B[0m`;
      case 2:
        return `\x1B[32m${status}\x1B[0m`;
    }
  }
  return `${status}`;
}, "colorStatus");
async function log(fn, prefix, method, path, status = 0, elapsed) {
  const out = prefix === "<--" ? `${prefix} ${method} ${path}` : `${prefix} ${method} ${path} ${await colorStatus(status)} ${elapsed}`;
  fn(out);
}
__name(log, "log");
var logger = /* @__PURE__ */ __name((fn = console.log) => {
  return /* @__PURE__ */ __name(async function logger2(c, next) {
    const { method, url } = c.req;
    const path = url.slice(url.indexOf("/", 8));
    await log(fn, "<--", method, path);
    const start = Date.now();
    await next();
    await log(fn, "-->", method, path, c.res.status, time(start));
  }, "logger2");
}, "logger");

// ../../node_modules/hono/dist/middleware/powered-by/index.js
var poweredBy = /* @__PURE__ */ __name((options) => {
  return /* @__PURE__ */ __name(async function poweredBy2(c, next) {
    await next();
    c.res.headers.set("X-Powered-By", options?.serverName ?? "Hono");
  }, "poweredBy2");
}, "poweredBy");

// ../../node_modules/hono/dist/utils/encode.js
var decodeBase64Url = /* @__PURE__ */ __name((str) => {
  return decodeBase64(str.replace(/_|-/g, (m) => ({ _: "/", "-": "+" })[m] ?? m));
}, "decodeBase64Url");
var encodeBase64Url = /* @__PURE__ */ __name((buf) => encodeBase64(buf).replace(/\/|\+/g, (m) => ({ "/": "_", "+": "-" })[m] ?? m), "encodeBase64Url");
var encodeBase64 = /* @__PURE__ */ __name((buf) => {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0, len = bytes.length; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}, "encodeBase64");
var decodeBase64 = /* @__PURE__ */ __name((str) => {
  const binary = atob(str);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  const half = binary.length / 2;
  for (let i = 0, j = binary.length - 1; i <= half; i++, j--) {
    bytes[i] = binary.charCodeAt(i);
    bytes[j] = binary.charCodeAt(j);
  }
  return bytes;
}, "decodeBase64");

// ../../node_modules/hono/dist/utils/jwt/jwa.js
var AlgorithmTypes = /* @__PURE__ */ ((AlgorithmTypes2) => {
  AlgorithmTypes2["HS256"] = "HS256";
  AlgorithmTypes2["HS384"] = "HS384";
  AlgorithmTypes2["HS512"] = "HS512";
  AlgorithmTypes2["RS256"] = "RS256";
  AlgorithmTypes2["RS384"] = "RS384";
  AlgorithmTypes2["RS512"] = "RS512";
  AlgorithmTypes2["PS256"] = "PS256";
  AlgorithmTypes2["PS384"] = "PS384";
  AlgorithmTypes2["PS512"] = "PS512";
  AlgorithmTypes2["ES256"] = "ES256";
  AlgorithmTypes2["ES384"] = "ES384";
  AlgorithmTypes2["ES512"] = "ES512";
  AlgorithmTypes2["EdDSA"] = "EdDSA";
  return AlgorithmTypes2;
})(AlgorithmTypes || {});

// ../../node_modules/hono/dist/helper/adapter/index.js
var knownUserAgents = {
  deno: "Deno",
  bun: "Bun",
  workerd: "Cloudflare-Workers",
  node: "Node.js"
};
var getRuntimeKey = /* @__PURE__ */ __name(() => {
  const global = globalThis;
  const userAgentSupported = typeof navigator !== "undefined" && true;
  if (userAgentSupported) {
    for (const [runtimeKey, userAgent] of Object.entries(knownUserAgents)) {
      if (checkUserAgentEquals(userAgent)) {
        return runtimeKey;
      }
    }
  }
  if (typeof global?.EdgeRuntime === "string") {
    return "edge-light";
  }
  if (global?.fastly !== void 0) {
    return "fastly";
  }
  if (global?.process?.release?.name === "node") {
    return "node";
  }
  return "other";
}, "getRuntimeKey");
var checkUserAgentEquals = /* @__PURE__ */ __name((platform) => {
  const userAgent = "Cloudflare-Workers";
  return userAgent.startsWith(platform);
}, "checkUserAgentEquals");

// ../../node_modules/hono/dist/utils/jwt/types.js
var JwtAlgorithmNotImplemented = /* @__PURE__ */ __name(class extends Error {
  constructor(alg) {
    super(`${alg} is not an implemented algorithm`);
    this.name = "JwtAlgorithmNotImplemented";
  }
}, "JwtAlgorithmNotImplemented");
var JwtAlgorithmRequired = /* @__PURE__ */ __name(class extends Error {
  constructor() {
    super('JWT verification requires "alg" option to be specified');
    this.name = "JwtAlgorithmRequired";
  }
}, "JwtAlgorithmRequired");
var JwtAlgorithmMismatch = /* @__PURE__ */ __name(class extends Error {
  constructor(expected, actual) {
    super(`JWT algorithm mismatch: expected "${expected}", got "${actual}"`);
    this.name = "JwtAlgorithmMismatch";
  }
}, "JwtAlgorithmMismatch");
var JwtTokenInvalid = /* @__PURE__ */ __name(class extends Error {
  constructor(token) {
    super(`invalid JWT token: ${token}`);
    this.name = "JwtTokenInvalid";
  }
}, "JwtTokenInvalid");
var JwtTokenNotBefore = /* @__PURE__ */ __name(class extends Error {
  constructor(token) {
    super(`token (${token}) is being used before it's valid`);
    this.name = "JwtTokenNotBefore";
  }
}, "JwtTokenNotBefore");
var JwtTokenExpired = /* @__PURE__ */ __name(class extends Error {
  constructor(token) {
    super(`token (${token}) expired`);
    this.name = "JwtTokenExpired";
  }
}, "JwtTokenExpired");
var JwtTokenIssuedAt = /* @__PURE__ */ __name(class extends Error {
  constructor(currentTimestamp, iat) {
    super(
      `Invalid "iat" claim, must be a valid number lower than "${currentTimestamp}" (iat: "${iat}")`
    );
    this.name = "JwtTokenIssuedAt";
  }
}, "JwtTokenIssuedAt");
var JwtTokenIssuer = /* @__PURE__ */ __name(class extends Error {
  constructor(expected, iss) {
    super(`expected issuer "${expected}", got ${iss ? `"${iss}"` : "none"} `);
    this.name = "JwtTokenIssuer";
  }
}, "JwtTokenIssuer");
var JwtHeaderInvalid = /* @__PURE__ */ __name(class extends Error {
  constructor(header) {
    super(`jwt header is invalid: ${JSON.stringify(header)}`);
    this.name = "JwtHeaderInvalid";
  }
}, "JwtHeaderInvalid");
var JwtHeaderRequiresKid = /* @__PURE__ */ __name(class extends Error {
  constructor(header) {
    super(`required "kid" in jwt header: ${JSON.stringify(header)}`);
    this.name = "JwtHeaderRequiresKid";
  }
}, "JwtHeaderRequiresKid");
var JwtSymmetricAlgorithmNotAllowed = /* @__PURE__ */ __name(class extends Error {
  constructor(alg) {
    super(`symmetric algorithm "${alg}" is not allowed for JWK verification`);
    this.name = "JwtSymmetricAlgorithmNotAllowed";
  }
}, "JwtSymmetricAlgorithmNotAllowed");
var JwtAlgorithmNotAllowed = /* @__PURE__ */ __name(class extends Error {
  constructor(alg, allowedAlgorithms) {
    super(`algorithm "${alg}" is not in the allowed list: [${allowedAlgorithms.join(", ")}]`);
    this.name = "JwtAlgorithmNotAllowed";
  }
}, "JwtAlgorithmNotAllowed");
var JwtTokenSignatureMismatched = /* @__PURE__ */ __name(class extends Error {
  constructor(token) {
    super(`token(${token}) signature mismatched`);
    this.name = "JwtTokenSignatureMismatched";
  }
}, "JwtTokenSignatureMismatched");
var JwtPayloadRequiresAud = /* @__PURE__ */ __name(class extends Error {
  constructor(payload) {
    super(`required "aud" in jwt payload: ${JSON.stringify(payload)}`);
    this.name = "JwtPayloadRequiresAud";
  }
}, "JwtPayloadRequiresAud");
var JwtTokenAudience = /* @__PURE__ */ __name(class extends Error {
  constructor(expected, aud) {
    super(
      `expected audience "${Array.isArray(expected) ? expected.join(", ") : expected}", got "${aud}"`
    );
    this.name = "JwtTokenAudience";
  }
}, "JwtTokenAudience");
var CryptoKeyUsage = /* @__PURE__ */ ((CryptoKeyUsage2) => {
  CryptoKeyUsage2["Encrypt"] = "encrypt";
  CryptoKeyUsage2["Decrypt"] = "decrypt";
  CryptoKeyUsage2["Sign"] = "sign";
  CryptoKeyUsage2["Verify"] = "verify";
  CryptoKeyUsage2["DeriveKey"] = "deriveKey";
  CryptoKeyUsage2["DeriveBits"] = "deriveBits";
  CryptoKeyUsage2["WrapKey"] = "wrapKey";
  CryptoKeyUsage2["UnwrapKey"] = "unwrapKey";
  return CryptoKeyUsage2;
})(CryptoKeyUsage || {});

// ../../node_modules/hono/dist/utils/jwt/utf8.js
var utf8Encoder = new TextEncoder();
var utf8Decoder = new TextDecoder();

// ../../node_modules/hono/dist/utils/jwt/jws.js
async function signing(privateKey, alg, data) {
  const algorithm = getKeyAlgorithm(alg);
  const cryptoKey = await importPrivateKey(privateKey, algorithm);
  return await crypto.subtle.sign(algorithm, cryptoKey, data);
}
__name(signing, "signing");
async function verifying(publicKey, alg, signature, data) {
  const algorithm = getKeyAlgorithm(alg);
  const cryptoKey = await importPublicKey(publicKey, algorithm);
  return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
}
__name(verifying, "verifying");
function pemToBinary(pem) {
  return decodeBase64(pem.replace(/-+(BEGIN|END).*?-+/g, "").replace(/\s/g, ""));
}
__name(pemToBinary, "pemToBinary");
async function importPrivateKey(key, alg) {
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  }
  if (isCryptoKey(key)) {
    if (key.type !== "private" && key.type !== "secret") {
      throw new Error(
        `unexpected key type: CryptoKey.type is ${key.type}, expected private or secret`
      );
    }
    return key;
  }
  const usages = [CryptoKeyUsage.Sign];
  if (typeof key === "object") {
    return await crypto.subtle.importKey("jwk", key, alg, false, usages);
  }
  if (key.includes("PRIVATE")) {
    return await crypto.subtle.importKey("pkcs8", pemToBinary(key), alg, false, usages);
  }
  return await crypto.subtle.importKey("raw", utf8Encoder.encode(key), alg, false, usages);
}
__name(importPrivateKey, "importPrivateKey");
async function importPublicKey(key, alg) {
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  }
  if (isCryptoKey(key)) {
    if (key.type === "public" || key.type === "secret") {
      return key;
    }
    key = await exportPublicJwkFrom(key);
  }
  if (typeof key === "string" && key.includes("PRIVATE")) {
    const privateKey = await crypto.subtle.importKey("pkcs8", pemToBinary(key), alg, true, [
      CryptoKeyUsage.Sign
    ]);
    key = await exportPublicJwkFrom(privateKey);
  }
  const usages = [CryptoKeyUsage.Verify];
  if (typeof key === "object") {
    return await crypto.subtle.importKey("jwk", key, alg, false, usages);
  }
  if (key.includes("PUBLIC")) {
    return await crypto.subtle.importKey("spki", pemToBinary(key), alg, false, usages);
  }
  return await crypto.subtle.importKey("raw", utf8Encoder.encode(key), alg, false, usages);
}
__name(importPublicKey, "importPublicKey");
async function exportPublicJwkFrom(privateKey) {
  if (privateKey.type !== "private") {
    throw new Error(`unexpected key type: ${privateKey.type}`);
  }
  if (!privateKey.extractable) {
    throw new Error("unexpected private key is unextractable");
  }
  const jwk = await crypto.subtle.exportKey("jwk", privateKey);
  const { kty } = jwk;
  const { alg, e, n } = jwk;
  const { crv, x, y } = jwk;
  return { kty, alg, e, n, crv, x, y, key_ops: [CryptoKeyUsage.Verify] };
}
__name(exportPublicJwkFrom, "exportPublicJwkFrom");
function getKeyAlgorithm(name) {
  switch (name) {
    case "HS256":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-256"
        }
      };
    case "HS384":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-384"
        }
      };
    case "HS512":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-512"
        }
      };
    case "RS256":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-256"
        }
      };
    case "RS384":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-384"
        }
      };
    case "RS512":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-512"
        }
      };
    case "PS256":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-256"
        },
        saltLength: 32
        // 256 >> 3
      };
    case "PS384":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-384"
        },
        saltLength: 48
        // 384 >> 3
      };
    case "PS512":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-512"
        },
        saltLength: 64
        // 512 >> 3,
      };
    case "ES256":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-256"
        },
        namedCurve: "P-256"
      };
    case "ES384":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-384"
        },
        namedCurve: "P-384"
      };
    case "ES512":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-512"
        },
        namedCurve: "P-521"
      };
    case "EdDSA":
      return {
        name: "Ed25519",
        namedCurve: "Ed25519"
      };
    default:
      throw new JwtAlgorithmNotImplemented(name);
  }
}
__name(getKeyAlgorithm, "getKeyAlgorithm");
function isCryptoKey(key) {
  const runtime = getRuntimeKey();
  if (runtime === "node" && !!crypto.webcrypto) {
    return key instanceof crypto.webcrypto.CryptoKey;
  }
  return key instanceof CryptoKey;
}
__name(isCryptoKey, "isCryptoKey");

// ../../node_modules/hono/dist/utils/jwt/jwt.js
var encodeJwtPart = /* @__PURE__ */ __name((part) => encodeBase64Url(utf8Encoder.encode(JSON.stringify(part)).buffer).replace(/=/g, ""), "encodeJwtPart");
var encodeSignaturePart = /* @__PURE__ */ __name((buf) => encodeBase64Url(buf).replace(/=/g, ""), "encodeSignaturePart");
var decodeJwtPart = /* @__PURE__ */ __name((part) => JSON.parse(utf8Decoder.decode(decodeBase64Url(part))), "decodeJwtPart");
function isTokenHeader(obj) {
  if (typeof obj === "object" && obj !== null) {
    const objWithAlg = obj;
    return "alg" in objWithAlg && Object.values(AlgorithmTypes).includes(objWithAlg.alg) && (!("typ" in objWithAlg) || objWithAlg.typ === "JWT");
  }
  return false;
}
__name(isTokenHeader, "isTokenHeader");
var sign = /* @__PURE__ */ __name(async (payload, privateKey, alg = "HS256") => {
  const encodedPayload = encodeJwtPart(payload);
  let encodedHeader;
  if (typeof privateKey === "object" && "alg" in privateKey) {
    alg = privateKey.alg;
    encodedHeader = encodeJwtPart({ alg, typ: "JWT", kid: privateKey.kid });
  } else {
    encodedHeader = encodeJwtPart({ alg, typ: "JWT" });
  }
  const partialToken = `${encodedHeader}.${encodedPayload}`;
  const signaturePart = await signing(privateKey, alg, utf8Encoder.encode(partialToken));
  const signature = encodeSignaturePart(signaturePart);
  return `${partialToken}.${signature}`;
}, "sign");
var verify = /* @__PURE__ */ __name(async (token, publicKey, algOrOptions) => {
  if (!algOrOptions) {
    throw new JwtAlgorithmRequired();
  }
  const {
    alg,
    iss,
    nbf = true,
    exp = true,
    iat = true,
    aud
  } = typeof algOrOptions === "string" ? { alg: algOrOptions } : algOrOptions;
  if (!alg) {
    throw new JwtAlgorithmRequired();
  }
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    throw new JwtTokenInvalid(token);
  }
  const { header, payload } = decode(token);
  if (!isTokenHeader(header)) {
    throw new JwtHeaderInvalid(header);
  }
  if (header.alg !== alg) {
    throw new JwtAlgorithmMismatch(alg, header.alg);
  }
  const now = Math.floor(Date.now() / 1e3);
  if (nbf && payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number" || !Number.isFinite(payload.nbf) || payload.nbf > now) {
      throw new JwtTokenNotBefore(token);
    }
  }
  if (exp && payload.exp !== void 0) {
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp <= now) {
      throw new JwtTokenExpired(token);
    }
  }
  if (iat && payload.iat !== void 0) {
    if (typeof payload.iat !== "number" || !Number.isFinite(payload.iat) || now < payload.iat) {
      throw new JwtTokenIssuedAt(now, payload.iat);
    }
  }
  if (iss) {
    if (!payload.iss) {
      throw new JwtTokenIssuer(iss, null);
    }
    if (typeof iss === "string" && payload.iss !== iss) {
      throw new JwtTokenIssuer(iss, payload.iss);
    }
    if (iss instanceof RegExp && !iss.test(payload.iss)) {
      throw new JwtTokenIssuer(iss, payload.iss);
    }
  }
  if (aud) {
    if (!payload.aud) {
      throw new JwtPayloadRequiresAud(payload);
    }
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const matched = audiences.some(
      (payloadAud) => aud instanceof RegExp ? aud.test(payloadAud) : typeof aud === "string" ? payloadAud === aud : Array.isArray(aud) && aud.includes(payloadAud)
    );
    if (!matched) {
      throw new JwtTokenAudience(aud, payload.aud);
    }
  }
  const headerPayload = token.substring(0, token.lastIndexOf("."));
  const verified = await verifying(
    publicKey,
    alg,
    decodeBase64Url(tokenParts[2]),
    utf8Encoder.encode(headerPayload)
  );
  if (!verified) {
    throw new JwtTokenSignatureMismatched(token);
  }
  return payload;
}, "verify");
var symmetricAlgorithms = [
  AlgorithmTypes.HS256,
  AlgorithmTypes.HS384,
  AlgorithmTypes.HS512
];
var verifyWithJwks = /* @__PURE__ */ __name(async (token, options, init) => {
  const verifyOpts = options.verification || {};
  const header = decodeHeader(token);
  if (!isTokenHeader(header)) {
    throw new JwtHeaderInvalid(header);
  }
  if (!header.kid) {
    throw new JwtHeaderRequiresKid(header);
  }
  if (symmetricAlgorithms.includes(header.alg)) {
    throw new JwtSymmetricAlgorithmNotAllowed(header.alg);
  }
  if (!options.allowedAlgorithms.includes(header.alg)) {
    throw new JwtAlgorithmNotAllowed(header.alg, options.allowedAlgorithms);
  }
  let verifyKeys = options.keys ? [...options.keys] : void 0;
  if (options.jwks_uri) {
    const response = await fetch(options.jwks_uri, init);
    if (!response.ok) {
      throw new Error(`failed to fetch JWKS from ${options.jwks_uri}`);
    }
    const data = await response.json();
    if (!data.keys) {
      throw new Error('invalid JWKS response. "keys" field is missing');
    }
    if (!Array.isArray(data.keys)) {
      throw new Error('invalid JWKS response. "keys" field is not an array');
    }
    verifyKeys ??= [];
    verifyKeys.push(...data.keys);
  } else if (!verifyKeys) {
    throw new Error('verifyWithJwks requires options for either "keys" or "jwks_uri" or both');
  }
  const matchingKey = verifyKeys.find((key) => key.kid === header.kid);
  if (!matchingKey) {
    throw new JwtTokenInvalid(token);
  }
  if (matchingKey.alg && matchingKey.alg !== header.alg) {
    throw new JwtAlgorithmMismatch(matchingKey.alg, header.alg);
  }
  return await verify(token, matchingKey, {
    alg: header.alg,
    ...verifyOpts
  });
}, "verifyWithJwks");
var decode = /* @__PURE__ */ __name((token) => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new JwtTokenInvalid(token);
  }
  try {
    const header = decodeJwtPart(parts[0]);
    const payload = decodeJwtPart(parts[1]);
    return {
      header,
      payload
    };
  } catch {
    throw new JwtTokenInvalid(token);
  }
}, "decode");
var decodeHeader = /* @__PURE__ */ __name((token) => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new JwtTokenInvalid(token);
  }
  try {
    return decodeJwtPart(parts[0]);
  } catch {
    throw new JwtTokenInvalid(token);
  }
}, "decodeHeader");

// ../../node_modules/hono/dist/utils/jwt/index.js
var Jwt = { sign, verify, decode, verifyWithJwks };

// ../../node_modules/hono/dist/middleware/jwt/jwt.js
var verifyWithJwks2 = Jwt.verifyWithJwks;
var verify2 = Jwt.verify;
var decode2 = Jwt.decode;
var sign2 = Jwt.sign;

// src/utils/jwt.ts
var ALGORITHM = "HS256";
async function generateAccessToken(env, payload) {
  const expiresIn = parseInt(env.JWT_EXPIRES_IN || "28800", 10);
  const now = Math.floor(Date.now() / 1e3);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };
  return await sign2(tokenPayload, env.JWT_SECRET || "default-secret", ALGORITHM);
}
__name(generateAccessToken, "generateAccessToken");
async function generateRefreshToken(env, userId, deviceId) {
  const expiresIn = parseInt(env.REFRESH_EXPIRES_IN || "2592000", 10);
  const now = Math.floor(Date.now() / 1e3);
  const payload = {
    userId,
    deviceId,
    type: "refresh",
    iat: now,
    exp: now + expiresIn
  };
  return await sign2(payload, env.JWT_SECRET || "default-secret", ALGORITHM);
}
__name(generateRefreshToken, "generateRefreshToken");
async function verifyToken(token, secret) {
  try {
    const payload = await verify2(token, secret, ALGORITHM);
    return payload;
  } catch {
    return null;
  }
}
__name(verifyToken, "verifyToken");
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
function validatePasswordPolicy(password) {
  if (password.length < 8) {
    return { valid: false, error: "M\u1EADt kh\u1EA9u c\u1EA7n \xEDt nh\u1EA5t 8 k\xFD t\u1EF1" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "M\u1EADt kh\u1EA9u c\u1EA7n \xEDt nh\u1EA5t 1 ch\u1EEF hoa" };
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: "M\u1EADt kh\u1EA9u c\u1EA7n \xEDt nh\u1EA5t 1 s\u1ED1" };
  }
  return { valid: true };
}
__name(validatePasswordPolicy, "validatePasswordPolicy");

// src/utils/audit.ts
var CRITICAL_EVENTS = [
  "reward_approved",
  "reward_rejected",
  "role_changed",
  "login_failed",
  "password_changed"
];
async function writeAuditLog(env, params) {
  const payload = {
    action: params.action,
    userId: params.userId,
    userName: params.userName,
    oldValue: params.oldValue ?? null,
    newValue: params.newValue ?? null,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (params.isCritical || CRITICAL_EVENTS.includes(params.action)) {
    try {
      await env.DB.prepare(`
        INSERT INTO audit_critical (id, company_id, entity_type, entity_id, payload, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        params.companyId,
        params.entityType,
        params.entityId,
        JSON.stringify(payload),
        Date.now()
      ).run();
    } catch (err) {
      console.error("Failed to write audit_critical:", err);
    }
  }
  const key = `audit:${params.companyId}:${params.entityType}:${params.entityId}:${Date.now()}`;
  try {
    await env.AUDIT_KV.put(key, JSON.stringify(payload), { expirationTtl: 31536e3 });
  } catch (err) {
    console.error("Failed to write audit KV:", err);
  }
}
__name(writeAuditLog, "writeAuditLog");

// src/routes/auth.ts
var authRoutes = new Hono2();
authRoutes.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ success: false, error: "Email v\xE0 m\u1EADt kh\u1EA9u l\xE0 b\u1EAFt bu\u1ED9c" }, 400);
    }
    const userResult = await c.env.DB.prepare(
      "SELECT * FROM users WHERE email = ? AND is_active = 1"
    ).bind(email).first();
    if (!userResult) {
      await writeAuditLog(c.env, {
        companyId: "unknown",
        entityType: "security",
        entityId: email,
        action: "login_failed",
        userId: "unknown",
        userName: email,
        isCritical: true
      });
      return c.json({ success: false, error: "Email ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng" }, 401);
    }
    const passwordValid = await verifyPasswordHash(password, userResult.password_hash);
    if (!passwordValid) {
      await writeAuditLog(c.env, {
        companyId: userResult.company_id,
        entityType: "security",
        entityId: userResult.id,
        action: "login_failed",
        userId: userResult.id,
        userName: userResult.name,
        isCritical: true
      });
      return c.json({ success: false, error: "Email ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng" }, 401);
    }
    const deviceId = c.req.header("X-Device-ID") || crypto.randomUUID();
    const accessToken = await generateAccessToken(c.env, {
      userId: userResult.id,
      companyId: userResult.company_id,
      role: userResult.role,
      deviceId
    });
    const refreshToken = await generateRefreshToken(c.env, userResult.id, deviceId);
    const rtKey = `rt:${userResult.id}:${deviceId}`;
    await c.env.CACHE.put(rtKey, refreshToken, { expirationTtl: 2592e3 });
    await writeAuditLog(c.env, {
      companyId: userResult.company_id,
      entityType: "security",
      entityId: userResult.id,
      action: "login_success",
      userId: userResult.id,
      userName: userResult.name,
      isCritical: true
    });
    return c.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: userResult.id,
          email: userResult.email,
          name: userResult.name,
          role: userResult.role,
          companyId: userResult.company_id
        }
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
authRoutes.post("/refresh", async (c) => {
  try {
    const { refreshToken } = await c.req.json();
    if (!refreshToken) {
      return c.json({ success: false, error: "Refresh token l\xE0 b\u1EAFt bu\u1ED9c" }, 400);
    }
    const payload = await verifyToken(refreshToken, c.env.JWT_SECRET || "default-secret");
    if (!payload) {
      return c.json({ success: false, error: "Refresh token kh\xF4ng h\u1EE3p l\u1EC7" }, 401);
    }
    const rtKey = `rt:${payload.userId}:${payload.deviceId}`;
    const storedToken = await c.env.CACHE.get(rtKey);
    if (storedToken !== refreshToken) {
      return c.json({ success: false, error: "Refresh token \u0111\xE3 b\u1ECB thu h\u1ED3i" }, 401);
    }
    const userResult = await c.env.DB.prepare(
      "SELECT * FROM users WHERE id = ? AND is_active = 1"
    ).bind(payload.userId).first();
    if (!userResult) {
      return c.json({ success: false, error: "Ng\u01B0\u1EDDi d\xF9ng kh\xF4ng t\u1ED3n t\u1EA1i" }, 401);
    }
    const accessToken = await generateAccessToken(c.env, {
      userId: userResult.id,
      companyId: userResult.company_id,
      role: userResult.role,
      deviceId: payload.deviceId
    });
    return c.json({
      success: true,
      data: {
        accessToken
      }
    });
  } catch (err) {
    console.error("Refresh error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
authRoutes.post("/logout", async (c) => {
  try {
    const { userId, deviceId } = await c.req.json().catch(() => ({}));
    if (userId && deviceId) {
      const rtKey = `rt:${userId}:${deviceId}`;
      await c.env.CACHE.delete(rtKey);
    }
    return c.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
authRoutes.post("/register", async (c) => {
  try {
    const { email, password, name, companyName } = await c.req.json();
    if (!email || !password || !name) {
      return c.json({ success: false, error: "Email, m\u1EADt kh\u1EA9u v\xE0 t\xEAn l\xE0 b\u1EAFt bu\u1ED9c" }, 400);
    }
    const passwordCheck = validatePasswordPolicy(password);
    if (!passwordCheck.valid) {
      return c.json({ success: false, error: passwordCheck.error }, 400);
    }
    const existing = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email).first();
    if (existing) {
      return c.json({ success: false, error: "Email \u0111\xE3 \u0111\u01B0\u1EE3c s\u1EED d\u1EE5ng" }, 409);
    }
    const companyId = crypto.randomUUID();
    const now = Date.now();
    await c.env.DB.prepare(`
      INSERT INTO companies (id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).bind(companyId, companyName || "My Company", now, now).run();
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO users (id, company_id, email, password_hash, name, role, created_at)
      VALUES (?, ?, ?, ?, ?, 'admin', ?)
    `).bind(userId, companyId, email, passwordHash, name, now).run();
    const deviceId = crypto.randomUUID();
    const accessToken = await generateAccessToken(c.env, {
      userId,
      companyId,
      role: "admin",
      deviceId
    });
    const refreshToken = await generateRefreshToken(c.env, userId, deviceId);
    const rtKey = `rt:${userId}:${deviceId}`;
    await c.env.CACHE.put(rtKey, refreshToken, { expirationTtl: 2592e3 });
    return c.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: userId,
          email,
          name,
          role: "admin",
          companyId
        }
      }
    }, 201);
  } catch (err) {
    console.error("Register error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
async function verifyPasswordHash(password, hash2) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedPassword = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashedPassword === hash2;
}
__name(verifyPasswordHash, "verifyPasswordHash");

// src/middleware/auth.ts
var authMiddleware = /* @__PURE__ */ __name(() => {
  return async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ success: false, error: "Unauthorized - No token provided" }, 401);
    }
    const token = authHeader.substring(7);
    try {
      const secret = c.env.JWT_SECRET || "default-secret-change-me";
      const payload = await verify2(token, secret);
      if (payload.exp && payload.exp < Date.now() / 1e3) {
        return c.json({ success: false, error: "Token expired" }, 401);
      }
      c.set("userId", payload.userId);
      c.set("companyId", payload.companyId);
      c.set("userRole", payload.role);
      c.set("deviceId", payload.deviceId);
      await next();
    } catch (err) {
      console.error("Auth error:", err);
      return c.json({ success: false, error: "Invalid token" }, 401);
    }
  };
}, "authMiddleware");
function getUser(c) {
  return {
    userId: c.get("userId"),
    companyId: c.get("companyId"),
    role: c.get("userRole"),
    deviceId: c.get("deviceId")
  };
}
__name(getUser, "getUser");

// src/routes/company.ts
var companyRoutes = new Hono2();
companyRoutes.get("/", async (c) => {
  try {
    const { companyId } = getUser(c);
    const company = await c.env.DB.prepare(
      "SELECT * FROM companies WHERE id = ?"
    ).bind(companyId).first();
    if (!company) {
      return c.json({ success: false, error: "C\xF4ng ty kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    return c.json({ success: true, data: company });
  } catch (err) {
    console.error("Get company error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
companyRoutes.put("/", async (c) => {
  try {
    const { companyId } = getUser(c);
    const updates = await c.req.json();
    const now = Date.now();
    const fields = [];
    const values = [];
    if (updates.name !== void 0) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.mission !== void 0) {
      fields.push("mission = ?");
      values.push(updates.mission);
    }
    if (updates.vision !== void 0) {
      fields.push("vision = ?");
      values.push(updates.vision);
    }
    if (updates.core_values !== void 0) {
      fields.push("core_values = ?");
      values.push(updates.core_values);
    }
    if (updates.reward_policy !== void 0) {
      fields.push("reward_policy = ?");
      values.push(updates.reward_policy);
    }
    fields.push("updated_at = ?");
    values.push(now);
    values.push(companyId);
    await c.env.DB.prepare(`
      UPDATE companies SET ${fields.join(", ")} WHERE id = ?
    `).bind(...values).run();
    const updated = await c.env.DB.prepare(
      "SELECT * FROM companies WHERE id = ?"
    ).bind(companyId).first();
    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update company error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});

// src/middleware/roles.ts
function requireRole(...allowedRoles) {
  return async (c, next) => {
    const userRole = c.get("userRole");
    const roles = allowedRoles;
    if (!roles.includes(userRole)) {
      return c.json({ success: false, error: "Forbidden - Insufficient permissions" }, 403);
    }
    await next();
  };
}
__name(requireRole, "requireRole");
function requireNotFinance() {
  return async (c, next) => {
    const userRole = c.get("userRole");
    if (userRole === "finance") {
      return c.json({ success: false, error: "Forbidden - Finance role cannot access this resource" }, 403);
    }
    await next();
  };
}
__name(requireNotFinance, "requireNotFinance");
function requireAdminOrManager() {
  return requireRole("admin", "manager");
}
__name(requireAdminOrManager, "requireAdminOrManager");
function requireAdmin() {
  return requireRole("admin");
}
__name(requireAdmin, "requireAdmin");

// src/routes/users.ts
var userRoutes = new Hono2();
userRoutes.get("/", requireAdminOrManager(), async (c) => {
  try {
    const { companyId } = getUser(c);
    const users = await c.env.DB.prepare(
      `SELECT id, company_id, email, name, role, department_id, is_active, created_at
       FROM users WHERE company_id = ? ORDER BY created_at DESC`
    ).bind(companyId).all();
    return c.json({ success: true, data: users.results });
  } catch (err) {
    console.error("Get users error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
userRoutes.post("/", requireAdmin(), async (c) => {
  try {
    const { companyId } = getUser(c);
    const { email, password, name, role, department_id } = await c.req.json();
    if (!email || !password || !name || !role) {
      return c.json({ success: false, error: "Th\xF4ng tin kh\xF4ng \u0111\u1EA7y \u0111\u1EE7" }, 400);
    }
    const passwordCheck = validatePasswordPolicy(password);
    if (!passwordCheck.valid) {
      return c.json({ success: false, error: passwordCheck.error }, 400);
    }
    const existing = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email).first();
    if (existing) {
      return c.json({ success: false, error: "Email \u0111\xE3 \u0111\u01B0\u1EE3c s\u1EED d\u1EE5ng" }, 409);
    }
    if (!["admin", "manager", "staff", "finance"].includes(role)) {
      return c.json({ success: false, error: "Vai tr\xF2 kh\xF4ng h\u1EE3p l\u1EC7" }, 400);
    }
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const now = Date.now();
    await c.env.DB.prepare(`
      INSERT INTO users (id, company_id, email, password_hash, name, role, department_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(userId, companyId, email, passwordHash, name, role, department_id || null, now).run();
    await writeAuditLog(c.env, {
      companyId,
      entityType: "user",
      entityId: userId,
      action: "user_created",
      userId: getUser(c).userId,
      userName: getUser(c).userId,
      newValue: { email, name, role }
    });
    return c.json({
      success: true,
      data: {
        id: userId,
        company_id: companyId,
        email,
        name,
        role,
        department_id,
        created_at: now
      }
    }, 201);
  } catch (err) {
    console.error("Create user error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
userRoutes.put("/:id", requireAdmin(), async (c) => {
  try {
    const { companyId, userId: currentUserId } = getUser(c);
    const targetUserId = c.req.param("id");
    const updates = await c.req.json();
    const existing = await c.env.DB.prepare(
      "SELECT * FROM users WHERE id = ? AND company_id = ?"
    ).bind(targetUserId, companyId).first();
    if (!existing) {
      return c.json({ success: false, error: "Ng\u01B0\u1EDDi d\xF9ng kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    const fields = [];
    const values = [];
    if (updates.name !== void 0) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.role !== void 0) {
      if (!["admin", "manager", "staff", "finance"].includes(updates.role)) {
        return c.json({ success: false, error: "Vai tr\xF2 kh\xF4ng h\u1EE3p l\u1EC7" }, 400);
      }
      fields.push("role = ?");
      values.push(updates.role);
    }
    if (updates.department_id !== void 0) {
      fields.push("department_id = ?");
      values.push(updates.department_id || null);
    }
    if (updates.is_active !== void 0) {
      fields.push("is_active = ?");
      values.push(updates.is_active ? 1 : 0);
    }
    if (updates.password !== void 0) {
      const passwordCheck = validatePasswordPolicy(updates.password);
      if (!passwordCheck.valid) {
        return c.json({ success: false, error: passwordCheck.error }, 400);
      }
      const passwordHash = await hashPassword(updates.password);
      fields.push("password_hash = ?");
      values.push(passwordHash);
    }
    if (fields.length === 0) {
      return c.json({ success: false, error: "Kh\xF4ng c\xF3 g\xEC \u0111\u1EC3 c\u1EADp nh\u1EADt" }, 400);
    }
    values.push(targetUserId);
    await c.env.DB.prepare(`
      UPDATE users SET ${fields.join(", ")} WHERE id = ?
    `).bind(...values).run();
    await writeAuditLog(c.env, {
      companyId,
      entityType: "user",
      entityId: targetUserId,
      action: updates.role !== existing.role ? "role_changed" : "user_updated",
      userId: currentUserId,
      userName: currentUserId,
      oldValue: { role: existing.role },
      newValue: { role: updates.role },
      isCritical: updates.role !== existing.role
    });
    const updated = await c.env.DB.prepare(
      `SELECT id, company_id, email, name, role, department_id, is_active, created_at
       FROM users WHERE id = ?`
    ).bind(targetUserId).first();
    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update user error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});

// src/routes/departments.ts
var departmentRoutes = new Hono2();
departmentRoutes.get("/", async (c) => {
  try {
    const { companyId } = getUser(c);
    const departments = await c.env.DB.prepare(
      `SELECT d.*, u.name as manager_name
       FROM departments d
       LEFT JOIN users u ON d.manager_id = u.id
       WHERE d.company_id = ?
       ORDER BY d.name`
    ).bind(companyId).all();
    return c.json({ success: true, data: departments.results });
  } catch (err) {
    console.error("Get departments error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
departmentRoutes.post("/", requireAdmin(), async (c) => {
  try {
    const { companyId } = getUser(c);
    const { name, manager_id } = await c.req.json();
    if (!name) {
      return c.json({ success: false, error: "T\xEAn ph\xF2ng ban l\xE0 b\u1EAFt bu\u1ED9c" }, 400);
    }
    const deptId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO departments (id, company_id, name, manager_id)
      VALUES (?, ?, ?, ?)
    `).bind(deptId, companyId, name, manager_id || null).run();
    const dept = await c.env.DB.prepare(
      "SELECT * FROM departments WHERE id = ?"
    ).bind(deptId).first();
    return c.json({ success: true, data: dept }, 201);
  } catch (err) {
    console.error("Create department error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
departmentRoutes.put("/:id", requireAdmin(), async (c) => {
  try {
    const { companyId } = getUser(c);
    const deptId = c.req.param("id");
    const { name, manager_id } = await c.req.json();
    const existing = await c.env.DB.prepare(
      "SELECT * FROM departments WHERE id = ? AND company_id = ?"
    ).bind(deptId, companyId).first();
    if (!existing) {
      return c.json({ success: false, error: "Ph\xF2ng ban kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    const fields = [];
    const values = [];
    if (name !== void 0) {
      fields.push("name = ?");
      values.push(name);
    }
    if (manager_id !== void 0) {
      fields.push("manager_id = ?");
      values.push(manager_id || null);
    }
    if (fields.length === 0) {
      return c.json({ success: false, error: "Kh\xF4ng c\xF3 g\xEC \u0111\u1EC3 c\u1EADp nh\u1EADt" }, 400);
    }
    values.push(deptId);
    await c.env.DB.prepare(`
      UPDATE departments SET ${fields.join(", ")} WHERE id = ?
    `).bind(...values).run();
    const updated = await c.env.DB.prepare(
      "SELECT * FROM departments WHERE id = ?"
    ).bind(deptId).first();
    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update department error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
departmentRoutes.put("/:id/manager", requireAdmin(), async (c) => {
  try {
    const { companyId, userId: currentUserId } = getUser(c);
    const deptId = c.req.param("id");
    const { manager_id } = await c.req.json();
    const existing = await c.env.DB.prepare(
      "SELECT * FROM departments WHERE id = ? AND company_id = ?"
    ).bind(deptId, companyId).first();
    if (!existing) {
      return c.json({ success: false, error: "Ph\xF2ng ban kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    await c.env.DB.prepare(`
      UPDATE departments SET manager_id = ? WHERE id = ?
    `).bind(manager_id || null, deptId).run();
    const updated = await c.env.DB.prepare(
      "SELECT * FROM departments WHERE id = ?"
    ).bind(deptId).first();
    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error("Reassign manager error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});

// src/utils/progress.ts
function calculateGoalProgress(startWeek, endWeek, trackingData, currentWeek, currentYear) {
  const totalWeeks = endWeek - startWeek + 1;
  let doneWeeks = 0;
  for (const tracking of trackingData) {
    if (tracking.year === currentYear && tracking.week_number >= startWeek && tracking.week_number <= endWeek && tracking.status === "done") {
      doneWeeks++;
    }
  }
  let elapsedWeeks = 0;
  if (currentWeek >= startWeek) {
    elapsedWeeks = Math.min(currentWeek - startWeek, totalWeeks);
  }
  const actualProgress = totalWeeks > 0 ? doneWeeks / totalWeeks : 0;
  const expectedProgress = totalWeeks > 0 ? elapsedWeeks / totalWeeks : 0;
  let healthScore = 0;
  if (expectedProgress > 0) {
    healthScore = actualProgress / expectedProgress;
  } else if (actualProgress > 0) {
    healthScore = 1;
  }
  return {
    actualProgress,
    expectedProgress,
    healthScore,
    doneWeeks,
    totalWeeks,
    elapsedWeeks
  };
}
__name(calculateGoalProgress, "calculateGoalProgress");
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
}
__name(getISOWeek, "getISOWeek");
function getCurrentWeek() {
  return getISOWeek(/* @__PURE__ */ new Date());
}
__name(getCurrentWeek, "getCurrentWeek");
function getCurrentYear() {
  return (/* @__PURE__ */ new Date()).getFullYear();
}
__name(getCurrentYear, "getCurrentYear");
function getQuarterWeeks(quarter) {
  switch (quarter) {
    case 1:
      return { startWeek: 1, endWeek: 13 };
    case 2:
      return { startWeek: 14, endWeek: 26 };
    case 3:
      return { startWeek: 27, endWeek: 39 };
    case 4:
      return { startWeek: 40, endWeek: 52 };
  }
}
__name(getQuarterWeeks, "getQuarterWeeks");
function has53Weeks(year) {
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  return jan1.getDay() === 4 || dec31.getDay() === 4;
}
__name(has53Weeks, "has53Weeks");
function parseMentions(content) {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match2;
  while ((match2 = mentionRegex.exec(content)) !== null) {
    mentions.push(match2[1]);
  }
  return mentions;
}
__name(parseMentions, "parseMentions");

// src/routes/goals.ts
var goalRoutes = new Hono2();
goalRoutes.get("/", async (c) => {
  try {
    const { companyId, role } = getUser(c);
    const { year, category, dept, status, include_deleted } = c.req.query();
    if (role === "finance") {
      return c.json({ success: false, error: "Finance kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp m\u1EE5c ti\xEAu" }, 403);
    }
    let query = `
      SELECT g.*, d.name as department_name, u.name as creator_name
      FROM goals g
      LEFT JOIN departments d ON g.owner_dept_id = d.id
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.company_id = ?
    `;
    const params = [companyId];
    if (!include_deleted) {
      query += " AND g.deleted_at IS NULL";
    }
    if (year) {
      query += " AND g.year = ?";
      params.push(parseInt(year));
    }
    if (category) {
      query += " AND g.category = ?";
      params.push(category);
    }
    if (dept) {
      query += " AND g.owner_dept_id = ?";
      params.push(dept);
    }
    if (status) {
      query += " AND g.status = ?";
      params.push(status);
    }
    query += " ORDER BY g.created_at DESC";
    const goals = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: goals.results });
  } catch (err) {
    console.error("Get goals error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
goalRoutes.get("/:id", async (c) => {
  try {
    const { companyId, role } = getUser(c);
    const goalId = c.req.param("id");
    if (role === "finance") {
      return c.json({ success: false, error: "Finance kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp m\u1EE5c ti\xEAu" }, 403);
    }
    const goal = await c.env.DB.prepare(`
      SELECT g.*, d.name as department_name, u.name as creator_name
      FROM goals g
      LEFT JOIN departments d ON g.owner_dept_id = d.id
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.id = ? AND g.company_id = ?
    `).bind(goalId, companyId).first();
    if (!goal) {
      return c.json({ success: false, error: "M\u1EE5c ti\xEAu kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    const strategies = await c.env.DB.prepare(
      "SELECT * FROM strategies WHERE goal_id = ? ORDER BY sort_order"
    ).bind(goalId).all();
    const rewardApprovals = await c.env.DB.prepare(
      "SELECT * FROM reward_approvals WHERE goal_id = ? ORDER BY requested_at DESC"
    ).bind(goalId).all();
    return c.json({
      success: true,
      data: {
        ...goal,
        strategies: strategies.results,
        rewardApprovals: rewardApprovals.results
      }
    });
  } catch (err) {
    console.error("Get goal error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
goalRoutes.post("/", requireAdminOrManager(), requireNotFinance(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const data = await c.req.json();
    if (!data.title || !data.category || !data.year) {
      return c.json({ success: false, error: "Th\xF4ng tin kh\xF4ng \u0111\u1EA7y \u0111\u1EE7" }, 400);
    }
    const validCategories = ["tai_chinh", "san_pham", "khach_hang", "thuong_hieu", "he_thong", "doi_ngu"];
    if (!validCategories.includes(data.category)) {
      return c.json({ success: false, error: "Danh m\u1EE5c kh\xF4ng h\u1EE3p l\u1EC7" }, 400);
    }
    let startWeek = data.start_week || 1;
    let endWeek = data.end_week || 52;
    if (data.quarter) {
      const quarterWeeks = getQuarterWeeks(data.quarter);
      startWeek = quarterWeeks.startWeek;
      endWeek = quarterWeeks.endWeek;
      if (data.quarter === 4 && has53Weeks(data.year)) {
        endWeek = 53;
      }
    }
    if (startWeek < 1 || startWeek > 53 || endWeek < 1 || endWeek > 53) {
      return c.json({ success: false, error: "Tu\u1EA7n ph\u1EA3i t\u1EEB 1 \u0111\u1EBFn 53" }, 400);
    }
    if (endWeek < startWeek) {
      return c.json({ success: false, error: "Tu\u1EA7n k\u1EBFt th\xFAc ph\u1EA3i l\u1EDBn h\u01A1n ho\u1EB7c b\u1EB1ng tu\u1EA7n b\u1EAFt \u0111\u1EA7u" }, 400);
    }
    const weight = data.weight || 10;
    const existingWeights = await c.env.DB.prepare(`
      SELECT SUM(weight) as total FROM goals
      WHERE company_id = ? AND category = ? AND year = ? AND status = 'active' AND deleted_at IS NULL
    `).bind(companyId, data.category, data.year).first();
    const currentTotal = existingWeights?.total || 0;
    const newTotal = currentTotal + weight;
    let weightWarning = null;
    if (newTotal > 100) {
      weightWarning = `\u26A0\uFE0F Tr\u1ECDng s\u1ED1 tr\u1EE5 c\u1ED9t s\u1EBD l\xE0 ${newTotal}% (v\u01B0\u1EE3t qu\xE1 100%). Khuy\u1EBFn ngh\u1ECB \u0111i\u1EC1u ch\u1EC9nh.`;
    } else if (newTotal < 100) {
      weightWarning = `\u26A0\uFE0F Tr\u1ECDng s\u1ED1 tr\u1EE5 c\u1ED9t s\u1EBD l\xE0 ${newTotal}% (thi\u1EBFu ${100 - newTotal}%).`;
    }
    const goalId = crypto.randomUUID();
    const now = Date.now();
    await c.env.DB.prepare(`
      INSERT INTO goals (
        id, company_id, category, year, quarter, start_week, end_week,
        title, description, measure, target_value, current_value, unit,
        deadline, weight, owner_dept_id, collab_dept_ids, reward, reward_value,
        status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      goalId,
      companyId,
      data.category,
      data.year,
      data.quarter || null,
      startWeek,
      endWeek,
      data.title,
      data.description || null,
      data.measure || null,
      data.target_value || null,
      data.current_value || null,
      data.unit || null,
      data.deadline || null,
      weight,
      data.owner_dept_id || null,
      JSON.stringify(data.collab_dept_ids || []),
      data.reward || null,
      data.reward_value || null,
      data.status || "draft",
      userId,
      now,
      now
    ).run();
    if (data.strategies && Array.isArray(data.strategies)) {
      for (let i = 0; i < data.strategies.length; i++) {
        const strategy = data.strategies[i];
        const strategyId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO strategies (id, goal_id, title, description, sort_order)
          VALUES (?, ?, ?, ?, ?)
        `).bind(strategyId, goalId, strategy.title, strategy.description || null, i).run();
      }
    }
    await writeAuditLog(c.env, {
      companyId,
      entityType: "goal",
      entityId: goalId,
      action: "goal_created",
      userId,
      userName: userId,
      newValue: { title: data.title, category: data.category }
    });
    const goal = await c.env.DB.prepare("SELECT * FROM goals WHERE id = ?").bind(goalId).first();
    return c.json({ success: true, data: goal, weightWarning }, 201);
  } catch (err) {
    console.error("Create goal error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
goalRoutes.put("/:id", requireAdminOrManager(), requireNotFinance(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const goalId = c.req.param("id");
    const data = await c.req.json();
    const existing = await c.env.DB.prepare(
      "SELECT * FROM goals WHERE id = ? AND company_id = ?"
    ).bind(goalId, companyId).first();
    if (!existing) {
      return c.json({ success: false, error: "M\u1EE5c ti\xEAu kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    let weightWarning = null;
    if (data.weight !== void 0) {
      const category = data.category || existing.category;
      const year = data.year || existing.year;
      const existingWeights = await c.env.DB.prepare(`
        SELECT SUM(weight) as total FROM goals
        WHERE company_id = ? AND category = ? AND year = ? AND status = 'active' AND deleted_at IS NULL AND id != ?
      `).bind(companyId, category, year, goalId).first();
      const currentTotal = existingWeights?.total || 0;
      const newTotal = currentTotal + data.weight;
      if (newTotal > 100) {
        weightWarning = `\u26A0\uFE0F Tr\u1ECDng s\u1ED1 tr\u1EE5 c\u1ED9t s\u1EBD l\xE0 ${newTotal}% (v\u01B0\u1EE3t qu\xE1 100%). Khuy\u1EBFn ngh\u1ECB \u0111i\u1EC1u ch\u1EC9nh.`;
      } else if (newTotal < 100) {
        weightWarning = `\u26A0\uFE0F Tr\u1ECDng s\u1ED1 tr\u1EE5 c\u1ED9t s\u1EBD l\xE0 ${newTotal}% (thi\u1EBFu ${100 - newTotal}%).`;
      }
    }
    const fields = [];
    const values = [];
    const allowedFields = [
      "title",
      "description",
      "category",
      "year",
      "quarter",
      "start_week",
      "end_week",
      "measure",
      "target_value",
      "current_value",
      "unit",
      "deadline",
      "weight",
      "owner_dept_id",
      "collab_dept_ids",
      "reward",
      "reward_value",
      "status"
    ];
    for (const field of allowedFields) {
      if (data[field] !== void 0) {
        fields.push(`${field} = ?`);
        if (field === "collab_dept_ids") {
          values.push(JSON.stringify(data[field]));
        } else {
          values.push(data[field]);
        }
      }
    }
    fields.push("updated_at = ?");
    values.push(Date.now());
    values.push(goalId);
    await c.env.DB.prepare(`
      UPDATE goals SET ${fields.join(", ")} WHERE id = ?
    `).bind(...values).run();
    if (data.strategies !== void 0 && Array.isArray(data.strategies)) {
      await c.env.DB.prepare("DELETE FROM strategies WHERE goal_id = ?").bind(goalId).run();
      for (let i = 0; i < data.strategies.length; i++) {
        const strategy = data.strategies[i];
        const strategyId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO strategies (id, goal_id, title, description, sort_order)
          VALUES (?, ?, ?, ?, ?)
        `).bind(strategyId, goalId, strategy.title, strategy.description || null, i).run();
      }
    }
    await writeAuditLog(c.env, {
      companyId,
      entityType: "goal",
      entityId: goalId,
      action: "goal_updated",
      userId,
      userName: userId,
      oldValue: existing,
      newValue: data
    });
    const updated = await c.env.DB.prepare("SELECT * FROM goals WHERE id = ?").bind(goalId).first();
    return c.json({ success: true, data: updated, weightWarning });
  } catch (err) {
    console.error("Update goal error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
goalRoutes.delete("/:id", requireAdminOrManager(), requireNotFinance(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const goalId = c.req.param("id");
    const existing = await c.env.DB.prepare(
      "SELECT * FROM goals WHERE id = ? AND company_id = ?"
    ).bind(goalId, companyId).first();
    if (!existing) {
      return c.json({ success: false, error: "M\u1EE5c ti\xEAu kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    await c.env.DB.prepare(`
      UPDATE goals SET deleted_at = ?, updated_at = ? WHERE id = ?
    `).bind(Date.now(), Date.now(), goalId).run();
    await writeAuditLog(c.env, {
      companyId,
      entityType: "goal",
      entityId: goalId,
      action: "goal_deleted",
      userId,
      userName: userId
    });
    return c.json({ success: true });
  } catch (err) {
    console.error("Delete goal error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
goalRoutes.post("/:id/restore", requireAdmin(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const goalId = c.req.param("id");
    const existing = await c.env.DB.prepare(
      "SELECT * FROM goals WHERE id = ? AND company_id = ?"
    ).bind(goalId, companyId).first();
    if (!existing) {
      return c.json({ success: false, error: "M\u1EE5c ti\xEAu kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    await c.env.DB.prepare(`
      UPDATE goals SET deleted_at = NULL, updated_at = ? WHERE id = ?
    `).bind(Date.now(), goalId).run();
    await writeAuditLog(c.env, {
      companyId,
      entityType: "goal",
      entityId: goalId,
      action: "goal_restored",
      userId,
      userName: userId
    });
    const restored = await c.env.DB.prepare("SELECT * FROM goals WHERE id = ?").bind(goalId).first();
    return c.json({ success: true, data: restored });
  } catch (err) {
    console.error("Restore goal error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
goalRoutes.post("/:id/strategies", requireAdminOrManager(), requireNotFinance(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const goalId = c.req.param("id");
    const { title, description } = await c.req.json();
    const goal = await c.env.DB.prepare(
      "SELECT id FROM goals WHERE id = ? AND company_id = ?"
    ).bind(goalId, companyId).first();
    if (!goal) {
      return c.json({ success: false, error: "M\u1EE5c ti\xEAu kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    const strategyId = crypto.randomUUID();
    const maxOrder = await c.env.DB.prepare(
      "SELECT MAX(sort_order) as max_order FROM strategies WHERE goal_id = ?"
    ).bind(goalId).first();
    const sortOrder = (maxOrder?.max_order ?? -1) + 1;
    await c.env.DB.prepare(`
      INSERT INTO strategies (id, goal_id, title, description, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).bind(strategyId, goalId, title, description || null, sortOrder).run();
    const strategy = await c.env.DB.prepare(
      "SELECT * FROM strategies WHERE id = ?"
    ).bind(strategyId).first();
    return c.json({ success: true, data: strategy }, 201);
  } catch (err) {
    console.error("Add strategy error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});

// src/routes/tracking.ts
var trackingRoutes = new Hono2();
trackingRoutes.get("/goals/:id", async (c) => {
  try {
    const { companyId, role } = getUser(c);
    const goalId = c.req.param("id");
    const { year } = c.req.query();
    if (role === "finance") {
      return c.json({ success: false, error: "Finance kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp" }, 403);
    }
    const currentYear = year ? parseInt(year) : getCurrentYear();
    const goal = await c.env.DB.prepare(
      "SELECT * FROM goals WHERE id = ? AND company_id = ?"
    ).bind(goalId, companyId).first();
    if (!goal) {
      return c.json({ success: false, error: "M\u1EE5c ti\xEAu kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    const tracking = await c.env.DB.prepare(`
      SELECT t.*, u.name as updater_name
      FROM weekly_tracking t
      LEFT JOIN users u ON t.updated_by = u.id
      WHERE t.goal_id = ? AND t.year = ?
      ORDER BY t.week_number
    `).bind(goalId, currentYear).all();
    const progress = calculateGoalProgress(
      goal.start_week,
      goal.end_week,
      tracking.results,
      getCurrentWeek(),
      currentYear
    );
    return c.json({
      success: true,
      data: {
        goal,
        tracking: tracking.results,
        progress,
        currentWeek: getCurrentWeek(),
        currentYear
      }
    });
  } catch (err) {
    console.error("Get tracking error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
trackingRoutes.put("/goals/:id/week/:week", requireAdminOrManager(), requireNotFinance(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const goalId = c.req.param("id");
    const week = parseInt(c.req.param("week"));
    const { year, status, note } = await c.req.json();
    const goal = await c.env.DB.prepare(
      "SELECT * FROM goals WHERE id = ? AND company_id = ?"
    ).bind(goalId, companyId).first();
    if (!goal) {
      return c.json({ success: false, error: "M\u1EE5c ti\xEAu kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    if (week < goal.start_week || week > goal.end_week) {
      return c.json({ success: false, error: `Tu\u1EA7n ph\u1EA3i t\u1EEB ${goal.start_week} \u0111\u1EBFn ${goal.end_week}` }, 400);
    }
    if (!["done", "in_progress", "not_done"].includes(status)) {
      return c.json({ success: false, error: "Tr\u1EA1ng th\xE1i kh\xF4ng h\u1EE3p l\u1EC7" }, 400);
    }
    const existing = await c.env.DB.prepare(`
      SELECT * FROM weekly_tracking WHERE goal_id = ? AND week_number = ? AND year = ?
    `).bind(goalId, week, year).first();
    const now = Date.now();
    const oldStatus = existing?.status;
    if (existing) {
      await c.env.DB.prepare(`
        UPDATE weekly_tracking SET status = ?, note = ?, updated_by = ?, updated_at = ?
        WHERE goal_id = ? AND week_number = ? AND year = ?
      `).bind(status, note || null, userId, now, goalId, week, year).run();
    } else {
      const trackingId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO weekly_tracking (id, goal_id, week_number, year, status, note, updated_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(trackingId, goalId, week, year, status, note || null, userId, now).run();
    }
    await writeAuditLog(c.env, {
      companyId,
      entityType: "tracking",
      entityId: `${goalId}:${week}:${year}`,
      action: "tracking_updated",
      userId,
      userName: userId,
      oldValue: oldStatus ? { status: oldStatus } : null,
      newValue: { status, note, week, year }
    });
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, company_id, actor_id, actor_name, action, entity_type, entity_id, entity_title, meta, created_at)
      VALUES (?, ?, ?, ?, 'tracking_updated', 'goal', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      companyId,
      userId,
      userId,
      goalId,
      goal.title,
      JSON.stringify({ week, year, status }),
      now
    ).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("Update tracking error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
trackingRoutes.get("/dashboard", async (c) => {
  try {
    const { companyId, role } = getUser(c);
    const { year, quarter } = c.req.query();
    const currentYear = year ? parseInt(year) : getCurrentYear();
    if (role === "finance") {
      return c.json({ success: false, error: "Finance kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp" }, 403);
    }
    let goalsQuery = `
      SELECT g.*, d.name as department_name
      FROM goals g
      LEFT JOIN departments d ON g.owner_dept_id = d.id
      WHERE g.company_id = ? AND g.deleted_at IS NULL AND g.year = ?
    `;
    const params = [companyId, currentYear];
    if (quarter) {
      goalsQuery += " AND g.quarter = ?";
      params.push(parseInt(quarter));
    }
    const goals = await c.env.DB.prepare(goalsQuery).bind(...params).all();
    const goalIds = goals.results.map((g) => g.id);
    let trackingMap = {};
    if (goalIds.length > 0) {
      const placeholders = goalIds.map(() => "?").join(",");
      const trackingData = await c.env.DB.prepare(`
        SELECT * FROM weekly_tracking
        WHERE goal_id IN (${placeholders}) AND year = ?
      `).bind(...goalIds, currentYear).all();
      for (const t of trackingData.results) {
        if (!trackingMap[t.goal_id])
          trackingMap[t.goal_id] = [];
        trackingMap[t.goal_id].push(t);
      }
    }
    const goalsWithProgress = goals.results.map((goal) => {
      const tracking = trackingMap[goal.id] || [];
      const progress = calculateGoalProgress(
        goal.start_week,
        goal.end_week,
        tracking,
        getCurrentWeek(),
        currentYear
      );
      return {
        ...goal,
        progress
      };
    });
    const byCategory = {};
    for (const goal of goalsWithProgress) {
      if (!byCategory[goal.category]) {
        byCategory[goal.category] = { count: 0, goals: [] };
      }
      byCategory[goal.category].count++;
      byCategory[goal.category].goals.push(goal);
    }
    return c.json({
      success: true,
      data: {
        goals: goalsWithProgress,
        byCategory,
        currentWeek: getCurrentWeek(),
        currentYear
      }
    });
  } catch (err) {
    console.error("Get dashboard tracking error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});

// src/routes/financial.ts
var financialRoutes = new Hono2();
financialRoutes.get("/targets/:year", async (c) => {
  try {
    const { companyId } = getUser(c);
    const year = parseInt(c.req.param("year"));
    const target = await c.env.DB.prepare(`
      SELECT * FROM financial_targets WHERE company_id = ? AND year = ?
    `).bind(companyId, year).first();
    return c.json({ success: true, data: target || null });
  } catch (err) {
    console.error("Get financial targets error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
financialRoutes.put("/targets/:year", requireAdminOrManager(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const year = parseInt(c.req.param("year"));
    const data = await c.req.json();
    const existing = await c.env.DB.prepare(`
      SELECT * FROM financial_targets WHERE company_id = ? AND year = ?
    `).bind(companyId, year).first();
    const now = Date.now();
    if (existing) {
      await c.env.DB.prepare(`
        UPDATE financial_targets
        SET revenue_target = ?, cost_ratio_target = ?, profit_ratio_target = ?
        WHERE company_id = ? AND year = ?
      `).bind(
        data.revenue_target ?? existing.revenue_target,
        data.cost_ratio_target ?? existing.cost_ratio_target,
        data.profit_ratio_target ?? existing.profit_ratio_target,
        companyId,
        year
      ).run();
    } else {
      const id = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO financial_targets (id, company_id, year, revenue_target, cost_ratio_target, profit_ratio_target)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(id, companyId, year, data.revenue_target, data.cost_ratio_target || null, data.profit_ratio_target || null).run();
    }
    const updated = await c.env.DB.prepare(`
      SELECT * FROM financial_targets WHERE company_id = ? AND year = ?
    `).bind(companyId, year).first();
    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update financial targets error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
financialRoutes.get("/actuals/:year", async (c) => {
  try {
    const { companyId } = getUser(c);
    const year = parseInt(c.req.param("year"));
    const actuals = await c.env.DB.prepare(`
      SELECT m.*, u.name as updater_name
      FROM monthly_actuals m
      LEFT JOIN users u ON m.updated_by = u.id
      WHERE m.company_id = ? AND m.year = ?
      ORDER BY m.month
    `).bind(companyId, year).all();
    const target = await c.env.DB.prepare(`
      SELECT * FROM financial_targets WHERE company_id = ? AND year = ?
    `).bind(companyId, year).first();
    return c.json({
      success: true,
      data: {
        actuals: actuals.results,
        target,
        year
      }
    });
  } catch (err) {
    console.error("Get monthly actuals error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
financialRoutes.put("/actuals/:year/:month", requireAdminOrManager(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const year = parseInt(c.req.param("year"));
    const month = parseInt(c.req.param("month"));
    const data = await c.req.json();
    if (month < 1 || month > 12) {
      return c.json({ success: false, error: "Th\xE1ng kh\xF4ng h\u1EE3p l\u1EC7" }, 400);
    }
    const now = Date.now();
    const existing = await c.env.DB.prepare(`
      SELECT * FROM monthly_actuals WHERE company_id = ? AND year = ? AND month = ?
    `).bind(companyId, year, month).first();
    if (existing) {
      await c.env.DB.prepare(`
        UPDATE monthly_actuals
        SET revenue = ?, cost = ?, profit = ?, updated_by = ?, updated_at = ?
        WHERE company_id = ? AND year = ? AND month = ?
      `).bind(
        data.revenue ?? existing.revenue,
        data.cost ?? existing.cost,
        data.profit ?? existing.profit,
        userId,
        now,
        companyId,
        year,
        month
      ).run();
    } else {
      const id = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO monthly_actuals (id, company_id, year, month, revenue, cost, profit, updated_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, companyId, year, month, data.revenue || null, data.cost || null, data.profit || null, userId, now).run();
    }
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, company_id, actor_id, actor_name, action, entity_type, entity_id, entity_title, meta, created_at)
      VALUES (?, ?, ?, ?, 'financial_updated', 'monthly_actuals', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      companyId,
      userId,
      userId,
      `${year}-${month}`,
      `Doanh thu th\xE1ng ${month}`,
      JSON.stringify({ revenue: data.revenue }),
      now
    ).run();
    const updated = await c.env.DB.prepare(`
      SELECT * FROM monthly_actuals WHERE company_id = ? AND year = ? AND month = ?
    `).bind(companyId, year, month).first();
    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update monthly actual error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
financialRoutes.get("/fiveway/:year", async (c) => {
  try {
    const { companyId } = getUser(c);
    const year = parseInt(c.req.param("year"));
    const { quarter } = c.req.query();
    const actuals = await c.env.DB.prepare(`
      SELECT * FROM monthly_actuals WHERE company_id = ? AND year = ?
      ORDER BY month
    `).bind(companyId, year).all();
    const target = await c.env.DB.prepare(`
      SELECT * FROM financial_targets WHERE company_id = ? AND year = ?
    `).bind(companyId, year).first();
    const prevYear = year - 1;
    const prevActuals = await c.env.DB.prepare(`
      SELECT * FROM monthly_actuals WHERE company_id = ? AND year = ?
      ORDER BY month
    `).bind(companyId, prevYear).all();
    const monthlyData = actuals.results;
    const prevMonthlyData = prevActuals.results;
    const totalRevenue = monthlyData.reduce((sum, m) => sum + (m.revenue || 0), 0);
    const totalCost = monthlyData.reduce((sum, m) => sum + (m.cost || 0), 0);
    const totalProfit = monthlyData.reduce((sum, m) => sum + (m.profit || 0), 0);
    const prevTotalRevenue = prevMonthlyData.reduce((sum, m) => sum + (m.revenue || 0), 0);
    const profitMargin = totalRevenue > 0 ? totalProfit / totalRevenue * 100 : 0;
    const kpiData = await c.env.DB.prepare(`
      SELECT AVG(conversion_rate) as avg_conversion, AVG(avg_order_value) as avg_aov
      FROM personal_kpi WHERE year = ?
    `).bind(year).first();
    const conversionRate = kpiData?.avg_conversion || 5;
    const avgOrderValue = kpiData?.avg_aov || 1e6;
    const factorProduct = conversionRate / 100 * avgOrderValue * (profitMargin / 100);
    const khtnTransactions = factorProduct > 0 ? totalRevenue / factorProduct : 0;
    const transactionsPerCustomer = 3;
    const estimatedKHTN = Math.sqrt(khtnTransactions / transactionsPerCustomer);
    return c.json({
      success: true,
      data: {
        year,
        quarter: quarter ? parseInt(quarter) : null,
        actuals: monthlyData,
        target,
        summary: {
          totalRevenue,
          totalCost,
          totalProfit,
          prevTotalRevenue,
          revenueGrowth: prevTotalRevenue > 0 ? (totalRevenue - prevTotalRevenue) / prevTotalRevenue * 100 : 0
        },
        fiveWay: {
          // 5 factors [S2.1]
          khtn: Math.round(estimatedKHTN),
          // Khách hàng tiềm năng
          conversionRate: Math.round(conversionRate * 100) / 100,
          transactionsPerCustomer,
          avgOrderValue: Math.round(avgOrderValue),
          profitMargin: Math.round(profitMargin * 100) / 100,
          // Calculated revenue
          calculatedRevenue: totalRevenue,
          // Comparison vs previous year [S2.2]
          prevYear: {
            totalRevenue: prevTotalRevenue
          }
        },
        // Suggestions based on factors [S2.3]
        suggestions: generateFiveWaySuggestions({
          khtn: estimatedKHTN,
          conversionRate,
          transactionsPerCustomer,
          avgOrderValue,
          profitMargin,
          totalRevenue,
          targetRevenue: target?.revenue_target || 0
        })
      }
    });
  } catch (err) {
    console.error("Five-way analysis error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
function generateFiveWaySuggestions(data) {
  const suggestions = [];
  const { totalRevenue, targetRevenue } = data;
  if (targetRevenue > 0) {
    const percentOfTarget = totalRevenue / targetRevenue * 100;
    if (percentOfTarget < 70) {
      suggestions.push(`\u26A0\uFE0F Doanh thu m\u1EDBi \u0111\u1EA1t ${percentOfTarget.toFixed(1)}% k\u1EBF ho\u1EA1ch. C\u1EA7n t\u0103ng c\u01B0\u1EDDng c\xE1c bi\u1EC7n ph\xE1p th\xFAc \u0111\u1EA9y.`);
    }
  }
  if (data.profitMargin < 10) {
    suggestions.push(`\u{1F4C9} Bi\xEAn l\u1EE3i nhu\u1EADn th\u1EA5p (${data.profitMargin.toFixed(1)}%). C\u1EA7n xem x\xE9t c\u1EAFt gi\u1EA3m chi ph\xED ho\u1EB7c t\u0103ng gi\xE1 b\xE1n.`);
  } else if (data.profitMargin > 30) {
    suggestions.push(`\u2705 Bi\xEAn l\u1EE3i nhu\u1EADn t\u1ED1t (${data.profitMargin.toFixed(1)}%). Duy tr\xEC chi\u1EBFn l\u01B0\u1EE3c hi\u1EC7n t\u1EA1i.`);
  }
  if (data.conversionRate < 3) {
    suggestions.push(`\u{1F4CA} T\u1EF7 l\u1EC7 chuy\u1EC3n \u0111\u1ED5i th\u1EA5p (${data.conversionRate.toFixed(1)}%). C\u1EA7n c\u1EA3i thi\u1EC7n ch\u1EA5t l\u01B0\u1EE3ng ch\u0103m s\xF3c kh\xE1ch h\xE0ng.`);
  }
  if (data.avgOrderValue < 5e5) {
    suggestions.push(`\u{1F4B0} Gi\xE1 tr\u1ECB \u0111\u01A1n h\xE0ng trung b\xECnh th\u1EA5p. C\xE2n nh\u1EAFc upsell/cross-sell \u0111\u1EC3 t\u0103ng AOV.`);
  }
  return suggestions;
}
__name(generateFiveWaySuggestions, "generateFiveWaySuggestions");

// src/routes/products.ts
var productRoutes = new Hono2();
productRoutes.get("/", async (c) => {
  try {
    const { companyId } = getUser(c);
    const { year } = c.req.query();
    let query = `
      SELECT * FROM products WHERE company_id = ? AND is_active = 1
    `;
    const params = [companyId];
    if (year) {
      query += " AND year = ?";
      params.push(parseInt(year));
    }
    query += " ORDER BY revenue DESC";
    const products = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: products.results });
  } catch (err) {
    console.error("Get products error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
productRoutes.post("/", requireAdminOrManager(), async (c) => {
  try {
    const { companyId } = getUser(c);
    const data = await c.req.json();
    if (!data.name || !data.year) {
      return c.json({ success: false, error: "Th\xF4ng tin kh\xF4ng \u0111\u1EA7y \u0111\u1EE7" }, 400);
    }
    let bcgCategory = "question";
    if (data.growth_rate !== void 0 && data.revenue !== void 0) {
      if (data.growth_rate > 10 && data.revenue > 1e9) {
        bcgCategory = "star";
      } else if (data.growth_rate > 0 && data.revenue > 5e8) {
        bcgCategory = "cow";
      } else if (data.growth_rate < 0) {
        bcgCategory = "dog";
      }
    }
    const productId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO products (id, company_id, name, year, quantity_sold, unit_price, revenue, profit_margin, growth_rate, bcg_category, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      productId,
      companyId,
      data.name,
      data.year,
      data.quantity_sold || null,
      data.unit_price || null,
      data.revenue || null,
      data.profit_margin || null,
      data.growth_rate || null,
      data.bcg_category || bcgCategory
    ).run();
    const product = await c.env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(productId).first();
    return c.json({ success: true, data: product }, 201);
  } catch (err) {
    console.error("Create product error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
productRoutes.put("/:id", requireAdminOrManager(), async (c) => {
  try {
    const { companyId } = getUser(c);
    const productId = c.req.param("id");
    const data = await c.req.json();
    const existing = await c.env.DB.prepare(
      "SELECT * FROM products WHERE id = ? AND company_id = ?"
    ).bind(productId, companyId).first();
    if (!existing) {
      return c.json({ success: false, error: "S\u1EA3n ph\u1EA9m kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    const fields = [];
    const values = [];
    const allowedFields = ["name", "year", "quantity_sold", "unit_price", "revenue", "profit_margin", "growth_rate", "bcg_category", "is_active"];
    for (const field of allowedFields) {
      if (data[field] !== void 0) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }
    if (fields.length === 0) {
      return c.json({ success: false, error: "Kh\xF4ng c\xF3 g\xEC \u0111\u1EC3 c\u1EADp nh\u1EADt" }, 400);
    }
    values.push(productId);
    await c.env.DB.prepare(`
      UPDATE products SET ${fields.join(", ")} WHERE id = ?
    `).bind(...values).run();
    const updated = await c.env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(productId).first();
    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update product error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
productRoutes.delete("/:id", requireAdminOrManager(), async (c) => {
  try {
    const { companyId } = getUser(c);
    const productId = c.req.param("id");
    await c.env.DB.prepare(`
      UPDATE products SET is_active = 0 WHERE id = ? AND company_id = ?
    `).bind(productId, companyId).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("Delete product error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});

// src/routes/personal-kpi.ts
var personalKpiRoutes = new Hono2();
personalKpiRoutes.get("/", async (c) => {
  try {
    const { userId, companyId } = getUser(c);
    const { year, month } = c.req.query();
    const currentYear = year ? parseInt(year) : (/* @__PURE__ */ new Date()).getFullYear();
    let query = `
      SELECT pk.*, u.name as user_name
      FROM personal_kpi pk
      JOIN users u ON pk.user_id = u.id
      WHERE pk.user_id = ?
    `;
    const params = [userId];
    if (year) {
      query += " AND pk.year = ?";
      params.push(currentYear);
    }
    if (month) {
      query += " AND pk.month = ?";
      params.push(parseInt(month));
    }
    query += " ORDER BY pk.year DESC, pk.month DESC";
    const kpis = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: kpis.results });
  } catch (err) {
    console.error("Get personal KPI error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
personalKpiRoutes.put("/", async (c) => {
  try {
    const { userId, companyId } = getUser(c);
    const data = await c.req.json();
    const currentYear = data.year || (/* @__PURE__ */ new Date()).getFullYear();
    const currentMonth = data.month || (/* @__PURE__ */ new Date()).getMonth() + 1;
    if (data.working_days_per_month !== void 0) {
      if (data.working_days_per_month < 20 || data.working_days_per_month > 31) {
        return c.json({ success: false, error: "S\u1ED1 ng\xE0y l\xE0m vi\u1EC7c ph\u1EA3i t\u1EEB 20 \u0111\u1EBFn 31" }, 400);
      }
    }
    const existing = await c.env.DB.prepare(`
      SELECT * FROM personal_kpi WHERE user_id = ? AND year = ? AND (month = ? OR (month IS NULL AND ? IS NULL))
    `).bind(userId, currentYear, currentMonth, currentMonth).first();
    const now = Date.now();
    if (existing) {
      await c.env.DB.prepare(`
        UPDATE personal_kpi
        SET income_target = ?, commission_rate = ?, conversion_rate = ?,
            avg_order_value = ?, working_days_per_month = ?, updated_at = ?
        WHERE id = ?
      `).bind(
        data.income_target ?? existing.income_target,
        data.commission_rate ?? existing.commission_rate,
        data.conversion_rate ?? existing.conversion_rate,
        data.avg_order_value ?? existing.avg_order_value,
        data.working_days_per_month ?? existing.working_days_per_month,
        now,
        existing.id
      ).run();
      await c.env.DB.prepare(`
        INSERT INTO personal_kpi_history (
          id, personal_kpi_id, user_id, year, month, income_target,
          commission_rate, conversion_rate, avg_order_value, working_days_per_month,
          changed_by, changed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        existing.id,
        userId,
        currentYear,
        currentMonth,
        data.income_target ?? existing.income_target,
        data.commission_rate ?? existing.commission_rate,
        data.conversion_rate ?? existing.conversion_rate,
        data.avg_order_value ?? existing.avg_order_value,
        data.working_days_per_month ?? existing.working_days_per_month,
        userId,
        now
      ).run();
      const updated = await c.env.DB.prepare("SELECT * FROM personal_kpi WHERE id = ?").bind(existing.id).first();
      return c.json({ success: true, data: updated });
    } else {
      const kpiId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO personal_kpi (
          id, user_id, year, month, income_target, commission_rate,
          conversion_rate, avg_order_value, working_days_per_month, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        kpiId,
        userId,
        currentYear,
        currentMonth || null,
        data.income_target || null,
        data.commission_rate || null,
        data.conversion_rate || null,
        data.avg_order_value || null,
        data.working_days_per_month || 26,
        now,
        now
      ).run();
      const created = await c.env.DB.prepare("SELECT * FROM personal_kpi WHERE id = ?").bind(kpiId).first();
      return c.json({ success: true, data: created }, 201);
    }
  } catch (err) {
    console.error("Update personal KPI error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
personalKpiRoutes.get("/calculate", async (c) => {
  try {
    const { income_target, commission_rate, conversion_rate, avg_order_value, working_days_per_month } = c.req.query();
    if (!income_target) {
      return c.json({ success: false, error: "Thi\u1EBFu m\u1EE5c ti\xEAu thu nh\u1EADp" }, 400);
    }
    const income = parseFloat(income_target);
    const commission = (parseFloat(commission_rate) || 0) / 100;
    const conversion = (parseFloat(conversion_rate) || 0) / 100;
    const aov = parseFloat(avg_order_value) || 0;
    const workingDays = parseInt(working_days_per_month) || 26;
    if (workingDays < 20 || workingDays > 31) {
      return c.json({ success: false, error: "S\u1ED1 ng\xE0y l\xE0m vi\u1EC7c ph\u1EA3i t\u1EEB 20 \u0111\u1EBFn 31" }, 400);
    }
    const salesTarget = commission > 0 ? income / commission : 0;
    const numOrders = aov > 0 ? salesTarget / aov : 0;
    const potentialCustomers = conversion > 0 ? numOrders / conversion : 0;
    const dailyProspects = Math.ceil(potentialCustomers / workingDays);
    return c.json({
      success: true,
      data: {
        income_target: income,
        commission_rate: commission * 100,
        conversion_rate: conversion * 100,
        avg_order_value: aov,
        working_days_per_month: workingDays,
        sales_target: Math.round(salesTarget),
        num_orders: Math.round(numOrders),
        potential_customers_per_month: Math.round(potentialCustomers),
        potential_customers_per_day: dailyProspects
      }
    });
  } catch (err) {
    console.error("Calculate KPI error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});

// src/routes/rewards.ts
var rewardRoutes = new Hono2();
rewardRoutes.get("/", requireAdminOrManager(), async (c) => {
  try {
    const { companyId, role } = getUser(c);
    const { status } = c.req.query();
    let query = `
      SELECT ra.*, g.title as goal_title, g.category, u.name as requester_name
      FROM reward_approvals ra
      JOIN goals g ON ra.goal_id = g.id
      JOIN users u ON ra.requested_by = u.id
      WHERE ra.company_id = ?
    `;
    const params = [companyId];
    if (status) {
      query += " AND ra.status = ?";
      params.push(status);
    }
    query += " ORDER BY ra.requested_at DESC";
    const approvals = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: approvals.results });
  } catch (err) {
    console.error("Get reward approvals error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
rewardRoutes.post("/goals/:id/request", requireAdminOrManager(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const goalId = c.req.param("id");
    const { reward_description, reward_value } = await c.req.json();
    const goal = await c.env.DB.prepare(
      "SELECT * FROM goals WHERE id = ? AND company_id = ?"
    ).bind(goalId, companyId).first();
    if (!goal) {
      return c.json({ success: false, error: "M\u1EE5c ti\xEAu kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    if (!goal.reward && !reward_description) {
      return c.json({ success: false, error: "M\u1EE5c ti\xEAu n\xE0y kh\xF4ng c\xF3 ph\u1EA7n th\u01B0\u1EDFng" }, 400);
    }
    const pending = await c.env.DB.prepare(`
      SELECT id FROM reward_approvals WHERE goal_id = ? AND status = 'pending'
    `).bind(goalId).first();
    if (pending) {
      return c.json({ success: false, error: "\u0110\xE3 c\xF3 \u0111\u1EC1 ngh\u1ECB \u0111ang ch\u1EDD duy\u1EC7t" }, 409);
    }
    const approvalId = crypto.randomUUID();
    const now = Date.now();
    await c.env.DB.prepare(`
      INSERT INTO reward_approvals (
        id, goal_id, company_id, requested_by, requested_at, status,
        reward_description, reward_value
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      approvalId,
      goalId,
      companyId,
      userId,
      now,
      reward_description || goal.reward,
      reward_value || goal.reward_value
    ).run();
    await c.env.DB.prepare(`
      INSERT INTO notifications (
        id, company_id, user_id, type, title, content, entity_type, entity_id, is_read, created_at
      ) SELECT
        ?, ?, u.id, 'reward_request',
        'Y\xEAu c\u1EA7u ph\xEA duy\u1EC7t ph\u1EA7n th\u01B0\u1EDFng m\u1EDBi',
        ?, 'reward_approval', ?, 0, ?
      FROM users u WHERE u.role = 'admin' AND u.company_id = ?
    `).bind(
      crypto.randomUUID(),
      companyId,
      `Y\xEAu c\u1EA7u ph\xEA duy\u1EC7t ph\u1EA7n th\u01B0\u1EDFng cho m\u1EE5c ti\xEAu: ${goal.title}`,
      approvalId,
      now,
      companyId
    ).run();
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, company_id, actor_id, actor_name, action, entity_type, entity_id, entity_title, created_at)
      VALUES (?, ?, ?, ?, 'reward_requested', 'reward_approval', ?, ?, ?)
    `).bind(crypto.randomUUID(), companyId, userId, userId, approvalId, goal.title, now).run();
    await writeAuditLog(c.env, {
      companyId,
      entityType: "financial",
      entityId: approvalId,
      action: "reward_requested",
      userId,
      userName: userId,
      newValue: { goal_id: goalId, reward_description: reward_description || goal.reward }
    });
    const approval = await c.env.DB.prepare("SELECT * FROM reward_approvals WHERE id = ?").bind(approvalId).first();
    return c.json({ success: true, data: approval }, 201);
  } catch (err) {
    console.error("Request reward error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
rewardRoutes.put("/:id/approve", requireAdmin(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const approvalId = c.req.param("id");
    const approval = await c.env.DB.prepare(
      "SELECT * FROM reward_approvals WHERE id = ? AND company_id = ?"
    ).bind(approvalId, companyId).first();
    if (!approval) {
      return c.json({ success: false, error: "Y\xEAu c\u1EA7u kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    if (approval.status !== "pending") {
      return c.json({ success: false, error: "Y\xEAu c\u1EA7u n\xE0y \u0111\xE3 \u0111\u01B0\u1EE3c x\u1EED l\xFD" }, 400);
    }
    const now = Date.now();
    await c.env.DB.prepare(`
      UPDATE reward_approvals SET status = 'approved', reviewed_by = ?, reviewed_at = ?
      WHERE id = ?
    `).bind(userId, now, approvalId).run();
    await c.env.DB.prepare(`
      INSERT INTO notifications (
        id, company_id, user_id, type, title, content, entity_type, entity_id, is_read, created_at
      ) VALUES (?, ?, ?, 'reward_approved', 'Ph\u1EA7n th\u01B0\u1EDFng \u0111\xE3 \u0111\u01B0\u1EE3c duy\u1EC7t!', ?, 'reward_approval', ?, 0, ?)
    `).bind(
      crypto.randomUUID(),
      companyId,
      approval.requested_by,
      `Ph\u1EA7n th\u01B0\u1EDFng cho m\u1EE5c ti\xEAu \u0111\xE3 \u0111\u01B0\u1EE3c duy\u1EC7t`,
      approvalId,
      now
    ).run();
    await c.env.DB.prepare(`
      UPDATE goals SET updated_at = ? WHERE id = ?
    `).bind(now, approval.goal_id).run();
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, company_id, actor_id, actor_name, action, entity_type, entity_id, entity_title, created_at)
      VALUES (?, ?, ?, ?, 'reward_approved', 'reward_approval', ?, ?, ?)
    `).bind(crypto.randomUUID(), companyId, userId, userId, approvalId, approval.goal_title || "Goal", now).run();
    await writeAuditLog(c.env, {
      companyId,
      entityType: "financial",
      entityId: approvalId,
      action: "reward_approved",
      userId,
      userName: userId,
      newValue: { status: "approved" },
      isCritical: true
    });
    const updated = await c.env.DB.prepare("SELECT * FROM reward_approvals WHERE id = ?").bind(approvalId).first();
    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error("Approve reward error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
rewardRoutes.put("/:id/reject", requireAdmin(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const approvalId = c.req.param("id");
    const { reason } = await c.req.json();
    if (!reason) {
      return c.json({ success: false, error: "L\xFD do t\u1EEB ch\u1ED1i l\xE0 b\u1EAFt bu\u1ED9c" }, 400);
    }
    const approval = await c.env.DB.prepare(
      "SELECT * FROM reward_approvals WHERE id = ? AND company_id = ?"
    ).bind(approvalId, companyId).first();
    if (!approval) {
      return c.json({ success: false, error: "Y\xEAu c\u1EA7u kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    if (approval.status !== "pending") {
      return c.json({ success: false, error: "Y\xEAu c\u1EA7u n\xE0y \u0111\xE3 \u0111\u01B0\u1EE3c x\u1EED l\xFD" }, 400);
    }
    const now = Date.now();
    await c.env.DB.prepare(`
      UPDATE reward_approvals SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, reject_reason = ?
      WHERE id = ?
    `).bind(userId, now, reason, approvalId).run();
    await c.env.DB.prepare(`
      INSERT INTO notifications (
        id, company_id, user_id, type, title, content, entity_type, entity_id, is_read, created_at
      ) VALUES (?, ?, ?, 'reward_rejected', 'Ph\u1EA7n th\u01B0\u1EDFng b\u1ECB t\u1EEB ch\u1ED1i', ?, 'reward_approval', ?, 0, ?)
    `).bind(
      crypto.randomUUID(),
      companyId,
      approval.requested_by,
      `L\xFD do: ${reason}`,
      approvalId,
      now
    ).run();
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, company_id, actor_id, actor_name, action, entity_type, entity_id, entity_title, created_at)
      VALUES (?, ?, ?, ?, 'reward_rejected', 'reward_approval', ?, ?, ?)
    `).bind(crypto.randomUUID(), companyId, userId, userId, approvalId, approval.goal_title || "Goal", now).run();
    await writeAuditLog(c.env, {
      companyId,
      entityType: "financial",
      entityId: approvalId,
      action: "reward_rejected",
      userId,
      userName: userId,
      oldValue: { status: "pending" },
      newValue: { status: "rejected", reason },
      isCritical: true
    });
    const updated = await c.env.DB.prepare("SELECT * FROM reward_approvals WHERE id = ?").bind(approvalId).first();
    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error("Reject reward error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});

// src/routes/notifications.ts
var notificationRoutes = new Hono2();
notificationRoutes.get("/", async (c) => {
  try {
    const { userId, companyId } = getUser(c);
    const { is_read, limit } = c.req.query();
    let query = `
      SELECT * FROM notifications
      WHERE user_id = ? AND company_id = ?
    `;
    const params = [userId, companyId];
    if (is_read !== void 0) {
      query += " AND is_read = ?";
      params.push(is_read === "true" ? 1 : 0);
    }
    query += " ORDER BY created_at DESC";
    if (limit) {
      query += " LIMIT ?";
      params.push(parseInt(limit));
    }
    const notifications = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: notifications.results });
  } catch (err) {
    console.error("Get notifications error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
notificationRoutes.get("/count-unread", async (c) => {
  try {
    const { userId } = getUser(c);
    const result = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).bind(userId).first();
    return c.json({ success: true, data: { count: result?.count || 0 } });
  } catch (err) {
    console.error("Get unread count error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
notificationRoutes.put("/:id/read", async (c) => {
  try {
    const { userId } = getUser(c);
    const notificationId = c.req.param("id");
    await c.env.DB.prepare(`
      UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?
    `).bind(notificationId, userId).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("Mark as read error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
notificationRoutes.put("/read-all", async (c) => {
  try {
    const { userId } = getUser(c);
    await c.env.DB.prepare(`
      UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0
    `).bind(userId).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("Mark all as read error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});

// src/routes/activity.ts
var activityRoutes = new Hono2();
activityRoutes.get("/", async (c) => {
  try {
    const { companyId } = getUser(c);
    const { limit, page } = c.req.query();
    const pageSize = parseInt(limit) || 20;
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * pageSize;
    const activities = await c.env.DB.prepare(`
      SELECT * FROM activity_feed
      WHERE company_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(companyId, pageSize, offset).all();
    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM activity_feed WHERE company_id = ?
    `).bind(companyId).first();
    return c.json({
      success: true,
      data: {
        items: activities.results,
        total: totalResult?.total || 0,
        page: pageNum,
        pageSize
      }
    });
  } catch (err) {
    console.error("Get activity feed error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});

// src/routes/comments.ts
var commentRoutes = new Hono2();
commentRoutes.get("/goals/:id/comments", async (c) => {
  try {
    const { companyId, role } = getUser(c);
    const goalId = c.req.param("id");
    if (role === "finance") {
      return c.json({ success: false, error: "Finance kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp" }, 403);
    }
    const comments = await c.env.DB.prepare(`
      SELECT c.*, u.name as author_name
      FROM goal_comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.goal_id = ? AND c.deleted_at IS NULL
      ORDER BY c.created_at ASC
    `).bind(goalId).all();
    return c.json({ success: true, data: comments.results });
  } catch (err) {
    console.error("Get comments error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
commentRoutes.post("/goals/:id/comments", async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const goalId = c.req.param("id");
    const { content } = await c.req.json();
    if (!content || content.trim().length === 0) {
      return c.json({ success: false, error: "N\u1ED9i dung b\xECnh lu\u1EADn l\xE0 b\u1EAFt bu\u1ED9c" }, 400);
    }
    const goal = await c.env.DB.prepare(
      "SELECT id, title FROM goals WHERE id = ? AND company_id = ?"
    ).bind(goalId, companyId).first();
    if (!goal) {
      return c.json({ success: false, error: "M\u1EE5c ti\xEAu kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    const mentions = parseMentions(content);
    const commentId = crypto.randomUUID();
    const now = Date.now();
    await c.env.DB.prepare(`
      INSERT INTO goal_comments (id, goal_id, company_id, author_id, content, mentions, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(commentId, goalId, companyId, userId, content, JSON.stringify(mentions), now, now).run();
    if (mentions.length > 0) {
      for (const mentionedUserId of mentions) {
        const mentionedUser = await c.env.DB.prepare(`
          SELECT id FROM users WHERE id = ? AND company_id = ?
        `).bind(mentionedUserId, companyId).first();
        if (mentionedUser) {
          await c.env.DB.prepare(`
            INSERT INTO notifications (
              id, company_id, user_id, type, title, content, entity_type, entity_id, is_read, created_at
            ) VALUES (?, ?, ?, 'mention', 'B\u1EA1n \u0111\u01B0\u1EE3c nh\u1EAFc \u0111\u1EBFn trong b\xECnh lu\u1EADn', ?, 'comment', ?, 0, ?)
          `).bind(
            crypto.randomUUID(),
            companyId,
            mentionedUserId,
            `Nh\u1EAFc \u0111\u1EBFn b\u1EA1n trong "${goal.title}"`,
            commentId,
            now
          ).run();
        }
      }
    }
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, company_id, actor_id, actor_name, action, entity_type, entity_id, entity_title, created_at)
      VALUES (?, ?, ?, ?, 'comment_added', 'comment', ?, ?, ?)
    `).bind(crypto.randomUUID(), companyId, userId, userId, commentId, goal.title, now).run();
    const comment = await c.env.DB.prepare(`
      SELECT c.*, u.name as author_name
      FROM goal_comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = ?
    `).bind(commentId).first();
    return c.json({ success: true, data: comment }, 201);
  } catch (err) {
    console.error("Add comment error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
commentRoutes.put("/:id", async (c) => {
  try {
    const { userId } = getUser(c);
    const commentId = c.req.param("id");
    const { content } = await c.req.json();
    const comment = await c.env.DB.prepare(
      "SELECT * FROM goal_comments WHERE id = ? AND author_id = ?"
    ).bind(commentId, userId).first();
    if (!comment) {
      return c.json({ success: false, error: "B\xECnh lu\u1EADn kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c b\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n s\u1EEDa" }, 404);
    }
    const ageMinutes = (Date.now() - comment.created_at) / 1e3 / 60;
    if (ageMinutes > 5) {
      return c.json({ success: false, error: "Ch\u1EC9 c\xF3 th\u1EC3 s\u1EEDa b\xECnh lu\u1EADn trong 5 ph\xFAt \u0111\u1EA7u" }, 400);
    }
    const mentions = parseMentions(content);
    await c.env.DB.prepare(`
      UPDATE goal_comments SET content = ?, mentions = ?, updated_at = ?
      WHERE id = ?
    `).bind(content, JSON.stringify(mentions), Date.now(), commentId).run();
    const updated = await c.env.DB.prepare("SELECT * FROM goal_comments WHERE id = ?").bind(commentId).first();
    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update comment error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
commentRoutes.delete("/:id", async (c) => {
  try {
    const { userId, role } = getUser(c);
    const commentId = c.req.param("id");
    const comment = await c.env.DB.prepare(
      "SELECT * FROM goal_comments WHERE id = ?"
    ).bind(commentId).first();
    if (!comment) {
      return c.json({ success: false, error: "B\xECnh lu\u1EADn kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    if (comment.author_id !== userId && role !== "admin") {
      return c.json({ success: false, error: "B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n x\xF3a b\xECnh lu\u1EADn n\xE0y" }, 403);
    }
    await c.env.DB.prepare(`
      UPDATE goal_comments SET deleted_at = ? WHERE id = ?
    `).bind(Date.now(), commentId).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("Delete comment error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});

// src/routes/reports.ts
var reportRoutes = new Hono2();
reportRoutes.get("/quarterly", async (c) => {
  try {
    const { companyId, role } = getUser(c);
    const { year, quarter } = c.req.query();
    const currentYear = year ? parseInt(year) : getCurrentYear();
    const currentQuarter = quarter ? parseInt(quarter) : Math.ceil(((/* @__PURE__ */ new Date()).getMonth() + 1) / 3);
    if (role === "finance") {
      return c.json({ success: false, error: "Finance kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp b\xE1o c\xE1o" }, 403);
    }
    const company = await c.env.DB.prepare(
      "SELECT * FROM companies WHERE id = ?"
    ).bind(companyId).first();
    const goals = await c.env.DB.prepare(`
      SELECT g.*, d.name as department_name
      FROM goals g
      LEFT JOIN departments d ON g.owner_dept_id = d.id
      WHERE g.company_id = ? AND g.year = ? AND g.quarter = ?
      AND g.deleted_at IS NULL
    `).bind(companyId, currentYear, currentQuarter).all();
    const goalsWithProgress = await Promise.all(
      (goals.results || []).map(async (goal) => {
        const tracking = await c.env.DB.prepare(`
          SELECT * FROM weekly_tracking
          WHERE goal_id = ? AND year = ?
        `).bind(goal.id, currentYear).all();
        const progress = calculateGoalProgress(
          goal.start_week,
          goal.end_week,
          tracking.results,
          getCurrentWeek(),
          currentYear
        );
        return {
          ...goal,
          progress,
          tracking: tracking.results
        };
      })
    );
    const target = await c.env.DB.prepare(`
      SELECT * FROM financial_targets WHERE company_id = ? AND year = ?
    `).bind(companyId, currentYear).first();
    const monthStart = (currentQuarter - 1) * 3 + 1;
    const monthEnd = currentQuarter * 3;
    const actuals = await c.env.DB.prepare(`
      SELECT * FROM monthly_actuals
      WHERE company_id = ? AND year = ? AND month >= ? AND month <= ?
      ORDER BY month
    `).bind(companyId, currentYear, monthStart, monthEnd).all();
    const products = await c.env.DB.prepare(`
      SELECT * FROM products WHERE company_id = ? AND year = ? AND is_active = 1
    `).bind(companyId, currentYear).all();
    return c.json({
      success: true,
      data: {
        company,
        year: currentYear,
        quarter: currentQuarter,
        goals: goalsWithProgress,
        financial: {
          target,
          actuals: actuals.results
        },
        products: products.results,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (err) {
    console.error("Get quarterly report error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});
reportRoutes.get("/department/:deptId", async (c) => {
  try {
    const { companyId, role } = getUser(c);
    const deptId = c.req.param("deptId");
    const { year, quarter } = c.req.query();
    const currentYear = year ? parseInt(year) : getCurrentYear();
    if (role === "finance") {
      return c.json({ success: false, error: "Finance kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp" }, 403);
    }
    const department = await c.env.DB.prepare(
      "SELECT * FROM departments WHERE id = ? AND company_id = ?"
    ).bind(deptId, companyId).first();
    if (!department) {
      return c.json({ success: false, error: "Ph\xF2ng ban kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    let goalsQuery = `
      SELECT g.*, u.name as manager_name
      FROM goals g
      LEFT JOIN users u ON g.owner_dept_id = u.department_id
      WHERE g.company_id = ? AND g.owner_dept_id = ? AND g.year = ? AND g.deleted_at IS NULL
    `;
    const params = [companyId, deptId, currentYear];
    if (quarter) {
      goalsQuery += " AND g.quarter = ?";
      params.push(parseInt(quarter));
    }
    const goals = await c.env.DB.prepare(goalsQuery).bind(...params).all();
    const goalsWithProgress = await Promise.all(
      (goals.results || []).map(async (goal) => {
        const tracking = await c.env.DB.prepare(`
          SELECT * FROM weekly_tracking WHERE goal_id = ? AND year = ?
        `).bind(goal.id, currentYear).all();
        const progress = calculateGoalProgress(
          goal.start_week,
          goal.end_week,
          tracking.results,
          getCurrentWeek(),
          currentYear
        );
        return { ...goal, progress };
      })
    );
    return c.json({
      success: true,
      data: {
        department,
        goals: goalsWithProgress,
        year: currentYear,
        quarter: quarter ? parseInt(quarter) : null
      }
    });
  } catch (err) {
    console.error("Get department report error:", err);
    return c.json({ success: false, error: "L\u1ED7i server" }, 500);
  }
});

// src/index.ts
var app = new Hono2();
app.use("*", poweredBy());
app.use("*", logger());
app.use("*", cors({
  origin: ["http://localhost:3000", "https://*.pages.dev", "https://*.vercel.app"],
  credentials: true
}));
app.route("/api/auth", authRoutes);
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: Date.now() }));
app.use("/api/*", authMiddleware());
app.route("/api/company", companyRoutes);
app.route("/api/users", userRoutes);
app.route("/api/departments", departmentRoutes);
app.route("/api/goals", goalRoutes);
app.route("/api/tracking", trackingRoutes);
app.route("/api/financial", financialRoutes);
app.route("/api/products", productRoutes);
app.route("/api/personal-kpi", personalKpiRoutes);
app.route("/api/reward-approvals", rewardRoutes);
app.route("/api/notifications", notificationRoutes);
app.route("/api/activity-feed", activityRoutes);
app.route("/api/comments", commentRoutes);
app.route("/api/reports", reportRoutes);
app.onError((err, c) => {
  console.error("API Error:", err);
  return c.json({ success: false, error: err.message }, 500);
});
app.notFound((c) => {
  return c.json({ success: false, error: "Not found" }, 404);
});
var src_default = app;

// ../../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-jGiGBf/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-jGiGBf/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  app,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
