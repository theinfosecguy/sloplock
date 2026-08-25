// Bundled hook entrypoint. Do not edit directly.
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/yaml/dist/nodes/identity.js"(exports2) {
    "use strict";
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports2.ALIAS = ALIAS;
    exports2.DOC = DOC;
    exports2.MAP = MAP;
    exports2.NODE_TYPE = NODE_TYPE;
    exports2.PAIR = PAIR;
    exports2.SCALAR = SCALAR;
    exports2.SEQ = SEQ;
    exports2.hasAnchor = hasAnchor;
    exports2.isAlias = isAlias;
    exports2.isCollection = isCollection;
    exports2.isDocument = isDocument;
    exports2.isMap = isMap;
    exports2.isNode = isNode;
    exports2.isPair = isPair;
    exports2.isScalar = isScalar;
    exports2.isSeq = isSeq;
  }
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/yaml/dist/visit.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path3) {
      const ctrl = callVisitor(key, node, visitor, path3);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path3, ctrl);
        return visit_(key, ctrl, visitor, path3);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path3 = Object.freeze(path3.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path3);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path3 = Object.freeze(path3.concat(node));
          const ck = visit_("key", node.key, visitor, path3);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path3);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path3) {
      const ctrl = await callVisitor(key, node, visitor, path3);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path3, ctrl);
        return visitAsync_(key, ctrl, visitor, path3);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path3 = Object.freeze(path3.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path3);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path3 = Object.freeze(path3.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path3);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path3);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path3) {
      if (typeof visitor === "function")
        return visitor(key, node, path3);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path3);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path3);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path3);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path3);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path3);
      return void 0;
    }
    function replaceNode(key, path3, node) {
      const parent = path3[path3.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports2.visit = visit;
    exports2.visitAsync = visitAsync;
  }
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/yaml/dist/doc/directives.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports2.Directives = Directives;
  }
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/yaml/dist/doc/anchors.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports2.anchorIsValid = anchorIsValid;
    exports2.anchorNames = anchorNames;
    exports2.createNodeAnchors = createNodeAnchors;
    exports2.findNewAnchor = findNewAnchor;
  }
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/yaml/dist/doc/applyReviver.js"(exports2) {
    "use strict";
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports2.applyReviver = applyReviver;
  }
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/yaml/dist/nodes/toJS.js"(exports2) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports2.toJS = toJS;
  }
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/yaml/dist/nodes/Node.js"(exports2) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports2.NodeBase = NodeBase;
  }
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/yaml/dist/nodes/Alias.js"(exports2) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const { anchors: anchors2, doc, maxAliasCount } = ctx;
        const source = this.resolve(doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        let data = anchors2.get(source);
        if (!data) {
          toJS.toJS(source, null, ctx);
          data = anchors2.get(source);
        }
        if (data?.res === void 0) {
          const msg = "This should not happen: Alias anchor was not resolved?";
          throw new ReferenceError(msg);
        }
        if (maxAliasCount >= 0) {
          data.count += 1;
          if (data.aliasCount === 0)
            data.aliasCount = getAliasCount(doc, source, anchors2);
          if (data.count * data.aliasCount > maxAliasCount) {
            const msg = "Excessive alias count indicates a resource exhaustion attack";
            throw new ReferenceError(msg);
          }
        }
        return data.res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports2.Alias = Alias;
  }
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/yaml/dist/nodes/Scalar.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports2.Scalar = Scalar;
    exports2.isScalarValue = isScalarValue;
  }
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/yaml/dist/doc/createNode.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports2.createNode = createNode;
  }
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/yaml/dist/nodes/Collection.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path3, value) {
      let v = value;
      for (let i = path3.length - 1; i >= 0; --i) {
        const k = path3[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path3) => path3 == null || typeof path3 === "object" && !!path3[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path3, value) {
        if (isEmptyPath(path3))
          this.add(value);
        else {
          const [key, ...rest] = path3;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path3) {
        const [key, ...rest] = path3;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path3, keepScalar) {
        const [key, ...rest] = path3;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path3) {
        const [key, ...rest] = path3;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path3, value) {
        const [key, ...rest] = path3;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports2.Collection = Collection;
    exports2.collectionFromPath = collectionFromPath;
    exports2.isEmptyPath = isEmptyPath;
  }
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyComment.js"(exports2) {
    "use strict";
    var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
    exports2.indentComment = indentComment;
    exports2.lineComment = lineComment;
    exports2.stringifyComment = stringifyComment;
  }
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/yaml/dist/stringify/foldFlowLines.js"(exports2) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text2, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text2;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text2.length <= endStep)
        return text2;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text2, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text2[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text2[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text2, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text2[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text2[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text2;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text2;
      if (onFold)
        onFold();
      let res = text2.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text2.length;
        if (fold === 0)
          res = `
${indent}${text2.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text2[fold]}\\`;
          res += `
${indent}${text2.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text2, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text2[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text2[++i];
        } else {
          do {
            ch = text2[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text2[start];
        }
      }
      return end;
    }
    exports2.FOLD_BLOCK = FOLD_BLOCK;
    exports2.FOLD_FLOW = FOLD_FLOW;
    exports2.FOLD_QUOTED = FOLD_QUOTED;
    exports2.foldFlowLines = foldFlowLines;
  }
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyString.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
    function lineLengthOverLimit(str, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str += json.slice(start, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str += "\\0";
                    break;
                  case "0007":
                    str += "\\a";
                    break;
                  case "000b":
                    str += "\\v";
                    break;
                  case "001b":
                    str += "\\e";
                    break;
                  case "0085":
                    str += "\\N";
                    break;
                  case "00a0":
                    str += "\\_";
                    break;
                  case "2028":
                    str += "\\L";
                    break;
                  case "2029":
                    str += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str += "\\x" + code.substr(2);
                    else
                      str += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str += "\n";
                  i += 2;
                }
                str += indent;
                if (json[i + 2] === " ")
                  str += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str = start ? str + json.slice(start) : json;
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports2.stringifyString = stringifyString;
  }
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/yaml/dist/stringify/stringify.js"(exports2) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match = tags.filter((t) => t.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify2(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str;
      return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
    }
    exports2.createStringifyContext = createStringifyContext;
    exports2.stringify = stringify2;
  }
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyPair.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str = stringify2.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str === "" ? "?" : explicitKey ? `? ${str}` : str;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}
${indent}:`;
      } else {
        str = `${str}:`;
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify2.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str;
    }
    exports2.stringifyPair = stringifyPair;
  }
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/yaml/dist/log.js"(exports2) {
    "use strict";
    var node_process = require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports2.debug = debug;
    exports2.warn = warn;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports2.addMergeToJSMap = addMergeToJSMap;
    exports2.isMergeKey = isMergeKey;
    exports2.merge = merge;
  }
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports2) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify2 = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify2.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports2.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/yaml/dist/nodes/Pair.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports2.Pair = Pair;
    exports2.createPair = createPair;
  }
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyCollection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify3 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify3(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str2 = stringify2.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str2);
      }
      let str;
      if (lines.length === 0) {
        str = flowChars.start + flowChars.end;
      } else {
        str = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str = stringify2.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
        if (i < items.length - 1) {
          str += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str += ",";
          }
        }
        if (comment)
          str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        lines.push(str);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str = start;
          for (const line of lines)
            str += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports2.stringifyCollection = stringifyCollection;
  }
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLMap.js"(exports2) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports2.YAMLMap = YAMLMap;
    exports2.findPair = findPair;
  }
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/yaml/dist/schema/common/map.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports2.map = map;
  }
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLSeq.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it : String(i++);
              it = replacer.call(obj, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports2.YAMLSeq = YAMLSeq;
  }
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/yaml/dist/schema/common/seq.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports2.seq = seq;
  }
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/yaml/dist/schema/common/string.js"(exports2) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports2.string = string;
  }
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/yaml/dist/schema/common/null.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports2.nullTag = nullTag;
  }
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/yaml/dist/schema/core/bool.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports2.boolTag = boolTag;
  }
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyNumber.js"(exports2) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports2.stringifyNumber = stringifyNumber;
  }
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/yaml/dist/schema/core/float.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str));
        const dot = str.indexOf(".");
        if (dot !== -1 && str[str.length - 1] === "0")
          node.minFractionDigits = str.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports2.float = float;
    exports2.floatExp = floatExp;
    exports2.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/yaml/dist/schema/core/int.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports2.int = int;
    exports2.intHex = intHex;
    exports2.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/yaml/dist/schema/core/schema.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports2.schema = schema;
  }
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/yaml/dist/schema/json/schema.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str) => str,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str) => str === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str) => parseFloat(str),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports2.schema = schema;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports2) {
    "use strict";
    var node_buffer = require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str.length);
          for (let i = 0; i < str.length; ++i)
            buffer[i] = str.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str;
        if (typeof node_buffer.Buffer === "function") {
          str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str.substr(o, lineWidth);
          }
          str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
      }
    };
    exports2.binary = binary;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports2.createPairs = createPairs;
    exports2.pairs = pairs;
    exports2.resolvePairs = resolvePairs;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports2.YAMLOMap = YAMLOMap;
    exports2.omap = omap;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports2.falseTag = falseTag;
    exports2.trueTag = trueTag;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
        const dot = str.indexOf(".");
        if (dot !== -1) {
          const f = str.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports2.float = float;
    exports2.floatExp = floatExp;
    exports2.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str, offset, radix, { intAsBigInt }) {
      const sign = str[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str = str.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str = `0b${str}`;
            break;
          case 8:
            str = `0o${str}`;
            break;
          case 16:
            str = `0x${str}`;
            break;
        }
        const n2 = BigInt(str);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str = value.toString(radix);
        return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports2.int = int;
    exports2.intBin = intBin;
    exports2.intHex = intHex;
    exports2.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports2.YAMLSet = YAMLSet;
    exports2.set = set;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str, asBigInt) {
      const sign = str[0];
      const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n) => n;
      if (typeof value === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str) => parseSexagesimal(str, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str) {
        const match = str.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports2.floatTime = floatTime;
    exports2.intTime = intTime;
    exports2.timestamp = timestamp;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports2.schema = schema;
  }
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/yaml/dist/schema/tags.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports2.coreKnownTags = coreKnownTags;
    exports2.getTags = getTags;
  }
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/yaml/dist/schema/Schema.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports2.Schema = Schema;
  }
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyDocument.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify2.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify2.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify2.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports2.stringifyDocument = stringifyDocument;
  }
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/yaml/dist/doc/Document.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path3, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path3, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path3) {
        if (Collection.isEmptyPath(path3)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path3) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path3, keepScalar) {
        if (Collection.isEmptyPath(path3))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path3, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path3) {
        if (Collection.isEmptyPath(path3))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path3) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path3, value) {
        if (Collection.isEmptyPath(path3)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path3), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path3, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports2.Document = Document;
  }
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/yaml/dist/errors.js"(exports2) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports2.YAMLError = YAMLError;
    exports2.YAMLParseError = YAMLParseError;
    exports2.YAMLWarning = YAMLWarning;
    exports2.prettifyError = prettifyError;
  }
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/yaml/dist/compose/resolve-props.js"(exports2) {
    "use strict";
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports2.resolveProps = resolveProps;
  }
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/yaml/dist/compose/util-contains-newline.js"(exports2) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports2.containsNewline = containsNewline;
  }
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports2) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports2.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/yaml/dist/compose/util-map-includes.js"(exports2) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports2.mapIncludes = mapIncludes;
  }
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-map.js"(exports2) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports2.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-seq.js"(exports2) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports2.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/yaml/dist/compose/resolve-end.js"(exports2) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep + cb;
              sep = "";
              break;
            }
            case "newline":
              if (comment)
                sep += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports2.resolveEnd = resolveEnd;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep)
                for (const st of sep) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports2.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/yaml/dist/compose/compose-collection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports2.composeCollection = composeCollection;
  }
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep === " ")
            sep = "\n";
          else if (!prevMoreIndented && sep === "\n")
            sep = "\n\n";
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep === "\n")
            value += "\n";
          else
            sep = "\n";
        } else {
          value += sep + content;
          sep = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports2.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return foldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return foldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function foldLines(source) {
      let first, line;
      try {
        first = new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
        line = new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
      } catch {
        first = /(.*?)[ \t]*\r?\n/sy;
        line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
      }
      let match = first.exec(source);
      if (!match)
        return source;
      let res = match[1];
      let sep = " ";
      let pos = first.lastIndex;
      line.lastIndex = pos;
      while (match = line.exec(source)) {
        if (match[1] === "") {
          if (sep === "\n")
            res += sep;
          else
            sep = "\n";
        } else {
          res += sep + match[1];
          sep = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports2.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/yaml/dist/compose/compose-scalar.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports2.composeScalar = composeScalar;
  }
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports2) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports2.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/yaml/dist/compose/compose-node.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports2.composeEmptyNode = composeEmptyNode;
    exports2.composeNode = composeNode;
  }
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/yaml/dist/compose/compose-doc.js"(exports2) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports2.composeDoc = composeDoc;
  }
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/yaml/dist/compose/composer.js"(exports2) {
    "use strict";
    var node_process = require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i = 0; i < this.errors.length; ++i)
            doc.errors.push(this.errors[i]);
          for (let i = 0; i < this.warnings.length; ++i)
            doc.warnings.push(this.warnings[i]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports2.Composer = Composer;
  }
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/yaml/dist/parse/cst-scalar.js"(exports2) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports2.createScalarToken = createScalarToken;
    exports2.resolveAsScalar = resolveAsScalar;
    exports2.setScalarValue = setScalarValue;
  }
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/yaml/dist/parse/cst-stringify.js"(exports2) {
    "use strict";
    var stringify2 = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep)
        for (const st of sep)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports2.stringify = stringify2;
  }
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/yaml/dist/parse/cst-visit.js"(exports2) {
    "use strict";
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path3) => {
      let item = cst;
      for (const [field, index] of path3) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path3) => {
      const parent = visit.itemAtPath(cst, path3.slice(0, -1));
      const field = path3[path3.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path3, item, visitor) {
      let ctrl = visitor(item, path3);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path3.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path3);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path3) : ctrl;
    }
    exports2.visit = visit;
  }
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/yaml/dist/parse/cst.js"(exports2) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports2.createScalarToken = cstScalar.createScalarToken;
    exports2.resolveAsScalar = cstScalar.resolveAsScalar;
    exports2.setScalarValue = cstScalar.setScalarValue;
    exports2.stringify = cstStringify.stringify;
    exports2.visit = cstVisit.visit;
    exports2.BOM = BOM;
    exports2.DOCUMENT = DOCUMENT;
    exports2.FLOW_END = FLOW_END;
    exports2.SCALAR = SCALAR;
    exports2.isCollection = isCollection;
    exports2.isScalar = isScalar;
    exports2.prettyToken = prettyToken;
    exports2.tokenType = tokenType;
  }
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/yaml/dist/parse/lexer.js"(exports2) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports2.Lexer = Lexer;
  }
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/yaml/dist/parse/line-counter.js"(exports2) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports2.LineCounter = LineCounter;
  }
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/yaml/dist/parse/parser.js"(exports2) {
    "use strict";
    var node_process = require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type) {
      for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i = 0; i < source.length; ++i)
          target.push(source[i]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep;
          if (scalar.end) {
            sep = scalar.end;
            sep.push(this.sourceToken);
            delete scalar.end;
          } else
            sep = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep = it.sep;
                  sep.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs);
              } else {
                Object.assign(it, { key: fs, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs, sep: [] });
              else if (it.sep)
                this.stack.push(fs);
              else
                Object.assign(it, { key: fs, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep = fc.end.splice(1, fc.end.length);
            sep.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports2.Parser = Parser;
  }
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/yaml/dist/public-api.js"(exports2) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse2(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify2(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports2.parse = parse2;
    exports2.parseAllDocuments = parseAllDocuments;
    exports2.parseDocument = parseDocument;
    exports2.stringify = stringify2;
  }
});

// node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/yaml/dist/index.js"(exports2) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports2.Composer = composer.Composer;
    exports2.Document = Document.Document;
    exports2.Schema = Schema.Schema;
    exports2.YAMLError = errors.YAMLError;
    exports2.YAMLParseError = errors.YAMLParseError;
    exports2.YAMLWarning = errors.YAMLWarning;
    exports2.Alias = Alias.Alias;
    exports2.isAlias = identity.isAlias;
    exports2.isCollection = identity.isCollection;
    exports2.isDocument = identity.isDocument;
    exports2.isMap = identity.isMap;
    exports2.isNode = identity.isNode;
    exports2.isPair = identity.isPair;
    exports2.isScalar = identity.isScalar;
    exports2.isSeq = identity.isSeq;
    exports2.Pair = Pair.Pair;
    exports2.Scalar = Scalar.Scalar;
    exports2.YAMLMap = YAMLMap.YAMLMap;
    exports2.YAMLSeq = YAMLSeq.YAMLSeq;
    exports2.CST = cst;
    exports2.Lexer = lexer.Lexer;
    exports2.LineCounter = lineCounter.LineCounter;
    exports2.Parser = parser.Parser;
    exports2.parse = publicApi.parse;
    exports2.parseAllDocuments = publicApi.parseAllDocuments;
    exports2.parseDocument = publicApi.parseDocument;
    exports2.stringify = publicApi.stringify;
    exports2.visit = visit.visit;
    exports2.visitAsync = visit.visitAsync;
  }
});

// node_modules/xmlchars/xml/1.0/ed5.js
var require_ed5 = __commonJS({
  "node_modules/xmlchars/xml/1.0/ed5.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.CHAR = "	\n\r -\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}";
    exports2.S = " 	\r\n";
    exports2.NAME_START_CHAR = ":A-Z_a-z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}";
    exports2.NAME_CHAR = "-" + exports2.NAME_START_CHAR + ".0-9\xB7\u0300-\u036F\u203F-\u2040";
    exports2.CHAR_RE = new RegExp("^[" + exports2.CHAR + "]$", "u");
    exports2.S_RE = new RegExp("^[" + exports2.S + "]+$", "u");
    exports2.NAME_START_CHAR_RE = new RegExp("^[" + exports2.NAME_START_CHAR + "]$", "u");
    exports2.NAME_CHAR_RE = new RegExp("^[" + exports2.NAME_CHAR + "]$", "u");
    exports2.NAME_RE = new RegExp("^[" + exports2.NAME_START_CHAR + "][" + exports2.NAME_CHAR + "]*$", "u");
    exports2.NMTOKEN_RE = new RegExp("^[" + exports2.NAME_CHAR + "]+$", "u");
    var TAB = 9;
    var NL = 10;
    var CR = 13;
    var SPACE = 32;
    exports2.S_LIST = [SPACE, NL, CR, TAB];
    function isChar(c) {
      return c >= SPACE && c <= 55295 || c === NL || c === CR || c === TAB || c >= 57344 && c <= 65533 || c >= 65536 && c <= 1114111;
    }
    exports2.isChar = isChar;
    function isS(c) {
      return c === SPACE || c === NL || c === CR || c === TAB;
    }
    exports2.isS = isS;
    function isNameStartChar(c) {
      return c >= 65 && c <= 90 || c >= 97 && c <= 122 || c === 58 || c === 95 || c === 8204 || c === 8205 || c >= 192 && c <= 214 || c >= 216 && c <= 246 || c >= 248 && c <= 767 || c >= 880 && c <= 893 || c >= 895 && c <= 8191 || c >= 8304 && c <= 8591 || c >= 11264 && c <= 12271 || c >= 12289 && c <= 55295 || c >= 63744 && c <= 64975 || c >= 65008 && c <= 65533 || c >= 65536 && c <= 983039;
    }
    exports2.isNameStartChar = isNameStartChar;
    function isNameChar(c) {
      return isNameStartChar(c) || c >= 48 && c <= 57 || c === 45 || c === 46 || c === 183 || c >= 768 && c <= 879 || c >= 8255 && c <= 8256;
    }
    exports2.isNameChar = isNameChar;
  }
});

// node_modules/xmlchars/xml/1.1/ed2.js
var require_ed2 = __commonJS({
  "node_modules/xmlchars/xml/1.1/ed2.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.CHAR = "-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}";
    exports2.RESTRICTED_CHAR = "-\b\v\f-\x7F-\x84\x86-\x9F";
    exports2.S = " 	\r\n";
    exports2.NAME_START_CHAR = ":A-Z_a-z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}";
    exports2.NAME_CHAR = "-" + exports2.NAME_START_CHAR + ".0-9\xB7\u0300-\u036F\u203F-\u2040";
    exports2.CHAR_RE = new RegExp("^[" + exports2.CHAR + "]$", "u");
    exports2.RESTRICTED_CHAR_RE = new RegExp("^[" + exports2.RESTRICTED_CHAR + "]$", "u");
    exports2.S_RE = new RegExp("^[" + exports2.S + "]+$", "u");
    exports2.NAME_START_CHAR_RE = new RegExp("^[" + exports2.NAME_START_CHAR + "]$", "u");
    exports2.NAME_CHAR_RE = new RegExp("^[" + exports2.NAME_CHAR + "]$", "u");
    exports2.NAME_RE = new RegExp("^[" + exports2.NAME_START_CHAR + "][" + exports2.NAME_CHAR + "]*$", "u");
    exports2.NMTOKEN_RE = new RegExp("^[" + exports2.NAME_CHAR + "]+$", "u");
    var TAB = 9;
    var NL = 10;
    var CR = 13;
    var SPACE = 32;
    exports2.S_LIST = [SPACE, NL, CR, TAB];
    function isChar(c) {
      return c >= 1 && c <= 55295 || c >= 57344 && c <= 65533 || c >= 65536 && c <= 1114111;
    }
    exports2.isChar = isChar;
    function isRestrictedChar(c) {
      return c >= 1 && c <= 8 || c === 11 || c === 12 || c >= 14 && c <= 31 || c >= 127 && c <= 132 || c >= 134 && c <= 159;
    }
    exports2.isRestrictedChar = isRestrictedChar;
    function isCharAndNotRestricted(c) {
      return c === 9 || c === 10 || c === 13 || c > 31 && c < 127 || c === 133 || c > 159 && c <= 55295 || c >= 57344 && c <= 65533 || c >= 65536 && c <= 1114111;
    }
    exports2.isCharAndNotRestricted = isCharAndNotRestricted;
    function isS(c) {
      return c === SPACE || c === NL || c === CR || c === TAB;
    }
    exports2.isS = isS;
    function isNameStartChar(c) {
      return c >= 65 && c <= 90 || c >= 97 && c <= 122 || c === 58 || c === 95 || c === 8204 || c === 8205 || c >= 192 && c <= 214 || c >= 216 && c <= 246 || c >= 248 && c <= 767 || c >= 880 && c <= 893 || c >= 895 && c <= 8191 || c >= 8304 && c <= 8591 || c >= 11264 && c <= 12271 || c >= 12289 && c <= 55295 || c >= 63744 && c <= 64975 || c >= 65008 && c <= 65533 || c >= 65536 && c <= 983039;
    }
    exports2.isNameStartChar = isNameStartChar;
    function isNameChar(c) {
      return isNameStartChar(c) || c >= 48 && c <= 57 || c === 45 || c === 46 || c === 183 || c >= 768 && c <= 879 || c >= 8255 && c <= 8256;
    }
    exports2.isNameChar = isNameChar;
  }
});

// node_modules/xmlchars/xmlns/1.0/ed3.js
var require_ed3 = __commonJS({
  "node_modules/xmlchars/xmlns/1.0/ed3.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.NC_NAME_START_CHAR = "A-Z_a-z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}";
    exports2.NC_NAME_CHAR = "-" + exports2.NC_NAME_START_CHAR + ".0-9\xB7\u0300-\u036F\u203F-\u2040";
    exports2.NC_NAME_START_CHAR_RE = new RegExp("^[" + exports2.NC_NAME_START_CHAR + "]$", "u");
    exports2.NC_NAME_CHAR_RE = new RegExp("^[" + exports2.NC_NAME_CHAR + "]$", "u");
    exports2.NC_NAME_RE = new RegExp("^[" + exports2.NC_NAME_START_CHAR + "][" + exports2.NC_NAME_CHAR + "]*$", "u");
    function isNCNameStartChar(c) {
      return c >= 65 && c <= 90 || c === 95 || c >= 97 && c <= 122 || c >= 192 && c <= 214 || c >= 216 && c <= 246 || c >= 248 && c <= 767 || c >= 880 && c <= 893 || c >= 895 && c <= 8191 || c >= 8204 && c <= 8205 || c >= 8304 && c <= 8591 || c >= 11264 && c <= 12271 || c >= 12289 && c <= 55295 || c >= 63744 && c <= 64975 || c >= 65008 && c <= 65533 || c >= 65536 && c <= 983039;
    }
    exports2.isNCNameStartChar = isNCNameStartChar;
    function isNCNameChar(c) {
      return isNCNameStartChar(c) || (c === 45 || c === 46 || c >= 48 && c <= 57 || c === 183 || c >= 768 && c <= 879 || c >= 8255 && c <= 8256);
    }
    exports2.isNCNameChar = isNCNameChar;
  }
});

// node_modules/saxes/saxes.js
var require_saxes = __commonJS({
  "node_modules/saxes/saxes.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.SaxesParser = exports2.EVENTS = void 0;
    var ed5 = require_ed5();
    var ed2 = require_ed2();
    var NSed3 = require_ed3();
    var isS = ed5.isS;
    var isChar10 = ed5.isChar;
    var isNameStartChar = ed5.isNameStartChar;
    var isNameChar = ed5.isNameChar;
    var S_LIST = ed5.S_LIST;
    var NAME_RE = ed5.NAME_RE;
    var isChar11 = ed2.isChar;
    var isNCNameStartChar = NSed3.isNCNameStartChar;
    var isNCNameChar = NSed3.isNCNameChar;
    var NC_NAME_RE = NSed3.NC_NAME_RE;
    var XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
    var XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
    var rootNS = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      __proto__: null,
      xml: XML_NAMESPACE,
      xmlns: XMLNS_NAMESPACE
    };
    var XML_ENTITIES = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      __proto__: null,
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'"
    };
    var EOC = -1;
    var NL_LIKE = -2;
    var S_BEGIN = 0;
    var S_BEGIN_WHITESPACE = 1;
    var S_DOCTYPE = 2;
    var S_DOCTYPE_QUOTE = 3;
    var S_DTD = 4;
    var S_DTD_QUOTED = 5;
    var S_DTD_OPEN_WAKA = 6;
    var S_DTD_OPEN_WAKA_BANG = 7;
    var S_DTD_COMMENT = 8;
    var S_DTD_COMMENT_ENDING = 9;
    var S_DTD_COMMENT_ENDED = 10;
    var S_DTD_PI = 11;
    var S_DTD_PI_ENDING = 12;
    var S_TEXT = 13;
    var S_ENTITY = 14;
    var S_OPEN_WAKA = 15;
    var S_OPEN_WAKA_BANG = 16;
    var S_COMMENT = 17;
    var S_COMMENT_ENDING = 18;
    var S_COMMENT_ENDED = 19;
    var S_CDATA = 20;
    var S_CDATA_ENDING = 21;
    var S_CDATA_ENDING_2 = 22;
    var S_PI_FIRST_CHAR = 23;
    var S_PI_REST = 24;
    var S_PI_BODY = 25;
    var S_PI_ENDING = 26;
    var S_XML_DECL_NAME_START = 27;
    var S_XML_DECL_NAME = 28;
    var S_XML_DECL_EQ = 29;
    var S_XML_DECL_VALUE_START = 30;
    var S_XML_DECL_VALUE = 31;
    var S_XML_DECL_SEPARATOR = 32;
    var S_XML_DECL_ENDING = 33;
    var S_OPEN_TAG = 34;
    var S_OPEN_TAG_SLASH = 35;
    var S_ATTRIB = 36;
    var S_ATTRIB_NAME = 37;
    var S_ATTRIB_NAME_SAW_WHITE = 38;
    var S_ATTRIB_VALUE = 39;
    var S_ATTRIB_VALUE_QUOTED = 40;
    var S_ATTRIB_VALUE_CLOSED = 41;
    var S_ATTRIB_VALUE_UNQUOTED = 42;
    var S_CLOSE_TAG = 43;
    var S_CLOSE_TAG_SAW_WHITE = 44;
    var TAB = 9;
    var NL = 10;
    var CR = 13;
    var SPACE = 32;
    var BANG = 33;
    var DQUOTE = 34;
    var AMP = 38;
    var SQUOTE = 39;
    var MINUS = 45;
    var FORWARD_SLASH = 47;
    var SEMICOLON = 59;
    var LESS = 60;
    var EQUAL = 61;
    var GREATER = 62;
    var QUESTION = 63;
    var OPEN_BRACKET = 91;
    var CLOSE_BRACKET = 93;
    var NEL = 133;
    var LS = 8232;
    var isQuote = (c) => c === DQUOTE || c === SQUOTE;
    var QUOTES = [DQUOTE, SQUOTE];
    var DOCTYPE_TERMINATOR = [...QUOTES, OPEN_BRACKET, GREATER];
    var DTD_TERMINATOR = [...QUOTES, LESS, CLOSE_BRACKET];
    var XML_DECL_NAME_TERMINATOR = [EQUAL, QUESTION, ...S_LIST];
    var ATTRIB_VALUE_UNQUOTED_TERMINATOR = [...S_LIST, GREATER, AMP, LESS];
    function nsPairCheck(parser, prefix, uri) {
      switch (prefix) {
        case "xml":
          if (uri !== XML_NAMESPACE) {
            parser.fail(`xml prefix must be bound to ${XML_NAMESPACE}.`);
          }
          break;
        case "xmlns":
          if (uri !== XMLNS_NAMESPACE) {
            parser.fail(`xmlns prefix must be bound to ${XMLNS_NAMESPACE}.`);
          }
          break;
        default:
      }
      switch (uri) {
        case XMLNS_NAMESPACE:
          parser.fail(prefix === "" ? `the default namespace may not be set to ${uri}.` : `may not assign a prefix (even "xmlns") to the URI ${XMLNS_NAMESPACE}.`);
          break;
        case XML_NAMESPACE:
          switch (prefix) {
            case "xml":
              break;
            case "":
              parser.fail(`the default namespace may not be set to ${uri}.`);
              break;
            default:
              parser.fail("may not assign the xml namespace to another prefix.");
          }
          break;
        default:
      }
    }
    function nsMappingCheck(parser, mapping) {
      for (const local of Object.keys(mapping)) {
        nsPairCheck(parser, local, mapping[local]);
      }
    }
    var isNCName = (name) => NC_NAME_RE.test(name);
    var isName = (name) => NAME_RE.test(name);
    var FORBIDDEN_START = 0;
    var FORBIDDEN_BRACKET = 1;
    var FORBIDDEN_BRACKET_BRACKET = 2;
    exports2.EVENTS = [
      "xmldecl",
      "text",
      "processinginstruction",
      "doctype",
      "comment",
      "opentagstart",
      "attribute",
      "opentag",
      "closetag",
      "cdata",
      "error",
      "end",
      "ready"
    ];
    var EVENT_NAME_TO_HANDLER_NAME = {
      xmldecl: "xmldeclHandler",
      text: "textHandler",
      processinginstruction: "piHandler",
      doctype: "doctypeHandler",
      comment: "commentHandler",
      opentagstart: "openTagStartHandler",
      attribute: "attributeHandler",
      opentag: "openTagHandler",
      closetag: "closeTagHandler",
      cdata: "cdataHandler",
      error: "errorHandler",
      end: "endHandler",
      ready: "readyHandler"
    };
    var SaxesParser2 = class {
      /**
       * @param opt The parser options.
       */
      constructor(opt) {
        this.opt = opt !== null && opt !== void 0 ? opt : {};
        this.fragmentOpt = !!this.opt.fragment;
        const xmlnsOpt = this.xmlnsOpt = !!this.opt.xmlns;
        this.trackPosition = this.opt.position !== false;
        this.fileName = this.opt.fileName;
        if (xmlnsOpt) {
          this.nameStartCheck = isNCNameStartChar;
          this.nameCheck = isNCNameChar;
          this.isName = isNCName;
          this.processAttribs = this.processAttribsNS;
          this.pushAttrib = this.pushAttribNS;
          this.ns = Object.assign({ __proto__: null }, rootNS);
          const additional = this.opt.additionalNamespaces;
          if (additional != null) {
            nsMappingCheck(this, additional);
            Object.assign(this.ns, additional);
          }
        } else {
          this.nameStartCheck = isNameStartChar;
          this.nameCheck = isNameChar;
          this.isName = isName;
          this.processAttribs = this.processAttribsPlain;
          this.pushAttrib = this.pushAttribPlain;
        }
        this.stateTable = [
          /* eslint-disable @typescript-eslint/unbound-method */
          this.sBegin,
          this.sBeginWhitespace,
          this.sDoctype,
          this.sDoctypeQuote,
          this.sDTD,
          this.sDTDQuoted,
          this.sDTDOpenWaka,
          this.sDTDOpenWakaBang,
          this.sDTDComment,
          this.sDTDCommentEnding,
          this.sDTDCommentEnded,
          this.sDTDPI,
          this.sDTDPIEnding,
          this.sText,
          this.sEntity,
          this.sOpenWaka,
          this.sOpenWakaBang,
          this.sComment,
          this.sCommentEnding,
          this.sCommentEnded,
          this.sCData,
          this.sCDataEnding,
          this.sCDataEnding2,
          this.sPIFirstChar,
          this.sPIRest,
          this.sPIBody,
          this.sPIEnding,
          this.sXMLDeclNameStart,
          this.sXMLDeclName,
          this.sXMLDeclEq,
          this.sXMLDeclValueStart,
          this.sXMLDeclValue,
          this.sXMLDeclSeparator,
          this.sXMLDeclEnding,
          this.sOpenTag,
          this.sOpenTagSlash,
          this.sAttrib,
          this.sAttribName,
          this.sAttribNameSawWhite,
          this.sAttribValue,
          this.sAttribValueQuoted,
          this.sAttribValueClosed,
          this.sAttribValueUnquoted,
          this.sCloseTag,
          this.sCloseTagSawWhite
          /* eslint-enable @typescript-eslint/unbound-method */
        ];
        this._init();
      }
      /**
       * Indicates whether or not the parser is closed. If ``true``, wait for
       * the ``ready`` event to write again.
       */
      get closed() {
        return this._closed;
      }
      _init() {
        var _a;
        this.openWakaBang = "";
        this.text = "";
        this.name = "";
        this.piTarget = "";
        this.entity = "";
        this.q = null;
        this.tags = [];
        this.tag = null;
        this.topNS = null;
        this.chunk = "";
        this.chunkPosition = 0;
        this.i = 0;
        this.prevI = 0;
        this.carriedFromPrevious = void 0;
        this.forbiddenState = FORBIDDEN_START;
        this.attribList = [];
        const { fragmentOpt } = this;
        this.state = fragmentOpt ? S_TEXT : S_BEGIN;
        this.reportedTextBeforeRoot = this.reportedTextAfterRoot = this.closedRoot = this.sawRoot = fragmentOpt;
        this.xmlDeclPossible = !fragmentOpt;
        this.xmlDeclExpects = ["version"];
        this.entityReturnState = void 0;
        let { defaultXMLVersion } = this.opt;
        if (defaultXMLVersion === void 0) {
          if (this.opt.forceXMLVersion === true) {
            throw new Error("forceXMLVersion set but defaultXMLVersion is not set");
          }
          defaultXMLVersion = "1.0";
        }
        this.setXMLVersion(defaultXMLVersion);
        this.positionAtNewLine = 0;
        this.doctype = false;
        this._closed = false;
        this.xmlDecl = {
          version: void 0,
          encoding: void 0,
          standalone: void 0
        };
        this.line = 1;
        this.column = 0;
        this.ENTITIES = Object.create(XML_ENTITIES);
        (_a = this.readyHandler) === null || _a === void 0 ? void 0 : _a.call(this);
      }
      /**
       * The stream position the parser is currently looking at. This field is
       * zero-based.
       *
       * This field is not based on counting Unicode characters but is to be
       * interpreted as a plain index into a JavaScript string.
       */
      get position() {
        return this.chunkPosition + this.i;
      }
      /**
       * The column number of the next character to be read by the parser.  *
       * This field is zero-based. (The first column in a line is 0.)
       *
       * This field reports the index at which the next character would be in the
       * line if the line were represented as a JavaScript string.  Note that this
       * *can* be different to a count based on the number of *Unicode characters*
       * due to how JavaScript handles astral plane characters.
       *
       * See [[column]] for a number that corresponds to a count of Unicode
       * characters.
       */
      get columnIndex() {
        return this.position - this.positionAtNewLine;
      }
      /**
       * Set an event listener on an event. The parser supports one handler per
       * event type. If you try to set an event handler over an existing handler,
       * the old handler is silently overwritten.
       *
       * @param name The event to listen to.
       *
       * @param handler The handler to set.
       */
      on(name, handler) {
        this[EVENT_NAME_TO_HANDLER_NAME[name]] = handler;
      }
      /**
       * Unset an event handler.
       *
       * @parma name The event to stop listening to.
       */
      off(name) {
        this[EVENT_NAME_TO_HANDLER_NAME[name]] = void 0;
      }
      /**
       * Make an error object. The error object will have a message that contains
       * the ``fileName`` option passed at the creation of the parser. If position
       * tracking was turned on, it will also have line and column number
       * information.
       *
       * @param message The message describing the error to report.
       *
       * @returns An error object with a properly formatted message.
       */
      makeError(message) {
        var _a;
        let msg = (_a = this.fileName) !== null && _a !== void 0 ? _a : "";
        if (this.trackPosition) {
          if (msg.length > 0) {
            msg += ":";
          }
          msg += `${this.line}:${this.column}`;
        }
        if (msg.length > 0) {
          msg += ": ";
        }
        return new Error(msg + message);
      }
      /**
       * Report a parsing error. This method is made public so that client code may
       * check for issues that are outside the scope of this project and can report
       * errors.
       *
       * @param message The error to report.
       *
       * @returns this
       */
      fail(message) {
        const err = this.makeError(message);
        const handler = this.errorHandler;
        if (handler === void 0) {
          throw err;
        } else {
          handler(err);
        }
        return this;
      }
      /**
       * Write a XML data to the parser.
       *
       * @param chunk The XML data to write.
       *
       * @returns this
       */
      // We do need object for the type here. Yes, it often causes problems
      // but not in this case.
      write(chunk) {
        if (this.closed) {
          return this.fail("cannot write after close; assign an onready handler.");
        }
        let end = false;
        if (chunk === null) {
          end = true;
          chunk = "";
        } else if (typeof chunk === "object") {
          chunk = chunk.toString();
        }
        if (this.carriedFromPrevious !== void 0) {
          chunk = `${this.carriedFromPrevious}${chunk}`;
          this.carriedFromPrevious = void 0;
        }
        let limit = chunk.length;
        const lastCode = chunk.charCodeAt(limit - 1);
        if (!end && // A trailing CR or surrogate must be carried over to the next
        // chunk.
        (lastCode === CR || lastCode >= 55296 && lastCode <= 56319)) {
          this.carriedFromPrevious = chunk[limit - 1];
          limit--;
          chunk = chunk.slice(0, limit);
        }
        const { stateTable } = this;
        this.chunk = chunk;
        this.i = 0;
        while (this.i < limit) {
          stateTable[this.state].call(this);
        }
        this.chunkPosition += limit;
        return end ? this.end() : this;
      }
      /**
       * Close the current stream. Perform final well-formedness checks and reset
       * the parser tstate.
       *
       * @returns this
       */
      close() {
        return this.write(null);
      }
      /**
       * Get a single code point out of the current chunk. This updates the current
       * position if we do position tracking.
       *
       * This is the algorithm to use for XML 1.0.
       *
       * @returns The character read.
       */
      getCode10() {
        const { chunk, i } = this;
        this.prevI = i;
        this.i = i + 1;
        if (i >= chunk.length) {
          return EOC;
        }
        const code = chunk.charCodeAt(i);
        this.column++;
        if (code < 55296) {
          if (code >= SPACE || code === TAB) {
            return code;
          }
          switch (code) {
            case NL:
              this.line++;
              this.column = 0;
              this.positionAtNewLine = this.position;
              return NL;
            case CR:
              if (chunk.charCodeAt(i + 1) === NL) {
                this.i = i + 2;
              }
              this.line++;
              this.column = 0;
              this.positionAtNewLine = this.position;
              return NL_LIKE;
            default:
              this.fail("disallowed character.");
              return code;
          }
        }
        if (code > 56319) {
          if (!(code >= 57344 && code <= 65533)) {
            this.fail("disallowed character.");
          }
          return code;
        }
        const final = 65536 + (code - 55296) * 1024 + (chunk.charCodeAt(i + 1) - 56320);
        this.i = i + 2;
        if (final > 1114111) {
          this.fail("disallowed character.");
        }
        return final;
      }
      /**
       * Get a single code point out of the current chunk. This updates the current
       * position if we do position tracking.
       *
       * This is the algorithm to use for XML 1.1.
       *
       * @returns {number} The character read.
       */
      getCode11() {
        const { chunk, i } = this;
        this.prevI = i;
        this.i = i + 1;
        if (i >= chunk.length) {
          return EOC;
        }
        const code = chunk.charCodeAt(i);
        this.column++;
        if (code < 55296) {
          if (code > 31 && code < 127 || code > 159 && code !== LS || code === TAB) {
            return code;
          }
          switch (code) {
            case NL:
              this.line++;
              this.column = 0;
              this.positionAtNewLine = this.position;
              return NL;
            case CR: {
              const next = chunk.charCodeAt(i + 1);
              if (next === NL || next === NEL) {
                this.i = i + 2;
              }
            }
            /* yes, fall through */
            case NEL:
            // 0x85
            case LS:
              this.line++;
              this.column = 0;
              this.positionAtNewLine = this.position;
              return NL_LIKE;
            default:
              this.fail("disallowed character.");
              return code;
          }
        }
        if (code > 56319) {
          if (!(code >= 57344 && code <= 65533)) {
            this.fail("disallowed character.");
          }
          return code;
        }
        const final = 65536 + (code - 55296) * 1024 + (chunk.charCodeAt(i + 1) - 56320);
        this.i = i + 2;
        if (final > 1114111) {
          this.fail("disallowed character.");
        }
        return final;
      }
      /**
       * Like ``getCode`` but with the return value normalized so that ``NL`` is
       * returned for ``NL_LIKE``.
       */
      getCodeNorm() {
        const c = this.getCode();
        return c === NL_LIKE ? NL : c;
      }
      unget() {
        this.i = this.prevI;
        this.column--;
      }
      /**
       * Capture characters into a buffer until encountering one of a set of
       * characters.
       *
       * @param chars An array of codepoints. Encountering a character in the array
       * ends the capture. (``chars`` may safely contain ``NL``.)
       *
       * @return The character code that made the capture end, or ``EOC`` if we hit
       * the end of the chunk. The return value cannot be NL_LIKE: NL is returned
       * instead.
       */
      captureTo(chars) {
        let { i: start } = this;
        const { chunk } = this;
        while (true) {
          const c = this.getCode();
          const isNLLike = c === NL_LIKE;
          const final = isNLLike ? NL : c;
          if (final === EOC || chars.includes(final)) {
            this.text += chunk.slice(start, this.prevI);
            return final;
          }
          if (isNLLike) {
            this.text += `${chunk.slice(start, this.prevI)}
`;
            start = this.i;
          }
        }
      }
      /**
       * Capture characters into a buffer until encountering a character.
       *
       * @param char The codepoint that ends the capture. **NOTE ``char`` MAY NOT
       * CONTAIN ``NL``.** Passing ``NL`` will result in buggy behavior.
       *
       * @return ``true`` if we ran into the character. Otherwise, we ran into the
       * end of the current chunk.
       */
      captureToChar(char) {
        let { i: start } = this;
        const { chunk } = this;
        while (true) {
          let c = this.getCode();
          switch (c) {
            case NL_LIKE:
              this.text += `${chunk.slice(start, this.prevI)}
`;
              start = this.i;
              c = NL;
              break;
            case EOC:
              this.text += chunk.slice(start);
              return false;
            default:
          }
          if (c === char) {
            this.text += chunk.slice(start, this.prevI);
            return true;
          }
        }
      }
      /**
       * Capture characters that satisfy ``isNameChar`` into the ``name`` field of
       * this parser.
       *
       * @return The character code that made the test fail, or ``EOC`` if we hit
       * the end of the chunk. The return value cannot be NL_LIKE: NL is returned
       * instead.
       */
      captureNameChars() {
        const { chunk, i: start } = this;
        while (true) {
          const c = this.getCode();
          if (c === EOC) {
            this.name += chunk.slice(start);
            return EOC;
          }
          if (!isNameChar(c)) {
            this.name += chunk.slice(start, this.prevI);
            return c === NL_LIKE ? NL : c;
          }
        }
      }
      /**
       * Skip white spaces.
       *
       * @return The character that ended the skip, or ``EOC`` if we hit
       * the end of the chunk. The return value cannot be NL_LIKE: NL is returned
       * instead.
       */
      skipSpaces() {
        while (true) {
          const c = this.getCodeNorm();
          if (c === EOC || !isS(c)) {
            return c;
          }
        }
      }
      setXMLVersion(version) {
        this.currentXMLVersion = version;
        if (version === "1.0") {
          this.isChar = isChar10;
          this.getCode = this.getCode10;
        } else {
          this.isChar = isChar11;
          this.getCode = this.getCode11;
        }
      }
      // STATE ENGINE METHODS
      // This needs to be a state separate from S_BEGIN_WHITESPACE because we want
      // to be sure never to come back to this state later.
      sBegin() {
        if (this.chunk.charCodeAt(0) === 65279) {
          this.i++;
          this.column++;
        }
        this.state = S_BEGIN_WHITESPACE;
      }
      sBeginWhitespace() {
        const iBefore = this.i;
        const c = this.skipSpaces();
        if (this.prevI !== iBefore) {
          this.xmlDeclPossible = false;
        }
        switch (c) {
          case LESS:
            this.state = S_OPEN_WAKA;
            if (this.text.length !== 0) {
              throw new Error("no-empty text at start");
            }
            break;
          case EOC:
            break;
          default:
            this.unget();
            this.state = S_TEXT;
            this.xmlDeclPossible = false;
        }
      }
      sDoctype() {
        var _a;
        const c = this.captureTo(DOCTYPE_TERMINATOR);
        switch (c) {
          case GREATER: {
            (_a = this.doctypeHandler) === null || _a === void 0 ? void 0 : _a.call(this, this.text);
            this.text = "";
            this.state = S_TEXT;
            this.doctype = true;
            break;
          }
          case EOC:
            break;
          default:
            this.text += String.fromCodePoint(c);
            if (c === OPEN_BRACKET) {
              this.state = S_DTD;
            } else if (isQuote(c)) {
              this.state = S_DOCTYPE_QUOTE;
              this.q = c;
            }
        }
      }
      sDoctypeQuote() {
        const q = this.q;
        if (this.captureToChar(q)) {
          this.text += String.fromCodePoint(q);
          this.q = null;
          this.state = S_DOCTYPE;
        }
      }
      sDTD() {
        const c = this.captureTo(DTD_TERMINATOR);
        if (c === EOC) {
          return;
        }
        this.text += String.fromCodePoint(c);
        if (c === CLOSE_BRACKET) {
          this.state = S_DOCTYPE;
        } else if (c === LESS) {
          this.state = S_DTD_OPEN_WAKA;
        } else if (isQuote(c)) {
          this.state = S_DTD_QUOTED;
          this.q = c;
        }
      }
      sDTDQuoted() {
        const q = this.q;
        if (this.captureToChar(q)) {
          this.text += String.fromCodePoint(q);
          this.state = S_DTD;
          this.q = null;
        }
      }
      sDTDOpenWaka() {
        const c = this.getCodeNorm();
        this.text += String.fromCodePoint(c);
        switch (c) {
          case BANG:
            this.state = S_DTD_OPEN_WAKA_BANG;
            this.openWakaBang = "";
            break;
          case QUESTION:
            this.state = S_DTD_PI;
            break;
          default:
            this.state = S_DTD;
        }
      }
      sDTDOpenWakaBang() {
        const char = String.fromCodePoint(this.getCodeNorm());
        const owb = this.openWakaBang += char;
        this.text += char;
        if (owb !== "-") {
          this.state = owb === "--" ? S_DTD_COMMENT : S_DTD;
          this.openWakaBang = "";
        }
      }
      sDTDComment() {
        if (this.captureToChar(MINUS)) {
          this.text += "-";
          this.state = S_DTD_COMMENT_ENDING;
        }
      }
      sDTDCommentEnding() {
        const c = this.getCodeNorm();
        this.text += String.fromCodePoint(c);
        this.state = c === MINUS ? S_DTD_COMMENT_ENDED : S_DTD_COMMENT;
      }
      sDTDCommentEnded() {
        const c = this.getCodeNorm();
        this.text += String.fromCodePoint(c);
        if (c === GREATER) {
          this.state = S_DTD;
        } else {
          this.fail("malformed comment.");
          this.state = S_DTD_COMMENT;
        }
      }
      sDTDPI() {
        if (this.captureToChar(QUESTION)) {
          this.text += "?";
          this.state = S_DTD_PI_ENDING;
        }
      }
      sDTDPIEnding() {
        const c = this.getCodeNorm();
        this.text += String.fromCodePoint(c);
        if (c === GREATER) {
          this.state = S_DTD;
        }
      }
      sText() {
        if (this.tags.length !== 0) {
          this.handleTextInRoot();
        } else {
          this.handleTextOutsideRoot();
        }
      }
      sEntity() {
        let { i: start } = this;
        const { chunk } = this;
        loop:
          while (true) {
            switch (this.getCode()) {
              case NL_LIKE:
                this.entity += `${chunk.slice(start, this.prevI)}
`;
                start = this.i;
                break;
              case SEMICOLON: {
                const { entityReturnState } = this;
                const entity = this.entity + chunk.slice(start, this.prevI);
                this.state = entityReturnState;
                let parsed;
                if (entity === "") {
                  this.fail("empty entity name.");
                  parsed = "&;";
                } else {
                  parsed = this.parseEntity(entity);
                  this.entity = "";
                }
                if (entityReturnState !== S_TEXT || this.textHandler !== void 0) {
                  this.text += parsed;
                }
                break loop;
              }
              case EOC:
                this.entity += chunk.slice(start);
                break loop;
              default:
            }
          }
      }
      sOpenWaka() {
        const c = this.getCode();
        if (isNameStartChar(c)) {
          this.state = S_OPEN_TAG;
          this.unget();
          this.xmlDeclPossible = false;
        } else {
          switch (c) {
            case FORWARD_SLASH:
              this.state = S_CLOSE_TAG;
              this.xmlDeclPossible = false;
              break;
            case BANG:
              this.state = S_OPEN_WAKA_BANG;
              this.openWakaBang = "";
              this.xmlDeclPossible = false;
              break;
            case QUESTION:
              this.state = S_PI_FIRST_CHAR;
              break;
            default:
              this.fail("disallowed character in tag name");
              this.state = S_TEXT;
              this.xmlDeclPossible = false;
          }
        }
      }
      sOpenWakaBang() {
        this.openWakaBang += String.fromCodePoint(this.getCodeNorm());
        switch (this.openWakaBang) {
          case "[CDATA[":
            if (!this.sawRoot && !this.reportedTextBeforeRoot) {
              this.fail("text data outside of root node.");
              this.reportedTextBeforeRoot = true;
            }
            if (this.closedRoot && !this.reportedTextAfterRoot) {
              this.fail("text data outside of root node.");
              this.reportedTextAfterRoot = true;
            }
            this.state = S_CDATA;
            this.openWakaBang = "";
            break;
          case "--":
            this.state = S_COMMENT;
            this.openWakaBang = "";
            break;
          case "DOCTYPE":
            this.state = S_DOCTYPE;
            if (this.doctype || this.sawRoot) {
              this.fail("inappropriately located doctype declaration.");
            }
            this.openWakaBang = "";
            break;
          default:
            if (this.openWakaBang.length >= 7) {
              this.fail("incorrect syntax.");
            }
        }
      }
      sComment() {
        if (this.captureToChar(MINUS)) {
          this.state = S_COMMENT_ENDING;
        }
      }
      sCommentEnding() {
        var _a;
        const c = this.getCodeNorm();
        if (c === MINUS) {
          this.state = S_COMMENT_ENDED;
          (_a = this.commentHandler) === null || _a === void 0 ? void 0 : _a.call(this, this.text);
          this.text = "";
        } else {
          this.text += `-${String.fromCodePoint(c)}`;
          this.state = S_COMMENT;
        }
      }
      sCommentEnded() {
        const c = this.getCodeNorm();
        if (c !== GREATER) {
          this.fail("malformed comment.");
          this.text += `--${String.fromCodePoint(c)}`;
          this.state = S_COMMENT;
        } else {
          this.state = S_TEXT;
        }
      }
      sCData() {
        if (this.captureToChar(CLOSE_BRACKET)) {
          this.state = S_CDATA_ENDING;
        }
      }
      sCDataEnding() {
        const c = this.getCodeNorm();
        if (c === CLOSE_BRACKET) {
          this.state = S_CDATA_ENDING_2;
        } else {
          this.text += `]${String.fromCodePoint(c)}`;
          this.state = S_CDATA;
        }
      }
      sCDataEnding2() {
        var _a;
        const c = this.getCodeNorm();
        switch (c) {
          case GREATER: {
            (_a = this.cdataHandler) === null || _a === void 0 ? void 0 : _a.call(this, this.text);
            this.text = "";
            this.state = S_TEXT;
            break;
          }
          case CLOSE_BRACKET:
            this.text += "]";
            break;
          default:
            this.text += `]]${String.fromCodePoint(c)}`;
            this.state = S_CDATA;
        }
      }
      // We need this separate state to check the first character fo the pi target
      // with this.nameStartCheck which allows less characters than this.nameCheck.
      sPIFirstChar() {
        const c = this.getCodeNorm();
        if (this.nameStartCheck(c)) {
          this.piTarget += String.fromCodePoint(c);
          this.state = S_PI_REST;
        } else if (c === QUESTION || isS(c)) {
          this.fail("processing instruction without a target.");
          this.state = c === QUESTION ? S_PI_ENDING : S_PI_BODY;
        } else {
          this.fail("disallowed character in processing instruction name.");
          this.piTarget += String.fromCodePoint(c);
          this.state = S_PI_REST;
        }
      }
      sPIRest() {
        const { chunk, i: start } = this;
        while (true) {
          const c = this.getCodeNorm();
          if (c === EOC) {
            this.piTarget += chunk.slice(start);
            return;
          }
          if (!this.nameCheck(c)) {
            this.piTarget += chunk.slice(start, this.prevI);
            const isQuestion = c === QUESTION;
            if (isQuestion || isS(c)) {
              if (this.piTarget === "xml") {
                if (!this.xmlDeclPossible) {
                  this.fail("an XML declaration must be at the start of the document.");
                }
                this.state = isQuestion ? S_XML_DECL_ENDING : S_XML_DECL_NAME_START;
              } else {
                this.state = isQuestion ? S_PI_ENDING : S_PI_BODY;
              }
            } else {
              this.fail("disallowed character in processing instruction name.");
              this.piTarget += String.fromCodePoint(c);
            }
            break;
          }
        }
      }
      sPIBody() {
        if (this.text.length === 0) {
          const c = this.getCodeNorm();
          if (c === QUESTION) {
            this.state = S_PI_ENDING;
          } else if (!isS(c)) {
            this.text = String.fromCodePoint(c);
          }
        } else if (this.captureToChar(QUESTION)) {
          this.state = S_PI_ENDING;
        }
      }
      sPIEnding() {
        var _a;
        const c = this.getCodeNorm();
        if (c === GREATER) {
          const { piTarget } = this;
          if (piTarget.toLowerCase() === "xml") {
            this.fail("the XML declaration must appear at the start of the document.");
          }
          (_a = this.piHandler) === null || _a === void 0 ? void 0 : _a.call(this, {
            target: piTarget,
            body: this.text
          });
          this.piTarget = this.text = "";
          this.state = S_TEXT;
        } else if (c === QUESTION) {
          this.text += "?";
        } else {
          this.text += `?${String.fromCodePoint(c)}`;
          this.state = S_PI_BODY;
        }
        this.xmlDeclPossible = false;
      }
      sXMLDeclNameStart() {
        const c = this.skipSpaces();
        if (c === QUESTION) {
          this.state = S_XML_DECL_ENDING;
          return;
        }
        if (c !== EOC) {
          this.state = S_XML_DECL_NAME;
          this.name = String.fromCodePoint(c);
        }
      }
      sXMLDeclName() {
        const c = this.captureTo(XML_DECL_NAME_TERMINATOR);
        if (c === QUESTION) {
          this.state = S_XML_DECL_ENDING;
          this.name += this.text;
          this.text = "";
          this.fail("XML declaration is incomplete.");
          return;
        }
        if (!(isS(c) || c === EQUAL)) {
          return;
        }
        this.name += this.text;
        this.text = "";
        if (!this.xmlDeclExpects.includes(this.name)) {
          switch (this.name.length) {
            case 0:
              this.fail("did not expect any more name/value pairs.");
              break;
            case 1:
              this.fail(`expected the name ${this.xmlDeclExpects[0]}.`);
              break;
            default:
              this.fail(`expected one of ${this.xmlDeclExpects.join(", ")}`);
          }
        }
        this.state = c === EQUAL ? S_XML_DECL_VALUE_START : S_XML_DECL_EQ;
      }
      sXMLDeclEq() {
        const c = this.getCodeNorm();
        if (c === QUESTION) {
          this.state = S_XML_DECL_ENDING;
          this.fail("XML declaration is incomplete.");
          return;
        }
        if (isS(c)) {
          return;
        }
        if (c !== EQUAL) {
          this.fail("value required.");
        }
        this.state = S_XML_DECL_VALUE_START;
      }
      sXMLDeclValueStart() {
        const c = this.getCodeNorm();
        if (c === QUESTION) {
          this.state = S_XML_DECL_ENDING;
          this.fail("XML declaration is incomplete.");
          return;
        }
        if (isS(c)) {
          return;
        }
        if (!isQuote(c)) {
          this.fail("value must be quoted.");
          this.q = SPACE;
        } else {
          this.q = c;
        }
        this.state = S_XML_DECL_VALUE;
      }
      sXMLDeclValue() {
        const c = this.captureTo([this.q, QUESTION]);
        if (c === QUESTION) {
          this.state = S_XML_DECL_ENDING;
          this.text = "";
          this.fail("XML declaration is incomplete.");
          return;
        }
        if (c === EOC) {
          return;
        }
        const value = this.text;
        this.text = "";
        switch (this.name) {
          case "version": {
            this.xmlDeclExpects = ["encoding", "standalone"];
            const version = value;
            this.xmlDecl.version = version;
            if (!/^1\.[0-9]+$/.test(version)) {
              this.fail("version number must match /^1\\.[0-9]+$/.");
            } else if (!this.opt.forceXMLVersion) {
              this.setXMLVersion(version);
            }
            break;
          }
          case "encoding":
            if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(value)) {
              this.fail("encoding value must match /^[A-Za-z0-9][A-Za-z0-9._-]*$/.");
            }
            this.xmlDeclExpects = ["standalone"];
            this.xmlDecl.encoding = value;
            break;
          case "standalone":
            if (value !== "yes" && value !== "no") {
              this.fail('standalone value must match "yes" or "no".');
            }
            this.xmlDeclExpects = [];
            this.xmlDecl.standalone = value;
            break;
          default:
        }
        this.name = "";
        this.state = S_XML_DECL_SEPARATOR;
      }
      sXMLDeclSeparator() {
        const c = this.getCodeNorm();
        if (c === QUESTION) {
          this.state = S_XML_DECL_ENDING;
          return;
        }
        if (!isS(c)) {
          this.fail("whitespace required.");
          this.unget();
        }
        this.state = S_XML_DECL_NAME_START;
      }
      sXMLDeclEnding() {
        var _a;
        const c = this.getCodeNorm();
        if (c === GREATER) {
          if (this.piTarget !== "xml") {
            this.fail("processing instructions are not allowed before root.");
          } else if (this.name !== "version" && this.xmlDeclExpects.includes("version")) {
            this.fail("XML declaration must contain a version.");
          }
          (_a = this.xmldeclHandler) === null || _a === void 0 ? void 0 : _a.call(this, this.xmlDecl);
          this.name = "";
          this.piTarget = this.text = "";
          this.state = S_TEXT;
        } else {
          this.fail("The character ? is disallowed anywhere in XML declarations.");
        }
        this.xmlDeclPossible = false;
      }
      sOpenTag() {
        var _a;
        const c = this.captureNameChars();
        if (c === EOC) {
          return;
        }
        const tag = this.tag = {
          name: this.name,
          attributes: /* @__PURE__ */ Object.create(null)
        };
        this.name = "";
        if (this.xmlnsOpt) {
          this.topNS = tag.ns = /* @__PURE__ */ Object.create(null);
        }
        (_a = this.openTagStartHandler) === null || _a === void 0 ? void 0 : _a.call(this, tag);
        this.sawRoot = true;
        if (!this.fragmentOpt && this.closedRoot) {
          this.fail("documents may contain only one root.");
        }
        switch (c) {
          case GREATER:
            this.openTag();
            break;
          case FORWARD_SLASH:
            this.state = S_OPEN_TAG_SLASH;
            break;
          default:
            if (!isS(c)) {
              this.fail("disallowed character in tag name.");
            }
            this.state = S_ATTRIB;
        }
      }
      sOpenTagSlash() {
        if (this.getCode() === GREATER) {
          this.openSelfClosingTag();
        } else {
          this.fail("forward-slash in opening tag not followed by >.");
          this.state = S_ATTRIB;
        }
      }
      sAttrib() {
        const c = this.skipSpaces();
        if (c === EOC) {
          return;
        }
        if (isNameStartChar(c)) {
          this.unget();
          this.state = S_ATTRIB_NAME;
        } else if (c === GREATER) {
          this.openTag();
        } else if (c === FORWARD_SLASH) {
          this.state = S_OPEN_TAG_SLASH;
        } else {
          this.fail("disallowed character in attribute name.");
        }
      }
      sAttribName() {
        const c = this.captureNameChars();
        if (c === EQUAL) {
          this.state = S_ATTRIB_VALUE;
        } else if (isS(c)) {
          this.state = S_ATTRIB_NAME_SAW_WHITE;
        } else if (c === GREATER) {
          this.fail("attribute without value.");
          this.pushAttrib(this.name, this.name);
          this.name = this.text = "";
          this.openTag();
        } else if (c !== EOC) {
          this.fail("disallowed character in attribute name.");
        }
      }
      sAttribNameSawWhite() {
        const c = this.skipSpaces();
        switch (c) {
          case EOC:
            return;
          case EQUAL:
            this.state = S_ATTRIB_VALUE;
            break;
          default:
            this.fail("attribute without value.");
            this.text = "";
            this.name = "";
            if (c === GREATER) {
              this.openTag();
            } else if (isNameStartChar(c)) {
              this.unget();
              this.state = S_ATTRIB_NAME;
            } else {
              this.fail("disallowed character in attribute name.");
              this.state = S_ATTRIB;
            }
        }
      }
      sAttribValue() {
        const c = this.getCodeNorm();
        if (isQuote(c)) {
          this.q = c;
          this.state = S_ATTRIB_VALUE_QUOTED;
        } else if (!isS(c)) {
          this.fail("unquoted attribute value.");
          this.state = S_ATTRIB_VALUE_UNQUOTED;
          this.unget();
        }
      }
      sAttribValueQuoted() {
        const { q, chunk } = this;
        let { i: start } = this;
        while (true) {
          switch (this.getCode()) {
            case q:
              this.pushAttrib(this.name, this.text + chunk.slice(start, this.prevI));
              this.name = this.text = "";
              this.q = null;
              this.state = S_ATTRIB_VALUE_CLOSED;
              return;
            case AMP:
              this.text += chunk.slice(start, this.prevI);
              this.state = S_ENTITY;
              this.entityReturnState = S_ATTRIB_VALUE_QUOTED;
              return;
            case NL:
            case NL_LIKE:
            case TAB:
              this.text += `${chunk.slice(start, this.prevI)} `;
              start = this.i;
              break;
            case LESS:
              this.text += chunk.slice(start, this.prevI);
              this.fail("disallowed character.");
              return;
            case EOC:
              this.text += chunk.slice(start);
              return;
            default:
          }
        }
      }
      sAttribValueClosed() {
        const c = this.getCodeNorm();
        if (isS(c)) {
          this.state = S_ATTRIB;
        } else if (c === GREATER) {
          this.openTag();
        } else if (c === FORWARD_SLASH) {
          this.state = S_OPEN_TAG_SLASH;
        } else if (isNameStartChar(c)) {
          this.fail("no whitespace between attributes.");
          this.unget();
          this.state = S_ATTRIB_NAME;
        } else {
          this.fail("disallowed character in attribute name.");
        }
      }
      sAttribValueUnquoted() {
        const c = this.captureTo(ATTRIB_VALUE_UNQUOTED_TERMINATOR);
        switch (c) {
          case AMP:
            this.state = S_ENTITY;
            this.entityReturnState = S_ATTRIB_VALUE_UNQUOTED;
            break;
          case LESS:
            this.fail("disallowed character.");
            break;
          case EOC:
            break;
          default:
            if (this.text.includes("]]>")) {
              this.fail('the string "]]>" is disallowed in char data.');
            }
            this.pushAttrib(this.name, this.text);
            this.name = this.text = "";
            if (c === GREATER) {
              this.openTag();
            } else {
              this.state = S_ATTRIB;
            }
        }
      }
      sCloseTag() {
        const c = this.captureNameChars();
        if (c === GREATER) {
          this.closeTag();
        } else if (isS(c)) {
          this.state = S_CLOSE_TAG_SAW_WHITE;
        } else if (c !== EOC) {
          this.fail("disallowed character in closing tag.");
        }
      }
      sCloseTagSawWhite() {
        switch (this.skipSpaces()) {
          case GREATER:
            this.closeTag();
            break;
          case EOC:
            break;
          default:
            this.fail("disallowed character in closing tag.");
        }
      }
      // END OF STATE ENGINE METHODS
      handleTextInRoot() {
        let { i: start, forbiddenState } = this;
        const { chunk, textHandler: handler } = this;
        scanLoop:
          while (true) {
            switch (this.getCode()) {
              case LESS: {
                this.state = S_OPEN_WAKA;
                if (handler !== void 0) {
                  const { text: text2 } = this;
                  const slice = chunk.slice(start, this.prevI);
                  if (text2.length !== 0) {
                    handler(text2 + slice);
                    this.text = "";
                  } else if (slice.length !== 0) {
                    handler(slice);
                  }
                }
                forbiddenState = FORBIDDEN_START;
                break scanLoop;
              }
              case AMP:
                this.state = S_ENTITY;
                this.entityReturnState = S_TEXT;
                if (handler !== void 0) {
                  this.text += chunk.slice(start, this.prevI);
                }
                forbiddenState = FORBIDDEN_START;
                break scanLoop;
              case CLOSE_BRACKET:
                switch (forbiddenState) {
                  case FORBIDDEN_START:
                    forbiddenState = FORBIDDEN_BRACKET;
                    break;
                  case FORBIDDEN_BRACKET:
                    forbiddenState = FORBIDDEN_BRACKET_BRACKET;
                    break;
                  case FORBIDDEN_BRACKET_BRACKET:
                    break;
                  default:
                    throw new Error("impossible state");
                }
                break;
              case GREATER:
                if (forbiddenState === FORBIDDEN_BRACKET_BRACKET) {
                  this.fail('the string "]]>" is disallowed in char data.');
                }
                forbiddenState = FORBIDDEN_START;
                break;
              case NL_LIKE:
                if (handler !== void 0) {
                  this.text += `${chunk.slice(start, this.prevI)}
`;
                }
                start = this.i;
                forbiddenState = FORBIDDEN_START;
                break;
              case EOC:
                if (handler !== void 0) {
                  this.text += chunk.slice(start);
                }
                break scanLoop;
              default:
                forbiddenState = FORBIDDEN_START;
            }
          }
        this.forbiddenState = forbiddenState;
      }
      handleTextOutsideRoot() {
        let { i: start } = this;
        const { chunk, textHandler: handler } = this;
        let nonSpace = false;
        outRootLoop:
          while (true) {
            const code = this.getCode();
            switch (code) {
              case LESS: {
                this.state = S_OPEN_WAKA;
                if (handler !== void 0) {
                  const { text: text2 } = this;
                  const slice = chunk.slice(start, this.prevI);
                  if (text2.length !== 0) {
                    handler(text2 + slice);
                    this.text = "";
                  } else if (slice.length !== 0) {
                    handler(slice);
                  }
                }
                break outRootLoop;
              }
              case AMP:
                this.state = S_ENTITY;
                this.entityReturnState = S_TEXT;
                if (handler !== void 0) {
                  this.text += chunk.slice(start, this.prevI);
                }
                nonSpace = true;
                break outRootLoop;
              case NL_LIKE:
                if (handler !== void 0) {
                  this.text += `${chunk.slice(start, this.prevI)}
`;
                }
                start = this.i;
                break;
              case EOC:
                if (handler !== void 0) {
                  this.text += chunk.slice(start);
                }
                break outRootLoop;
              default:
                if (!isS(code)) {
                  nonSpace = true;
                }
            }
          }
        if (!nonSpace) {
          return;
        }
        if (!this.sawRoot && !this.reportedTextBeforeRoot) {
          this.fail("text data outside of root node.");
          this.reportedTextBeforeRoot = true;
        }
        if (this.closedRoot && !this.reportedTextAfterRoot) {
          this.fail("text data outside of root node.");
          this.reportedTextAfterRoot = true;
        }
      }
      pushAttribNS(name, value) {
        var _a;
        const { prefix, local } = this.qname(name);
        const attr = { name, prefix, local, value };
        this.attribList.push(attr);
        (_a = this.attributeHandler) === null || _a === void 0 ? void 0 : _a.call(this, attr);
        if (prefix === "xmlns") {
          const trimmed = value.trim();
          if (this.currentXMLVersion === "1.0" && trimmed === "") {
            this.fail("invalid attempt to undefine prefix in XML 1.0");
          }
          this.topNS[local] = trimmed;
          nsPairCheck(this, local, trimmed);
        } else if (name === "xmlns") {
          const trimmed = value.trim();
          this.topNS[""] = trimmed;
          nsPairCheck(this, "", trimmed);
        }
      }
      pushAttribPlain(name, value) {
        var _a;
        const attr = { name, value };
        this.attribList.push(attr);
        (_a = this.attributeHandler) === null || _a === void 0 ? void 0 : _a.call(this, attr);
      }
      /**
       * End parsing. This performs final well-formedness checks and resets the
       * parser to a clean state.
       *
       * @returns this
       */
      end() {
        var _a, _b;
        if (!this.sawRoot) {
          this.fail("document must contain a root element.");
        }
        const { tags } = this;
        while (tags.length > 0) {
          const tag = tags.pop();
          this.fail(`unclosed tag: ${tag.name}`);
        }
        if (this.state !== S_BEGIN && this.state !== S_TEXT) {
          this.fail("unexpected end.");
        }
        const { text: text2 } = this;
        if (text2.length !== 0) {
          (_a = this.textHandler) === null || _a === void 0 ? void 0 : _a.call(this, text2);
          this.text = "";
        }
        this._closed = true;
        (_b = this.endHandler) === null || _b === void 0 ? void 0 : _b.call(this);
        this._init();
        return this;
      }
      /**
       * Resolve a namespace prefix.
       *
       * @param prefix The prefix to resolve.
       *
       * @returns The namespace URI or ``undefined`` if the prefix is not defined.
       */
      resolve(prefix) {
        var _a, _b;
        let uri = this.topNS[prefix];
        if (uri !== void 0) {
          return uri;
        }
        const { tags } = this;
        for (let index = tags.length - 1; index >= 0; index--) {
          uri = tags[index].ns[prefix];
          if (uri !== void 0) {
            return uri;
          }
        }
        uri = this.ns[prefix];
        if (uri !== void 0) {
          return uri;
        }
        return (_b = (_a = this.opt).resolvePrefix) === null || _b === void 0 ? void 0 : _b.call(_a, prefix);
      }
      /**
       * Parse a qname into its prefix and local name parts.
       *
       * @param name The name to parse
       *
       * @returns
       */
      qname(name) {
        const colon = name.indexOf(":");
        if (colon === -1) {
          return { prefix: "", local: name };
        }
        const local = name.slice(colon + 1);
        const prefix = name.slice(0, colon);
        if (prefix === "" || local === "" || local.includes(":")) {
          this.fail(`malformed name: ${name}.`);
        }
        return { prefix, local };
      }
      processAttribsNS() {
        var _a;
        const { attribList } = this;
        const tag = this.tag;
        {
          const { prefix, local } = this.qname(tag.name);
          tag.prefix = prefix;
          tag.local = local;
          const uri = tag.uri = (_a = this.resolve(prefix)) !== null && _a !== void 0 ? _a : "";
          if (prefix !== "") {
            if (prefix === "xmlns") {
              this.fail('tags may not have "xmlns" as prefix.');
            }
            if (uri === "") {
              this.fail(`unbound namespace prefix: ${JSON.stringify(prefix)}.`);
              tag.uri = prefix;
            }
          }
        }
        if (attribList.length === 0) {
          return;
        }
        const { attributes } = tag;
        const seen = /* @__PURE__ */ new Set();
        for (const attr of attribList) {
          const { name, prefix, local } = attr;
          let uri;
          let eqname;
          if (prefix === "") {
            uri = name === "xmlns" ? XMLNS_NAMESPACE : "";
            eqname = name;
          } else {
            uri = this.resolve(prefix);
            if (uri === void 0) {
              this.fail(`unbound namespace prefix: ${JSON.stringify(prefix)}.`);
              uri = prefix;
            }
            eqname = `{${uri}}${local}`;
          }
          if (seen.has(eqname)) {
            this.fail(`duplicate attribute: ${eqname}.`);
          }
          seen.add(eqname);
          attr.uri = uri;
          attributes[name] = attr;
        }
        this.attribList = [];
      }
      processAttribsPlain() {
        const { attribList } = this;
        const attributes = this.tag.attributes;
        for (const { name, value } of attribList) {
          if (attributes[name] !== void 0) {
            this.fail(`duplicate attribute: ${name}.`);
          }
          attributes[name] = value;
        }
        this.attribList = [];
      }
      /**
       * Handle a complete open tag. This parser code calls this once it has seen
       * the whole tag. This method checks for well-formeness and then emits
       * ``onopentag``.
       */
      openTag() {
        var _a;
        this.processAttribs();
        const { tags } = this;
        const tag = this.tag;
        tag.isSelfClosing = false;
        (_a = this.openTagHandler) === null || _a === void 0 ? void 0 : _a.call(this, tag);
        tags.push(tag);
        this.state = S_TEXT;
        this.name = "";
      }
      /**
       * Handle a complete self-closing tag. This parser code calls this once it has
       * seen the whole tag. This method checks for well-formeness and then emits
       * ``onopentag`` and ``onclosetag``.
       */
      openSelfClosingTag() {
        var _a, _b, _c;
        this.processAttribs();
        const { tags } = this;
        const tag = this.tag;
        tag.isSelfClosing = true;
        (_a = this.openTagHandler) === null || _a === void 0 ? void 0 : _a.call(this, tag);
        (_b = this.closeTagHandler) === null || _b === void 0 ? void 0 : _b.call(this, tag);
        const top = this.tag = (_c = tags[tags.length - 1]) !== null && _c !== void 0 ? _c : null;
        if (top === null) {
          this.closedRoot = true;
        }
        this.state = S_TEXT;
        this.name = "";
      }
      /**
       * Handle a complete close tag. This parser code calls this once it has seen
       * the whole tag. This method checks for well-formeness and then emits
       * ``onclosetag``.
       */
      closeTag() {
        const { tags, name } = this;
        this.state = S_TEXT;
        this.name = "";
        if (name === "") {
          this.fail("weird empty close tag.");
          this.text += "</>";
          return;
        }
        const handler = this.closeTagHandler;
        let l = tags.length;
        while (l-- > 0) {
          const tag = this.tag = tags.pop();
          this.topNS = tag.ns;
          handler === null || handler === void 0 ? void 0 : handler(tag);
          if (tag.name === name) {
            break;
          }
          this.fail("unexpected close tag.");
        }
        if (l === 0) {
          this.closedRoot = true;
        } else if (l < 0) {
          this.fail(`unmatched closing tag: ${name}.`);
          this.text += `</${name}>`;
        }
      }
      /**
       * Resolves an entity. Makes any necessary well-formedness checks.
       *
       * @param entity The entity to resolve.
       *
       * @returns The parsed entity.
       */
      parseEntity(entity) {
        if (entity[0] !== "#") {
          const defined = this.ENTITIES[entity];
          if (defined !== void 0) {
            return defined;
          }
          this.fail(this.isName(entity) ? "undefined entity." : "disallowed character in entity name.");
          return `&${entity};`;
        }
        let num = NaN;
        if (entity[1] === "x" && /^#x[0-9a-f]+$/i.test(entity)) {
          num = parseInt(entity.slice(2), 16);
        } else if (/^#[0-9]+$/.test(entity)) {
          num = parseInt(entity.slice(1), 10);
        }
        if (!this.isChar(num)) {
          this.fail("malformed character entity.");
          return `&${entity};`;
        }
        return String.fromCodePoint(num);
      }
    };
    exports2.SaxesParser = SaxesParser2;
  }
});

// src/hook/main.ts
var import_consumers = require("node:stream/consumers");

// src/config/load-config.ts
var import_promises = require("node:fs/promises");
var import_node_path = __toESM(require("node:path"), 1);
var import_yaml = __toESM(require_dist(), 1);

// src/core/errors.ts
var SlopLockError = class extends Error {
  exitCode;
  code;
  hint;
  constructor(message, exitCode, code, hint) {
    super(message);
    this.name = "SlopLockError";
    this.exitCode = exitCode;
    this.code = code;
    this.hint = hint;
  }
};
var UsageError = class extends SlopLockError {
  constructor(message, options = {}) {
    super(message, 2, options.code ?? "usage_error", options.hint);
    this.name = "UsageError";
  }
};

// src/core/crates.ts
var cratesPackageNamePattern = /^[a-z0-9][a-z0-9_-]*$/iu;
function normalizeCratesPackageName(name) {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 64 || !cratesPackageNamePattern.test(trimmed)) {
    return void 0;
  }
  return trimmed.toLowerCase();
}

// src/core/go.ts
var goModuleFirstPathElementPattern = /^[a-z0-9][a-z0-9.-]*\.[a-z0-9.-]+$/iu;
var goModulePathPattern = /^[A-Za-z0-9._~!$&'()*+,;=:@/-]+$/u;
var localModulePathSuffixes = /* @__PURE__ */ new Set(["internal", "invalid", "local", "localhost", "test"]);
function normalizeGoModulePath(input) {
  const modulePath = input.trim();
  if (modulePath.length === 0 || modulePath.includes("://") || modulePath.includes("\\") || modulePath.includes("@") || modulePath.startsWith(".") || modulePath.startsWith("/") || modulePath.endsWith("/") || modulePath.includes("//") || !goModulePathPattern.test(modulePath)) {
    return void 0;
  }
  const firstPathElement = modulePath.split("/")[0];
  if (firstPathElement === void 0 || !goModuleFirstPathElementPattern.test(firstPathElement) || localModulePathSuffixes.has(firstPathElement.split(".").at(-1)?.toLowerCase() ?? "")) {
    return void 0;
  }
  return modulePath;
}
function escapeGoProxyPath(input) {
  return input.split("/").map((segment) => encodeURIComponent(caseEncode(segment))).join("/");
}
function goPrivatePatternsFromEnvironment(env = process.env) {
  return [
    ...splitGoPrivatePatternList(env.GOPRIVATE),
    ...splitGoPrivatePatternList(env.GONOPROXY)
  ];
}
function splitGoPrivatePatternList(input) {
  if (input === void 0) {
    return [];
  }
  return input.split(",").map((pattern) => pattern.trim()).filter((pattern) => pattern.length > 0);
}
function matchesGoPrivateModulePattern(modulePath, pattern) {
  const trimmed = pattern.trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (!hasGlobSyntax(trimmed)) {
    return modulePath === trimmed || modulePath.startsWith(`${trimmed}/`);
  }
  const matcher = globPatternToRegExp(trimmed);
  return modulePrefixes(modulePath).some((prefix) => matcher.test(prefix));
}
function caseEncode(input) {
  return input.replace(/[A-Z]/gu, (letter) => `!${letter.toLowerCase()}`);
}
function hasGlobSyntax(input) {
  return /[*?[\]]/u.test(input);
}
function modulePrefixes(modulePath) {
  const parts = modulePath.split("/");
  return parts.map((_, index) => parts.slice(0, index + 1).join("/"));
}
function globPatternToRegExp(pattern) {
  let source = "^";
  for (const character of pattern) {
    if (character === "*") {
      source += "[^/]*";
      continue;
    }
    if (character === "?") {
      source += "[^/]";
      continue;
    }
    source += escapeRegExp(character);
  }
  source += "$";
  return new RegExp(source, "u");
}
function escapeRegExp(input) {
  return input.replace(/[\\^$.*+?()[\]{}|]/gu, "\\$&");
}

// src/core/maven.ts
function normalizeMavenPackageName(name) {
  const trimmed = name.trim();
  const parts = trimmed.split(":");
  if (parts.length !== 2) {
    return void 0;
  }
  const [groupId, artifactId] = parts;
  if (groupId === void 0 || artifactId === void 0 || !isConcreteMavenCoordinatePart(groupId) || !isConcreteMavenCoordinatePart(artifactId)) {
    return void 0;
  }
  return `${groupId}:${artifactId}`;
}
function mavenCoordinateParts(name) {
  const normalized = normalizeMavenPackageName(name);
  if (normalized === void 0) {
    return void 0;
  }
  const [groupId, artifactId] = normalized.split(":");
  return groupId === void 0 || artifactId === void 0 ? void 0 : { groupId, artifactId };
}
function isUnresolvedMavenValue(value) {
  return value !== void 0 && /\$\{[^}]+\}/u.test(value);
}
function isConcreteMavenCoordinatePart(value) {
  return value.length > 0 && !isUnresolvedMavenValue(value) && /^[A-Za-z0-9_.-]+$/u.test(value);
}

// src/core/nuget.ts
var nugetPackageNamePattern = /^[A-Za-z0-9_]+(?:[.-][A-Za-z0-9_]+)*$/u;
var nugetOrgPackageIdLimit = 100;
function normalizeNugetPackageName(packageName) {
  const trimmed = packageName.trim();
  if (trimmed.length === 0 || trimmed.length > nugetOrgPackageIdLimit || trimmed.includes("$(") || !nugetPackageNamePattern.test(trimmed)) {
    return void 0;
  }
  return trimmed.toLowerCase();
}

// src/core/npm.ts
var npmPackageNamePattern = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
function normalizeNpmPackageName(name) {
  const normalized = name.trim().toLowerCase();
  if (normalized.length === 0 || normalized.length > 214 || normalized.includes(" ") || !npmPackageNamePattern.test(normalized)) {
    return void 0;
  }
  return normalized;
}

// src/core/packagist.ts
var packagistPackageNamePattern = /^[a-z0-9](?:[a-z0-9_.-]*[a-z0-9])?\/[a-z0-9](?:[a-z0-9_.-]*[a-z0-9])?$/iu;
function normalizePackagistPackageName(name) {
  const normalized = name.trim().toLowerCase();
  if (normalized.length === 0 || normalized.length > 214 || !packagistPackageNamePattern.test(normalized)) {
    return void 0;
  }
  return normalized;
}

// src/core/pypi.ts
var pypiPackageNamePattern = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/iu;
function normalizePypiPackageName(name) {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 214 || !pypiPackageNamePattern.test(trimmed)) {
    return void 0;
  }
  return trimmed.toLowerCase().replace(/[-_.]+/gu, "-");
}

// src/core/rubygems.ts
var rubygemsPackageNamePattern = /^[A-Za-z0-9](?:[A-Za-z0-9_.-]*[A-Za-z0-9])?$/u;
function normalizeRubygemsPackageName(name) {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 255 || !rubygemsPackageNamePattern.test(trimmed)) {
    return void 0;
  }
  return trimmed;
}

// src/core/packages.ts
function normalizePackageName(ecosystem, packageName) {
  switch (ecosystem) {
    case "crates":
      return normalizeCratesPackageName(packageName);
    case "go":
      return normalizeGoModulePath(packageName);
    case "maven":
      return normalizeMavenPackageName(packageName);
    case "npm":
      return normalizeNpmPackageName(packageName);
    case "nuget":
      return normalizeNugetPackageName(packageName);
    case "packagist":
      return normalizePackagistPackageName(packageName);
    case "pypi":
      return normalizePypiPackageName(packageName);
    case "rubygems":
      return normalizeRubygemsPackageName(packageName);
  }
}
function registryDisplayName(ecosystem) {
  switch (ecosystem) {
    case "crates":
      return "crates.io";
    case "go":
      return "Go module proxy";
    case "maven":
      return "Maven Central";
    case "npm":
      return "npm";
    case "nuget":
      return "NuGet.org";
    case "packagist":
      return "Packagist";
    case "pypi":
      return "PyPI";
    case "rubygems":
      return "RubyGems.org";
  }
}

// src/config/load-config.ts
var defaultConfig = {
  failOn: "high",
  ecosystems: [
    "crates",
    "go",
    "maven",
    "npm",
    "nuget",
    "packagist",
    "pypi",
    "rubygems"
  ],
  cooldown: {
    highDays: 7,
    mediumDays: 30
  },
  go: {
    privateModules: []
  },
  nuget: {
    privatePackages: []
  },
  allow: [],
  ignore: []
};
async function loadConfig(options) {
  const warnings = [];
  const configFile = options.configPath ?? "sloplock.yml";
  const configFilePath = import_node_path.default.isAbsolute(configFile) ? configFile : import_node_path.default.join(options.rootDir, configFile);
  const exists = await fileExists(configFilePath);
  const configInput = exists ? parseConfigFile(await (0, import_promises.readFile)(configFilePath, "utf8"), configFile) : {};
  if (!exists && options.configPath !== void 0) {
    throw new UsageError(`Config file not found: ${options.configPath}`);
  }
  const config = mergeConfig(configInput, options.failOn);
  const filteredAllow = filterExpiredAllowRules(
    config.allow,
    warnings,
    configFile,
    options.now
  );
  const filteredIgnore = filterExpiredIgnoreRules(
    config.ignore,
    warnings,
    configFile,
    options.now
  );
  for (const rule of [...filteredAllow, ...filteredIgnore]) {
    if (rule.expires === void 0) {
      warnings.push({
        file: configFile,
        message: `Allow or ignore entry for ${rule.package} should include an expires date.`
      });
    }
  }
  return {
    config: {
      ...config,
      allow: filteredAllow,
      ignore: filteredIgnore
    },
    warnings
  };
}
function parseConfigFile(content, sourceFile) {
  try {
    return (0, import_yaml.parse)(content) ?? {};
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new UsageError(`Invalid YAML in ${sourceFile}: ${message}`);
  }
}
function mergeConfig(input, failOnOverride) {
  if (!isRecord(input)) {
    throw new UsageError("Config file must contain a mapping.");
  }
  const failOn = parseFailOn(input.failOn, failOnOverride);
  const cooldown = parseCooldown(input.cooldown);
  const ecosystems = parseEcosystems(input.ecosystems);
  const go = parseGoConfig(input.go);
  const nuget = parseNugetOptions(input.nuget);
  return {
    failOn,
    ecosystems,
    cooldown,
    go,
    nuget,
    allow: parseAllowRules(input.allow),
    ignore: parseIgnoreRules(input.ignore)
  };
}
function parseFailOn(input, override) {
  if (override !== void 0) {
    return override;
  }
  if (input === void 0) {
    return defaultConfig.failOn;
  }
  if (input === "medium" || input === "high") {
    return input;
  }
  throw new UsageError("Config failOn must be either medium or high.");
}
function parseCooldown(input) {
  if (input === void 0) {
    return defaultConfig.cooldown;
  }
  if (!isRecord(input)) {
    throw new UsageError("Config cooldown must contain highDays and mediumDays.");
  }
  const highDays = parsePositiveInteger(
    input.highDays,
    "cooldown.highDays",
    defaultConfig.cooldown.highDays
  );
  const mediumDays = parsePositiveInteger(
    input.mediumDays,
    "cooldown.mediumDays",
    defaultConfig.cooldown.mediumDays
  );
  if (highDays > mediumDays) {
    throw new UsageError(
      `Config cooldown.highDays (${highDays}) must be <= cooldown.mediumDays (${mediumDays}).`
    );
  }
  return { highDays, mediumDays };
}
function parseEcosystems(input) {
  if (input === void 0) {
    return [...defaultConfig.ecosystems];
  }
  if (!Array.isArray(input) || input.length === 0) {
    throw new UsageError("Config ecosystems must be a non-empty array.");
  }
  const ecosystems = /* @__PURE__ */ new Set();
  for (const ecosystem of input) {
    ecosystems.add(parseEcosystem(ecosystem, "ecosystems[]"));
  }
  return [...ecosystems].sort();
}
function parseAllowRules(input) {
  if (input === void 0) {
    return [];
  }
  if (!Array.isArray(input)) {
    throw new UsageError("Config allow must be an array.");
  }
  return input.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new UsageError(`Config allow[${index}] must be a mapping.`);
    }
    const ecosystem = parseEcosystem(entry.ecosystem, `allow[${index}].ecosystem`);
    const packageName = parsePackage(
      entry.package,
      ecosystem,
      `allow[${index}].package`
    );
    const reason = parseReason(entry.reason, `allow[${index}].reason`);
    const expires = parseOptionalDate(entry.expires, `allow[${index}].expires`);
    return expires === void 0 ? { ecosystem, package: packageName, reason } : { ecosystem, package: packageName, reason, expires };
  });
}
function parseIgnoreRules(input) {
  if (input === void 0) {
    return [];
  }
  if (!Array.isArray(input)) {
    throw new UsageError("Config ignore must be an array.");
  }
  return input.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new UsageError(`Config ignore[${index}] must be a mapping.`);
    }
    const rule = parseRule(entry.rule, `ignore[${index}].rule`);
    const ecosystem = parseEcosystem(entry.ecosystem, `ignore[${index}].ecosystem`);
    const packageName = parsePackage(
      entry.package,
      ecosystem,
      `ignore[${index}].package`
    );
    const reason = parseReason(entry.reason, `ignore[${index}].reason`);
    const expires = parseOptionalDate(entry.expires, `ignore[${index}].expires`);
    return expires === void 0 ? { rule, ecosystem, package: packageName, reason } : { rule, ecosystem, package: packageName, reason, expires };
  });
}
function filterExpiredAllowRules(rules, warnings, sourceFile, now) {
  return rules.filter((rule) => {
    if (rule.expires === void 0 || rule.expires.getTime() >= startOfDay(now)) {
      return true;
    }
    warnings.push({
      file: sourceFile,
      message: `Expired allow entry ignored for ${rule.package}.`
    });
    return false;
  });
}
function filterExpiredIgnoreRules(rules, warnings, sourceFile, now) {
  return rules.filter((rule) => {
    if (rule.expires === void 0 || rule.expires.getTime() >= startOfDay(now)) {
      return true;
    }
    warnings.push({
      file: sourceFile,
      message: `Expired ignore entry ignored for ${rule.package}.`
    });
    return false;
  });
}
function parseEcosystem(input, field) {
  if (input === "crates" || input === "go" || input === "maven" || input === "npm" || input === "nuget" || input === "packagist" || input === "pypi" || input === "rubygems") {
    return input;
  }
  throw new UsageError(
    `Config ${field} must be crates, go, maven, npm, nuget, packagist, pypi, or rubygems.`
  );
}
function parseRule(input, field) {
  if (input === "package_not_found" || input === "package_too_new") {
    return input;
  }
  throw new UsageError(
    `Config ${field} must be package_not_found or package_too_new.`
  );
}
function parsePackage(input, ecosystem, field) {
  if (typeof input !== "string") {
    throw new UsageError(`Config ${field} must be a package name.`);
  }
  const packageName = normalizePackageName(ecosystem, input);
  if (packageName === void 0) {
    throw new UsageError(
      `Config ${field} is not a valid ${ecosystem} package name.`
    );
  }
  return packageName;
}
function parseReason(input, field) {
  if (typeof input !== "string" || input.trim().length === 0) {
    throw new UsageError(`Config ${field} must be a non-empty reason.`);
  }
  return input.trim();
}
function parseOptionalDate(input, field) {
  if (input === void 0) {
    return void 0;
  }
  if (typeof input !== "string") {
    throw new UsageError(`Config ${field} must be an ISO date string.`);
  }
  const date = /* @__PURE__ */ new Date(`${input}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(input) || Number.isNaN(date.getTime())) {
    throw new UsageError(`Config ${field} must use YYYY-MM-DD.`);
  }
  return date;
}
function parsePositiveInteger(input, field, defaultValue) {
  if (input === void 0) {
    return defaultValue;
  }
  if (!Number.isInteger(input) || typeof input !== "number" || input < 0) {
    throw new UsageError(`Config ${field} must be a non-negative integer.`);
  }
  return input;
}
function parseGoConfig(input) {
  if (input === void 0) {
    return defaultConfig.go;
  }
  if (!isRecord(input)) {
    throw new UsageError("Config go must contain privateModules.");
  }
  return {
    privateModules: parseStringArray(
      input.privateModules,
      "go.privateModules",
      defaultConfig.go.privateModules
    )
  };
}
function parseNugetOptions(input) {
  if (input === void 0) {
    return defaultConfig.nuget;
  }
  if (!isRecord(input)) {
    throw new UsageError("Config nuget must contain privatePackages.");
  }
  return {
    privatePackages: parseStringArray(
      input.privatePackages,
      "nuget.privatePackages",
      defaultConfig.nuget.privatePackages
    )
  };
}
function parseStringArray(input, field, defaultValue) {
  if (input === void 0) {
    return [...defaultValue];
  }
  if (!Array.isArray(input)) {
    throw new UsageError(`Config ${field} must be an array.`);
  }
  return input.map((entry, index) => {
    if (typeof entry !== "string" || entry.trim().length === 0) {
      throw new UsageError(`Config ${field}[${index}] must be a non-empty string.`);
    }
    return entry.trim();
  });
}
function isRecord(input) {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
async function fileExists(filePath) {
  try {
    await (0, import_promises.access)(filePath);
    return true;
  } catch {
    return false;
  }
}
function startOfDay(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

// src/parsers/maven.ts
var import_saxes = __toESM(require_saxes(), 1);

// src/parsers/pnpm-lock.ts
var import_yaml2 = __toESM(require_dist(), 1);

// src/discovery/git.ts
var import_node_child_process = require("node:child_process");
var import_node_util = require("node:util");
var execFileAsync = (0, import_node_util.promisify)(import_node_child_process.execFile);

// src/core/version.ts
var sloplockVersion = "2.1.0";
var sloplockUserAgent = `sloplock/${sloplockVersion}`;
var sloplockRepositoryUserAgent = `${sloplockUserAgent} (https://github.com/theinfosecguy/sloplock)`;

// src/registries/crates.ts
var cratesRegistryUrl = "https://crates.io/api/v1/crates";
var defaultTimeoutMs = 8e3;
var defaultRetries = 2;
var CratesRegistryClient = class {
  timeoutMs;
  retries;
  userAgent;
  fetchImpl;
  cache = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
    this.retries = options.retries ?? defaultRetries;
    this.userAgent = options.userAgent ?? sloplockRepositoryUserAgent;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }
  async getPackage(reference) {
    if (reference.ecosystem !== "crates") {
      return {
        status: "unsupported",
        ecosystem: reference.ecosystem,
        name: reference.name,
        message: "crates.io registry client only supports Rust crates.",
        retryable: false
      };
    }
    const cached = this.cache.get(reference.name);
    if (cached !== void 0) {
      return cached;
    }
    const request = this.getPackageUncached(reference.name);
    this.cache.set(reference.name, request);
    return request;
  }
  async getPackageUncached(name) {
    let lastFailure;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const result = await this.fetchPackage(name);
      if (result.status === "found" || result.status === "not_found") {
        return result;
      }
      lastFailure = result;
      if (!result.retryable || attempt === this.retries) {
        return result;
      }
      await sleep(1e3 * (attempt + 1));
    }
    return lastFailure ?? {
      status: "network_error",
      ecosystem: "crates",
      name,
      message: "crates.io registry request failed without a response.",
      retryable: true
    };
  }
  async fetchPackage(name) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);
    try {
      const response = await this.fetchImpl(registryPackageUrl(name), {
        headers: {
          accept: "application/json",
          "user-agent": this.userAgent
        },
        signal: controller.signal
      });
      if (response.status === 404) {
        return { status: "not_found", ecosystem: "crates", name };
      }
      if (response.status === 429) {
        return failure(
          name,
          "rate_limited",
          "crates.io registry rate limit exceeded.",
          true
        );
      }
      if (response.status >= 500) {
        return failure(
          name,
          "server_error",
          `crates.io registry returned HTTP ${response.status}.`,
          true
        );
      }
      if (!response.ok) {
        return failure(
          name,
          "network_error",
          `crates.io registry returned HTTP ${response.status}.`,
          false
        );
      }
      const metadata = await response.json();
      return parseMetadata(name, metadata);
    } catch (error) {
      const message = error instanceof Error && error.name === "AbortError" ? "crates.io registry request timed out." : error instanceof Error ? error.message : String(error);
      return failure(name, "network_error", message, true);
    } finally {
      clearTimeout(timeout);
    }
  }
};
function parseMetadata(name, metadata) {
  if (!isCratesMetadata(metadata)) {
    return failure(
      name,
      "invalid_response",
      "crates.io registry returned invalid crate metadata.",
      false
    );
  }
  const firstPublishedAt = firstPublishedDate(metadata);
  const found = {
    status: "found",
    ecosystem: "crates",
    name,
    registryUrl: registryPackageUrl(name)
  };
  return firstPublishedAt === void 0 ? found : { ...found, firstPublishedAt };
}
function firstPublishedDate(metadata) {
  const crateCreated = dateFromString(metadata.crate.created_at);
  if (crateCreated !== void 0) {
    return crateCreated;
  }
  const publishTimes = (metadata.versions ?? []).map((version) => dateFromString(version.created_at)).filter((date) => date !== void 0).sort((left, right) => left.getTime() - right.getTime());
  return publishTimes[0];
}
function dateFromString(input) {
  if (input === void 0) {
    return void 0;
  }
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? void 0 : date;
}
function isCratesMetadata(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  const metadata = input;
  if (typeof metadata.crate !== "object" || metadata.crate === null || Array.isArray(metadata.crate)) {
    return false;
  }
  if (metadata.versions !== void 0 && !Array.isArray(metadata.versions)) {
    return false;
  }
  const crate = metadata.crate;
  const versions = metadata.versions;
  return (crate.id === void 0 || typeof crate.id === "string") && (crate.name === void 0 || typeof crate.name === "string") && (crate.created_at === void 0 || typeof crate.created_at === "string") && (versions ?? []).every(isCratesVersion);
}
function isCratesVersion(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  const version = input;
  return version.created_at === void 0 || typeof version.created_at === "string";
}
function registryPackageUrl(name) {
  return `${cratesRegistryUrl}/${encodeURIComponent(name)}`;
}
function failure(name, status, message, retryable) {
  return {
    status,
    ecosystem: "crates",
    name,
    message,
    retryable
  };
}
function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}

// src/registries/go.ts
var defaultProxyUrl = "https://proxy.golang.org";
var defaultTimeoutMs2 = 8e3;
var defaultRetries2 = 2;
var defaultMaxVersionInfoRequests = 40;
var GoProxyRegistryClient = class {
  proxyUrl;
  timeoutMs;
  retries;
  maxVersionInfoRequests;
  userAgent;
  fetchImpl;
  cache = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    this.proxyUrl = (options.proxyUrl ?? defaultProxyUrl).replace(/\/+$/u, "");
    this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs2;
    this.retries = options.retries ?? defaultRetries2;
    this.maxVersionInfoRequests = options.maxVersionInfoRequests ?? defaultMaxVersionInfoRequests;
    this.userAgent = options.userAgent ?? sloplockUserAgent;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }
  async getPackage(reference) {
    if (reference.ecosystem !== "go") {
      return {
        status: "unsupported",
        ecosystem: reference.ecosystem,
        name: reference.name,
        message: "Go proxy registry client only supports Go modules.",
        retryable: false
      };
    }
    const cached = this.cache.get(reference.name);
    if (cached !== void 0) {
      return cached;
    }
    const request = this.getPackageUncached(reference.name);
    this.cache.set(reference.name, request);
    return request;
  }
  async getPackageUncached(name) {
    const versionsResult = await this.fetchVersionList(name);
    if (versionsResult.status === "failure") {
      return versionsResult.failure;
    }
    if (versionsResult.status === "success" && versionsResult.versions.length > 0) {
      return this.foundFromVersionList(name, versionsResult.versions);
    }
    const latest = await this.fetchVersionInfo(name, "@latest");
    if (latest.status === "not_found") {
      return { status: "not_found", ecosystem: "go", name };
    }
    if (latest.status === "failure") {
      return latest.failure;
    }
    return foundResult(name, this.moduleProxyUrl(name), latest.firstPublishedAt);
  }
  async foundFromVersionList(name, versions) {
    const candidateVersions = [...versions].sort(compareGoVersions).slice(0, this.maxVersionInfoRequests);
    const firstPublishedDates = [];
    for (const version of candidateVersions) {
      const result = await this.fetchVersionInfo(name, version);
      if (result.status === "success" && result.firstPublishedAt !== void 0) {
        firstPublishedDates.push(result.firstPublishedAt);
      }
    }
    firstPublishedDates.sort((left, right) => left.getTime() - right.getTime());
    return foundResult(name, this.moduleProxyUrl(name), firstPublishedDates[0]);
  }
  async fetchVersionList(name) {
    const result = await this.fetchProxyPath(name, "@v/list");
    if (result.status !== "success") {
      return result;
    }
    const text2 = await result.response.text();
    return {
      status: "success",
      versions: text2.split(/\r?\n/u).map((version) => version.trim()).filter((version) => isGoVersion(version))
    };
  }
  async fetchVersionInfo(name, version) {
    const result = await this.fetchProxyPath(
      name,
      version === "@latest" ? "@latest" : `@v/${escapeGoProxyPath(version)}.info`
    );
    if (result.status !== "success") {
      return result;
    }
    try {
      const metadata = await result.response.json();
      if (!isGoVersionInfo(metadata)) {
        return {
          status: "failure",
          failure: failure2(
            name,
            "invalid_response",
            "Go module proxy returned invalid version metadata.",
            false
          )
        };
      }
      const firstPublishedAt = dateFromString2(metadata.Time);
      return firstPublishedAt === void 0 ? { status: "success" } : { status: "success", firstPublishedAt };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        status: "failure",
        failure: failure2(
          name,
          "invalid_response",
          `Go module proxy returned invalid JSON: ${message}`,
          false
        )
      };
    }
  }
  async fetchProxyPath(name, proxyPath) {
    let lastFailure;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const result = await this.fetchProxyPathOnce(name, proxyPath);
      if (result.status === "success" || result.status === "not_found") {
        return result;
      }
      lastFailure = result.failure;
      if (!result.failure.retryable || attempt === this.retries) {
        return result;
      }
      await sleep2(100 * (attempt + 1));
    }
    return {
      status: "failure",
      failure: lastFailure ?? failure2(
        name,
        "network_error",
        "Go module proxy request failed without a response.",
        true
      )
    };
  }
  async fetchProxyPathOnce(name, proxyPath) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);
    try {
      const response = await this.fetchImpl(
        `${this.moduleProxyUrl(name)}/${proxyPath}`,
        {
          headers: {
            accept: "application/json,text/plain;q=0.9",
            "user-agent": this.userAgent
          },
          signal: controller.signal
        }
      );
      if (response.status === 404 || response.status === 410) {
        return { status: "not_found" };
      }
      if (response.status === 429) {
        return {
          status: "failure",
          failure: failure2(
            name,
            "rate_limited",
            "Go module proxy rate limit exceeded.",
            true
          )
        };
      }
      if (response.status >= 500) {
        return {
          status: "failure",
          failure: failure2(
            name,
            "server_error",
            `Go module proxy returned HTTP ${response.status}.`,
            true
          )
        };
      }
      if (!response.ok) {
        return {
          status: "failure",
          failure: failure2(
            name,
            "network_error",
            `Go module proxy returned HTTP ${response.status}.`,
            false
          )
        };
      }
      return { status: "success", response };
    } catch (error) {
      const message = error instanceof Error && error.name === "AbortError" ? "Go module proxy request timed out." : error instanceof Error ? error.message : String(error);
      return {
        status: "failure",
        failure: failure2(name, "network_error", message, true)
      };
    } finally {
      clearTimeout(timeout);
    }
  }
  moduleProxyUrl(name) {
    return `${this.proxyUrl}/${escapeGoProxyPath(name)}`;
  }
};
function foundResult(name, registryUrl, firstPublishedAt) {
  const found = {
    status: "found",
    ecosystem: "go",
    name,
    registryUrl
  };
  return firstPublishedAt === void 0 ? found : { ...found, firstPublishedAt };
}
function failure2(name, status, message, retryable) {
  return {
    status,
    ecosystem: "go",
    name,
    message,
    retryable
  };
}
function isGoVersionInfo(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  const metadata = input;
  return (metadata.Version === void 0 || typeof metadata.Version === "string") && (metadata.Time === void 0 || typeof metadata.Time === "string");
}
function dateFromString2(input) {
  if (input === void 0) {
    return void 0;
  }
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? void 0 : date;
}
function compareGoVersions(left, right) {
  const parsedLeft = parseGoVersion(left);
  const parsedRight = parseGoVersion(right);
  if (parsedLeft === void 0 || parsedRight === void 0) {
    return left.localeCompare(right);
  }
  return parsedLeft.major - parsedRight.major || parsedLeft.minor - parsedRight.minor || parsedLeft.patch - parsedRight.patch || comparePrerelease(parsedLeft.prerelease, parsedRight.prerelease) || left.localeCompare(right);
}
function parseGoVersion(input) {
  const match = /^v(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:-(?<prerelease>[0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/u.exec(
    input
  );
  if (match?.groups === void 0) {
    return void 0;
  }
  const major = Number(match.groups.major);
  const minor = Number(match.groups.minor);
  const patch = Number(match.groups.patch);
  if (!Number.isSafeInteger(major) || !Number.isSafeInteger(minor) || !Number.isSafeInteger(patch)) {
    return void 0;
  }
  return {
    major,
    minor,
    patch,
    ...match.groups.prerelease === void 0 ? {} : { prerelease: match.groups.prerelease }
  };
}
function comparePrerelease(left, right) {
  if (left === void 0 && right === void 0) {
    return 0;
  }
  if (left === void 0) {
    return 1;
  }
  if (right === void 0) {
    return -1;
  }
  return left.localeCompare(right);
}
function isGoVersion(input) {
  return parseGoVersion(input) !== void 0;
}
function sleep2(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}

// src/registries/maven.ts
var mavenCentralSearchUrl = "https://central.sonatype.com/solrsearch/select";
var defaultTimeoutMs3 = 8e3;
var defaultRetries3 = 2;
var rowsPerPage = 200;
var MavenCentralRegistryClient = class {
  timeoutMs;
  retries;
  userAgent;
  fetchImpl;
  cache = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs3;
    this.retries = options.retries ?? defaultRetries3;
    this.userAgent = options.userAgent ?? sloplockUserAgent;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }
  async getPackage(reference) {
    if (reference.ecosystem !== "maven") {
      return {
        status: "unsupported",
        ecosystem: reference.ecosystem,
        name: reference.name,
        message: "Maven Central registry client only supports Maven packages.",
        retryable: false
      };
    }
    const cached = this.cache.get(reference.name);
    if (cached !== void 0) {
      return cached;
    }
    const request = this.getPackageUncached(reference.name);
    this.cache.set(reference.name, request);
    return request;
  }
  async getPackageUncached(name) {
    const coordinate = mavenCoordinateParts(name);
    if (coordinate === void 0) {
      return failure3(
        name,
        "unsupported",
        "Maven package name must be groupId:artifactId.",
        false
      );
    }
    let lastFailure;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const result = await this.fetchPackage(name, coordinate);
      if (result.status === "found" || result.status === "not_found") {
        return result;
      }
      lastFailure = result;
      if (!result.retryable || attempt === this.retries) {
        return result;
      }
      await sleep3(100 * (attempt + 1));
    }
    return lastFailure ?? {
      status: "network_error",
      ecosystem: "maven",
      name,
      message: "Maven Central registry request failed without a response.",
      retryable: true
    };
  }
  async fetchPackage(name, coordinate) {
    const docs = [];
    let start = 0;
    let numFound;
    let pageDocs = [];
    do {
      const result = await this.fetchPage(name, coordinate, start);
      if (result.status !== "ok") {
        return result.failure;
      }
      pageDocs = result.metadata.response.docs;
      docs.push(...pageDocs);
      numFound = result.metadata.response.numFound;
      start += rowsPerPage;
    } while (docs.length < numFound && pageDocs.length > 0);
    if (numFound === 0) {
      return { status: "not_found", ecosystem: "maven", name };
    }
    return parseDocs(name, coordinate, docs);
  }
  async fetchPage(name, coordinate, start) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);
    try {
      const response = await this.fetchImpl(searchUrl(coordinate, start), {
        headers: {
          accept: "application/json",
          "user-agent": this.userAgent
        },
        signal: controller.signal
      });
      if (response.status === 429) {
        return {
          status: "failure",
          failure: failure3(
            name,
            "rate_limited",
            "Maven Central registry rate limit exceeded.",
            true
          )
        };
      }
      if (response.status >= 500) {
        return {
          status: "failure",
          failure: failure3(
            name,
            "server_error",
            `Maven Central registry returned HTTP ${response.status}.`,
            true
          )
        };
      }
      if (!response.ok) {
        return {
          status: "failure",
          failure: failure3(
            name,
            "network_error",
            `Maven Central registry returned HTTP ${response.status}.`,
            false
          )
        };
      }
      let metadata;
      try {
        metadata = await response.json();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          status: "failure",
          failure: failure3(
            name,
            "invalid_response",
            `Maven Central registry returned invalid JSON: ${message}`,
            false
          )
        };
      }
      if (!isMavenCentralSearchResponse(metadata)) {
        return {
          status: "failure",
          failure: failure3(
            name,
            "invalid_response",
            "Maven Central registry returned invalid package metadata.",
            false
          )
        };
      }
      return { status: "ok", metadata };
    } catch (error) {
      const message = error instanceof Error && error.name === "AbortError" ? "Maven Central registry request timed out." : error instanceof Error ? error.message : String(error);
      return {
        status: "failure",
        failure: failure3(name, "network_error", message, true)
      };
    } finally {
      clearTimeout(timeout);
    }
  }
};
function parseDocs(name, coordinate, docs) {
  const exactDocs = docs.filter(
    (doc) => doc.g === coordinate.groupId && doc.a === coordinate.artifactId
  );
  if (exactDocs.length === 0) {
    return { status: "not_found", ecosystem: "maven", name };
  }
  const firstPublishedAt = exactDocs.map((doc) => dateFromTimestamp(doc.timestamp)).filter((date) => date !== void 0).sort((left, right) => left.getTime() - right.getTime())[0];
  const found = {
    status: "found",
    ecosystem: "maven",
    name,
    registryUrl: registryPackageUrl2(coordinate)
  };
  return firstPublishedAt === void 0 ? found : { ...found, firstPublishedAt };
}
function searchUrl(coordinate, start) {
  const url = new URL(mavenCentralSearchUrl);
  url.searchParams.set(
    "q",
    `g:${coordinate.groupId} AND a:${coordinate.artifactId}`
  );
  url.searchParams.set("core", "gav");
  url.searchParams.set("wt", "json");
  url.searchParams.set("rows", String(rowsPerPage));
  url.searchParams.set("start", String(start));
  return url.toString();
}
function registryPackageUrl2(input) {
  return `https://central.sonatype.com/artifact/${encodeURIComponent(
    input.groupId
  )}/${encodeURIComponent(input.artifactId)}`;
}
function dateFromTimestamp(input) {
  if (input === void 0 || !Number.isFinite(input)) {
    return void 0;
  }
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? void 0 : date;
}
function isMavenCentralSearchResponse(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  const response = input.response;
  if (typeof response !== "object" || response === null || Array.isArray(response)) {
    return false;
  }
  const metadata = response;
  return typeof metadata.numFound === "number" && Number.isInteger(metadata.numFound) && metadata.numFound >= 0 && Array.isArray(metadata.docs) && metadata.docs.every(isMavenCentralDoc);
}
function isMavenCentralDoc(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  const doc = input;
  return typeof doc.g === "string" && typeof doc.a === "string" && (doc.timestamp === void 0 || typeof doc.timestamp === "number");
}
function failure3(name, status, message, retryable) {
  return {
    status,
    ecosystem: "maven",
    name,
    message,
    retryable
  };
}
function sleep3(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}

// src/registries/nuget.ts
var nugetServiceIndexUrl = "https://api.nuget.org/v3/index.json";
var defaultTimeoutMs4 = 8e3;
var defaultRetries4 = 2;
var NugetRegistryClient = class {
  timeoutMs;
  retries;
  userAgent;
  fetchImpl;
  cache = /* @__PURE__ */ new Map();
  serviceIndexRequest;
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs4;
    this.retries = options.retries ?? defaultRetries4;
    this.userAgent = options.userAgent ?? sloplockUserAgent;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }
  async getPackage(reference) {
    if (reference.ecosystem !== "nuget") {
      return {
        status: "unsupported",
        ecosystem: reference.ecosystem,
        name: reference.name,
        message: "NuGet.org registry client only supports NuGet packages.",
        retryable: false
      };
    }
    const cached = this.cache.get(reference.name);
    if (cached !== void 0) {
      return cached;
    }
    const request = this.getPackageUncached(reference.name);
    this.cache.set(reference.name, request);
    return request;
  }
  async getPackageUncached(name) {
    let lastFailure;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const result = await this.fetchPackage(name);
      if (result.status === "found" || result.status === "not_found") {
        return result;
      }
      lastFailure = result;
      if (!result.retryable || attempt === this.retries) {
        return result;
      }
      await sleep4(100 * (attempt + 1));
    }
    return lastFailure ?? {
      status: "network_error",
      ecosystem: "nuget",
      name,
      message: "NuGet.org registry request failed without a response.",
      retryable: true
    };
  }
  async fetchPackage(name) {
    const registrationBase = await this.registrationBaseUrl(name);
    if (typeof registrationBase !== "string") {
      return registrationBase;
    }
    const indexUrl = `${registrationBase}${encodeURIComponent(name.toLowerCase())}/index.json`;
    const indexResult = await this.fetchJson(name, indexUrl);
    if (indexResult.status === "not_found") {
      return { status: "not_found", ecosystem: "nuget", name };
    }
    if (indexResult.status !== "ok") {
      return indexResult.failure;
    }
    return this.parseRegistrationIndex(name, indexUrl, indexResult.body);
  }
  async registrationBaseUrl(name) {
    this.serviceIndexRequest ??= this.fetchServiceIndex(name);
    try {
      return await this.serviceIndexRequest;
    } catch (error) {
      this.serviceIndexRequest = void 0;
      return failure4(
        name,
        "network_error",
        error instanceof Error ? error.message : String(error),
        true
      );
    }
  }
  async fetchServiceIndex(name) {
    const result = await this.fetchJson(name, nugetServiceIndexUrl);
    if (result.status !== "ok") {
      throw new Error(result.status === "not_found" ? "NuGet.org service index was not found." : result.failure.message);
    }
    if (!isServiceIndex(result.body)) {
      throw new Error("NuGet.org service index returned invalid metadata.");
    }
    const resource = result.body.resources.find(
      (candidate) => isRegistrationBaseType(candidate["@type"])
    );
    const resourceUrl = resource?.["@id"];
    if (resourceUrl === void 0) {
      throw new Error("NuGet.org service index did not include a registration base URL.");
    }
    return resourceUrl.endsWith("/") ? resourceUrl : `${resourceUrl}/`;
  }
  async parseRegistrationIndex(name, indexUrl, body) {
    if (!isRegistrationIndex(body)) {
      return failure4(
        name,
        "invalid_response",
        "NuGet.org registry returned invalid package metadata.",
        false
      );
    }
    const pageResults = await Promise.all(
      (body.items ?? []).map(async (page) => {
        if (Array.isArray(page.items)) {
          return { status: "ok", leaves: page.items };
        }
        if (page["@id"] === void 0) {
          return {
            status: "failure",
            failure: failure4(
              name,
              "invalid_response",
              "NuGet.org registry returned a registration page without items.",
              false
            )
          };
        }
        const pageResult = await this.fetchJson(name, page["@id"]);
        if (pageResult.status !== "ok") {
          return {
            status: "failure",
            failure: pageResult.status === "not_found" ? failure4(
              name,
              "invalid_response",
              "NuGet.org registry registration page was not found.",
              false
            ) : pageResult.failure
          };
        }
        return isRegistrationPage(pageResult.body) ? { status: "ok", leaves: pageResult.body.items ?? [] } : {
          status: "failure",
          failure: failure4(
            name,
            "invalid_response",
            "NuGet.org registry returned invalid registration page metadata.",
            false
          )
        };
      })
    );
    const failedPage = pageResults.find((page) => page.status === "failure");
    if (failedPage?.status === "failure") {
      return failedPage.failure;
    }
    const firstPublishedAt = firstPublishedDate2(
      pageResults.flatMap((page) => page.status === "ok" ? page.leaves : [])
    );
    const found = {
      status: "found",
      ecosystem: "nuget",
      name,
      registryUrl: indexUrl
    };
    return firstPublishedAt === void 0 ? found : { ...found, firstPublishedAt };
  }
  async fetchJson(name, url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);
    try {
      const response = await this.fetchImpl(url, {
        headers: {
          accept: "application/json",
          "user-agent": this.userAgent
        },
        signal: controller.signal
      });
      if (response.status === 404) {
        return { status: "not_found" };
      }
      if (response.status === 429) {
        return {
          status: "failure",
          failure: failure4(name, "rate_limited", "NuGet.org registry rate limit exceeded.", true)
        };
      }
      if (response.status >= 500) {
        return {
          status: "failure",
          failure: failure4(
            name,
            "server_error",
            `NuGet.org registry returned HTTP ${response.status}.`,
            true
          )
        };
      }
      if (!response.ok) {
        return {
          status: "failure",
          failure: failure4(
            name,
            "network_error",
            `NuGet.org registry returned HTTP ${response.status}.`,
            false
          )
        };
      }
      return { status: "ok", body: await response.json() };
    } catch (error) {
      const message = error instanceof Error && error.name === "AbortError" ? "NuGet.org registry request timed out." : error instanceof Error ? error.message : String(error);
      return {
        status: "failure",
        failure: failure4(name, "network_error", message, true)
      };
    } finally {
      clearTimeout(timeout);
    }
  }
};
function firstPublishedDate2(leaves) {
  const publishedDates = leaves.map((leaf) => dateFromString3(leaf.catalogEntry?.published ?? leaf.published)).filter((date) => date !== void 0).filter((date) => date.getUTCFullYear() > 1900).sort((left, right) => left.getTime() - right.getTime());
  return publishedDates[0];
}
function dateFromString3(input) {
  if (input === void 0) {
    return void 0;
  }
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? void 0 : date;
}
function isServiceIndex(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  const resources = input.resources;
  return Array.isArray(resources) && resources.every(isServiceIndexResource);
}
function isServiceIndexResource(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  const resource = input;
  return (resource["@id"] === void 0 || typeof resource["@id"] === "string") && (resource["@type"] === void 0 || typeof resource["@type"] === "string");
}
function isRegistrationIndex(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  const items = input.items;
  return items === void 0 || Array.isArray(items) && items.every(isRegistrationPage);
}
function isRegistrationPage(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  const page = input;
  return (page["@id"] === void 0 || typeof page["@id"] === "string") && (page.items === void 0 || Array.isArray(page.items) && page.items.every(isRegistrationLeaf));
}
function isRegistrationLeaf(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  const leaf = input;
  if (leaf.published !== void 0 && typeof leaf.published !== "string") {
    return false;
  }
  if (leaf.catalogEntry === void 0) {
    return true;
  }
  if (typeof leaf.catalogEntry !== "object" || leaf.catalogEntry === null || Array.isArray(leaf.catalogEntry)) {
    return false;
  }
  const catalogEntry = leaf.catalogEntry;
  return catalogEntry.published === void 0 || typeof catalogEntry.published === "string";
}
function isRegistrationBaseType(input) {
  if (input === void 0) {
    return false;
  }
  return input.split(/\s+/u).some((entry) => entry.toLowerCase().startsWith("registrationsbaseurl/"));
}
function failure4(name, status, message, retryable) {
  return {
    status,
    ecosystem: "nuget",
    name,
    message,
    retryable
  };
}
function sleep4(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}

// src/registries/npm.ts
var npmRegistryUrl = "https://registry.npmjs.org";
var defaultTimeoutMs5 = 8e3;
var defaultRetries5 = 2;
var NpmRegistryClient = class {
  timeoutMs;
  retries;
  userAgent;
  fetchImpl;
  cache = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs5;
    this.retries = options.retries ?? defaultRetries5;
    this.userAgent = options.userAgent ?? sloplockUserAgent;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }
  async getPackage(reference) {
    if (reference.ecosystem !== "npm") {
      return {
        status: "unsupported",
        ecosystem: reference.ecosystem,
        name: reference.name,
        message: "npm registry client only supports npm packages.",
        retryable: false
      };
    }
    const { name } = reference;
    const cached = this.cache.get(name);
    if (cached !== void 0) {
      return cached;
    }
    const request = this.getPackageUncached(name);
    this.cache.set(name, request);
    return request;
  }
  async getPackageUncached(name) {
    let lastFailure;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const result = await this.fetchPackage(name);
      if (result.status === "found" || result.status === "not_found") {
        return result;
      }
      lastFailure = result;
      if (!result.retryable || attempt === this.retries) {
        return result;
      }
      await sleep5(100 * (attempt + 1));
    }
    return lastFailure ?? {
      status: "network_error",
      ecosystem: "npm",
      name,
      message: "npm registry request failed without a response.",
      retryable: true
    };
  }
  async fetchPackage(name) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);
    try {
      const response = await this.fetchImpl(registryPackageUrl3(name), {
        headers: {
          accept: "application/json",
          "user-agent": this.userAgent
        },
        signal: controller.signal
      });
      if (response.status === 404) {
        return { status: "not_found", ecosystem: "npm", name };
      }
      if (response.status === 429) {
        return failure5(name, "rate_limited", "npm registry rate limit exceeded.", true);
      }
      if (response.status >= 500) {
        return failure5(
          name,
          "server_error",
          `npm registry returned HTTP ${response.status}.`,
          true
        );
      }
      if (!response.ok) {
        return failure5(
          name,
          "network_error",
          `npm registry returned HTTP ${response.status}.`,
          false
        );
      }
      const metadata = await response.json();
      return parseMetadata2(name, metadata);
    } catch (error) {
      const message = error instanceof Error && error.name === "AbortError" ? "npm registry request timed out." : error instanceof Error ? error.message : String(error);
      return failure5(name, "network_error", message, true);
    } finally {
      clearTimeout(timeout);
    }
  }
};
function parseMetadata2(name, metadata) {
  if (!isNpmMetadata(metadata)) {
    return failure5(
      name,
      "invalid_response",
      "npm registry returned invalid package metadata.",
      false
    );
  }
  const firstPublishedAt = firstPublishedDate3(metadata);
  const found = {
    status: "found",
    ecosystem: "npm",
    name,
    registryUrl: registryPackageUrl3(name)
  };
  return firstPublishedAt === void 0 ? found : { ...found, firstPublishedAt };
}
function firstPublishedDate3(metadata) {
  const time = metadata.time;
  if (time === void 0) {
    return void 0;
  }
  const created = dateFromString4(time.created);
  if (created !== void 0) {
    return created;
  }
  const publishTimes = Object.entries(time).filter(([key]) => key !== "modified").map(([, value]) => dateFromString4(value)).filter((date) => date !== void 0).sort((left, right) => left.getTime() - right.getTime());
  return publishTimes[0];
}
function dateFromString4(input) {
  if (input === void 0) {
    return void 0;
  }
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? void 0 : date;
}
function registryPackageUrl3(name) {
  return `${npmRegistryUrl}/${encodeURIComponent(name)}`;
}
function failure5(name, status, message, retryable) {
  return {
    status,
    ecosystem: "npm",
    name,
    message,
    retryable
  };
}
function isNpmMetadata(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  const metadata = input;
  if (metadata.time === void 0) {
    return true;
  }
  if (typeof metadata.time !== "object" || metadata.time === null || Array.isArray(metadata.time)) {
    return false;
  }
  return Object.values(metadata.time).every((value) => typeof value === "string");
}
function sleep5(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}

// src/registries/packagist.ts
var packagistApiUrl = "https://packagist.org/packages";
var defaultTimeoutMs6 = 8e3;
var defaultRetries6 = 2;
var PackagistRegistryClient = class {
  timeoutMs;
  retries;
  userAgent;
  fetchImpl;
  cache = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs6;
    this.retries = options.retries ?? defaultRetries6;
    this.userAgent = options.userAgent ?? sloplockUserAgent;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }
  async getPackage(reference) {
    if (reference.ecosystem !== "packagist") {
      return {
        status: "unsupported",
        ecosystem: reference.ecosystem,
        name: reference.name,
        message: "Packagist registry client only supports Packagist packages.",
        retryable: false
      };
    }
    const cached = this.cache.get(reference.name);
    if (cached !== void 0) {
      return cached;
    }
    const request = this.getPackageUncached(reference.name);
    this.cache.set(reference.name, request);
    return request;
  }
  async getPackageUncached(name) {
    let lastFailure;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const result = await this.fetchPackage(name);
      if (result.status === "found" || result.status === "not_found") {
        return result;
      }
      lastFailure = result;
      if (!result.retryable || attempt === this.retries) {
        return result;
      }
      await sleep6(100 * (attempt + 1));
    }
    return lastFailure ?? {
      status: "network_error",
      ecosystem: "packagist",
      name,
      message: "Packagist registry request failed without a response.",
      retryable: true
    };
  }
  async fetchPackage(name) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);
    try {
      const response = await this.fetchImpl(registryPackageUrl4(name), {
        headers: {
          accept: "application/json",
          "user-agent": this.userAgent
        },
        signal: controller.signal
      });
      if (response.status === 404) {
        return { status: "not_found", ecosystem: "packagist", name };
      }
      if (response.status === 429) {
        return failure6(
          name,
          "rate_limited",
          "Packagist registry rate limit exceeded.",
          true
        );
      }
      if (response.status >= 500) {
        return failure6(
          name,
          "server_error",
          `Packagist registry returned HTTP ${response.status}.`,
          true
        );
      }
      if (!response.ok) {
        return failure6(
          name,
          "network_error",
          `Packagist registry returned HTTP ${response.status}.`,
          false
        );
      }
      let metadata;
      try {
        metadata = await response.json();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return failure6(
          name,
          "invalid_response",
          `Packagist registry returned invalid JSON: ${message}`,
          false
        );
      }
      return parseMetadata3(name, metadata);
    } catch (error) {
      const message = error instanceof Error && error.name === "AbortError" ? "Packagist registry request timed out." : error instanceof Error ? error.message : String(error);
      return failure6(name, "network_error", message, true);
    } finally {
      clearTimeout(timeout);
    }
  }
};
function parseMetadata3(name, metadata) {
  if (!isPackagistMetadata(metadata)) {
    return failure6(
      name,
      "invalid_response",
      "Packagist registry returned invalid package metadata.",
      false
    );
  }
  const firstPublishedAt = firstPublishedDate4(metadata);
  const found = {
    status: "found",
    ecosystem: "packagist",
    name,
    registryUrl: registryPackageUrl4(name)
  };
  return firstPublishedAt === void 0 ? found : { ...found, firstPublishedAt };
}
function firstPublishedDate4(metadata) {
  const created = dateFromString5(metadata.package.time);
  if (created !== void 0) {
    return created;
  }
  const publishTimes = Object.values(metadata.package.versions ?? {}).map((version) => dateFromString5(version.time)).filter((date) => date !== void 0).sort((left, right) => left.getTime() - right.getTime());
  return publishTimes[0];
}
function dateFromString5(input) {
  if (input === void 0) {
    return void 0;
  }
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? void 0 : date;
}
function isPackagistMetadata(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  const metadata = input;
  if (typeof metadata.package !== "object" || metadata.package === null || Array.isArray(metadata.package)) {
    return false;
  }
  const packageMetadata = metadata.package;
  return (packageMetadata.name === void 0 || typeof packageMetadata.name === "string") && (packageMetadata.time === void 0 || typeof packageMetadata.time === "string") && isOptionalVersionMap(packageMetadata.versions);
}
function isOptionalVersionMap(input) {
  if (input === void 0) {
    return true;
  }
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  return Object.values(input).every(isPackagistVersion);
}
function isPackagistVersion(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  const version = input;
  return version.time === void 0 || typeof version.time === "string";
}
function registryPackageUrl4(name) {
  const [vendor, packageName] = name.split("/", 2);
  return `${packagistApiUrl}/${encodeURIComponent(
    vendor ?? name
  )}/${encodeURIComponent(packageName ?? "")}.json`;
}
function failure6(name, status, message, retryable) {
  return {
    status,
    ecosystem: "packagist",
    name,
    message,
    retryable
  };
}
function sleep6(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}

// src/registries/pypi.ts
var pypiRegistryUrl = "https://pypi.org/pypi";
var defaultTimeoutMs7 = 8e3;
var defaultRetries7 = 2;
var PypiRegistryClient = class {
  timeoutMs;
  retries;
  userAgent;
  fetchImpl;
  cache = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs7;
    this.retries = options.retries ?? defaultRetries7;
    this.userAgent = options.userAgent ?? sloplockUserAgent;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }
  async getPackage(reference) {
    if (reference.ecosystem !== "pypi") {
      return {
        status: "unsupported",
        ecosystem: reference.ecosystem,
        name: reference.name,
        message: "PyPI registry client only supports PyPI packages.",
        retryable: false
      };
    }
    const cached = this.cache.get(reference.name);
    if (cached !== void 0) {
      return cached;
    }
    const request = this.getPackageUncached(reference.name);
    this.cache.set(reference.name, request);
    return request;
  }
  async getPackageUncached(name) {
    let lastFailure;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const result = await this.fetchPackage(name);
      if (result.status === "found" || result.status === "not_found") {
        return result;
      }
      lastFailure = result;
      if (!result.retryable || attempt === this.retries) {
        return result;
      }
      await sleep7(100 * (attempt + 1));
    }
    return lastFailure ?? {
      status: "network_error",
      ecosystem: "pypi",
      name,
      message: "PyPI registry request failed without a response.",
      retryable: true
    };
  }
  async fetchPackage(name) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);
    try {
      const response = await this.fetchImpl(registryPackageUrl5(name), {
        headers: {
          accept: "application/json",
          "user-agent": this.userAgent
        },
        signal: controller.signal
      });
      if (response.status === 404) {
        return { status: "not_found", ecosystem: "pypi", name };
      }
      if (response.status === 429) {
        return failure7(name, "rate_limited", "PyPI registry rate limit exceeded.", true);
      }
      if (response.status >= 500) {
        return failure7(
          name,
          "server_error",
          `PyPI registry returned HTTP ${response.status}.`,
          true
        );
      }
      if (!response.ok) {
        return failure7(
          name,
          "network_error",
          `PyPI registry returned HTTP ${response.status}.`,
          false
        );
      }
      const metadata = await response.json();
      return parseMetadata4(name, metadata);
    } catch (error) {
      const message = error instanceof Error && error.name === "AbortError" ? "PyPI registry request timed out." : error instanceof Error ? error.message : String(error);
      return failure7(name, "network_error", message, true);
    } finally {
      clearTimeout(timeout);
    }
  }
};
function parseMetadata4(name, metadata) {
  if (!isPypiMetadata(metadata)) {
    return failure7(
      name,
      "invalid_response",
      "PyPI registry returned invalid package metadata.",
      false
    );
  }
  const firstPublishedAt = firstPublishedDate5(metadata);
  const found = {
    status: "found",
    ecosystem: "pypi",
    name,
    registryUrl: registryPackageUrl5(name)
  };
  return firstPublishedAt === void 0 ? found : { ...found, firstPublishedAt };
}
function firstPublishedDate5(metadata) {
  const uploadDates = [
    ...uploadDatesFromReleases(metadata.releases),
    ...uploadDatesFromFiles(metadata.urls)
  ].sort((left, right) => left.getTime() - right.getTime());
  return uploadDates[0];
}
function uploadDatesFromReleases(releases) {
  if (releases === void 0) {
    return [];
  }
  return Object.values(releases).flatMap((files) => uploadDatesFromFiles(files));
}
function uploadDatesFromFiles(files) {
  if (files === void 0) {
    return [];
  }
  return files.map((file) => dateFromString6(file.upload_time_iso_8601 ?? file.upload_time)).filter((date) => date !== void 0);
}
function dateFromString6(input) {
  if (input === void 0) {
    return void 0;
  }
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? void 0 : date;
}
function isPypiMetadata(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  const metadata = input;
  return isOptionalReleaseMap(metadata.releases) && isOptionalFileArray(metadata.urls);
}
function isOptionalReleaseMap(input) {
  if (input === void 0) {
    return true;
  }
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  return Object.values(input).every(isOptionalFileArray);
}
function isOptionalFileArray(input) {
  if (input === void 0) {
    return true;
  }
  if (!Array.isArray(input)) {
    return false;
  }
  return input.every((file) => {
    if (typeof file !== "object" || file === null || Array.isArray(file)) {
      return false;
    }
    const uploadTime = file.upload_time;
    const uploadTimeIso = file.upload_time_iso_8601;
    return (uploadTime === void 0 || typeof uploadTime === "string") && (uploadTimeIso === void 0 || typeof uploadTimeIso === "string");
  });
}
function registryPackageUrl5(name) {
  return `${pypiRegistryUrl}/${encodeURIComponent(name)}/json`;
}
function failure7(name, status, message, retryable) {
  return {
    status,
    ecosystem: "pypi",
    name,
    message,
    retryable
  };
}
function sleep7(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}

// src/registries/rubygems.ts
var rubygemsVersionsUrl = "https://rubygems.org/api/v1/versions";
var rubygemsPackagePageUrl = "https://rubygems.org/gems";
var defaultTimeoutMs8 = 8e3;
var defaultRetries8 = 2;
var RubyGemsRegistryClient = class {
  timeoutMs;
  retries;
  userAgent;
  fetchImpl;
  cache = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs8;
    this.retries = options.retries ?? defaultRetries8;
    this.userAgent = options.userAgent ?? sloplockRepositoryUserAgent;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }
  async getPackage(reference) {
    if (reference.ecosystem !== "rubygems") {
      return {
        status: "unsupported",
        ecosystem: reference.ecosystem,
        name: reference.name,
        message: "RubyGems.org registry client only supports RubyGems packages.",
        retryable: false
      };
    }
    const cached = this.cache.get(reference.name);
    if (cached !== void 0) {
      return cached;
    }
    const request = this.getPackageUncached(reference.name);
    this.cache.set(reference.name, request);
    return request;
  }
  async getPackageUncached(name) {
    let lastFailure;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const result = await this.fetchPackage(name);
      if (result.status === "found" || result.status === "not_found") {
        return result;
      }
      lastFailure = result;
      if (!result.retryable || attempt === this.retries) {
        return result;
      }
      await sleep8(100 * (attempt + 1));
    }
    return lastFailure ?? {
      status: "network_error",
      ecosystem: "rubygems",
      name,
      message: "RubyGems.org registry request failed without a response.",
      retryable: true
    };
  }
  async fetchPackage(name) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);
    try {
      const response = await this.fetchImpl(registryVersionsUrl(name), {
        headers: {
          accept: "application/json",
          "user-agent": this.userAgent
        },
        signal: controller.signal
      });
      if (response.status === 404) {
        return { status: "not_found", ecosystem: "rubygems", name };
      }
      if (response.status === 429) {
        return failure8(
          name,
          "rate_limited",
          "RubyGems.org registry rate limit exceeded.",
          true
        );
      }
      if (response.status >= 500) {
        return failure8(
          name,
          "server_error",
          `RubyGems.org registry returned HTTP ${response.status}.`,
          true
        );
      }
      if (!response.ok) {
        return failure8(
          name,
          "network_error",
          `RubyGems.org registry returned HTTP ${response.status}.`,
          false
        );
      }
      let metadata;
      try {
        metadata = await response.json();
      } catch {
        return failure8(
          name,
          "invalid_response",
          "RubyGems.org registry returned invalid package metadata.",
          false
        );
      }
      return parseMetadata5(name, metadata);
    } catch (error) {
      const message = error instanceof Error && error.name === "AbortError" ? "RubyGems.org registry request timed out." : error instanceof Error ? error.message : String(error);
      return failure8(name, "network_error", message, true);
    } finally {
      clearTimeout(timeout);
    }
  }
};
function parseMetadata5(name, metadata) {
  if (!isRubyGemsVersionArray(metadata)) {
    return failure8(
      name,
      "invalid_response",
      "RubyGems.org registry returned invalid package metadata.",
      false
    );
  }
  const firstPublishedAt = firstPublishedDate6(metadata);
  const found = {
    status: "found",
    ecosystem: "rubygems",
    name,
    registryUrl: registryPackagePageUrlFor(name)
  };
  return firstPublishedAt === void 0 ? found : { ...found, firstPublishedAt };
}
function firstPublishedDate6(versions) {
  const publishTimes = versions.map((version) => dateFromString7(version.created_at)).filter((date) => date !== void 0).sort((left, right) => left.getTime() - right.getTime());
  return publishTimes[0];
}
function dateFromString7(input) {
  if (input === void 0) {
    return void 0;
  }
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? void 0 : date;
}
function isRubyGemsVersionArray(input) {
  return Array.isArray(input) && input.every(isRubyGemsVersion);
}
function isRubyGemsVersion(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }
  const version = input;
  return version.created_at === void 0 || typeof version.created_at === "string";
}
function registryVersionsUrl(name) {
  return `${rubygemsVersionsUrl}/${encodeURIComponent(name)}.json`;
}
function registryPackagePageUrlFor(name) {
  return `${rubygemsPackagePageUrl}/${encodeURIComponent(name)}`;
}
function failure8(name, status, message, retryable) {
  return {
    status,
    ecosystem: "rubygems",
    name,
    message,
    retryable
  };
}
function sleep8(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}

// src/registries/index.ts
var DefaultRegistryClient = class {
  crates;
  go;
  maven;
  npm;
  nuget;
  packagist;
  pypi;
  rubygems;
  constructor(input = {}) {
    this.crates = input.crates ?? new CratesRegistryClient();
    this.go = input.go ?? new GoProxyRegistryClient();
    this.maven = input.maven ?? new MavenCentralRegistryClient();
    this.npm = input.npm ?? new NpmRegistryClient();
    this.nuget = input.nuget ?? new NugetRegistryClient();
    this.packagist = input.packagist ?? new PackagistRegistryClient();
    this.pypi = input.pypi ?? new PypiRegistryClient();
    this.rubygems = input.rubygems ?? new RubyGemsRegistryClient();
  }
  getPackage(reference) {
    switch (reference.ecosystem) {
      case "crates":
        return this.crates.getPackage(reference);
      case "go":
        return this.go.getPackage(reference);
      case "maven":
        return this.maven.getPackage(reference);
      case "npm":
        return this.npm.getPackage(reference);
      case "nuget":
        return this.nuget.getPackage(reference);
      case "packagist":
        return this.packagist.getPackage(reference);
      case "pypi":
        return this.pypi.getPackage(reference);
      case "rubygems":
        return this.rubygems.getPackage(reference);
    }
  }
};

// src/core/policy.ts
var millisecondsPerDay = 24 * 60 * 60 * 1e3;
function buildPackageNotFoundFinding(reference) {
  return {
    rule: "package_not_found",
    severity: "high",
    ecosystem: reference.ecosystem,
    package: reference.name,
    evidence: `Package does not exist in the ${registryDisplayName(
      reference.ecosystem
    )} registry.`,
    recommendation: "Verify the intended package name before installing or merging."
  };
}
function buildPackageTooNewFinding(reference, registryPackage, config, now) {
  if (registryPackage.firstPublishedAt === void 0) {
    return void 0;
  }
  const ageDays = Math.floor(
    (now.getTime() - registryPackage.firstPublishedAt.getTime()) / millisecondsPerDay
  );
  if (ageDays < 0) {
    return void 0;
  }
  const severity = ageDays <= config.cooldown.highDays ? "high" : ageDays <= config.cooldown.mediumDays ? "medium" : void 0;
  if (severity === void 0) {
    return void 0;
  }
  return {
    rule: "package_too_new",
    severity,
    ecosystem: reference.ecosystem,
    package: reference.name,
    evidence: `Package was first published ${ageDays} days ago. Cooldown policy is ${config.cooldown.mediumDays} days.`,
    recommendation: "Wait for cooldown or add an explicit temporary allow rule."
  };
}
function applySuppressions(findings, config) {
  return findings.filter((finding) => {
    if (matchesAllow(finding.ecosystem, finding.package, config.allow)) {
      return false;
    }
    return !matchesIgnore(
      finding.ecosystem,
      finding.package,
      finding.rule,
      config.ignore
    );
  });
}
function matchesAllow(ecosystem, packageName, rules) {
  const normalized = normalizePackageName(ecosystem, packageName);
  return rules.some(
    (rule) => normalized !== void 0 && rule.ecosystem === ecosystem && rule.package === normalized
  );
}
function matchesIgnore(ecosystem, packageName, ruleId, rules) {
  const normalized = normalizePackageName(ecosystem, packageName);
  return rules.some(
    (rule) => normalized !== void 0 && rule.ecosystem === ecosystem && rule.package === normalized && rule.rule === ruleId
  );
}

// src/core/scan.ts
var defaultRegistryConcurrency = 8;
async function checkPackages(options) {
  const references = /* @__PURE__ */ new Map();
  for (const input of options.packages) {
    const name = normalizePackageName(input.ecosystem, input.name);
    if (name === void 0) {
      throw new UsageError(
        `Package '${input.name}' is not a valid ${input.ecosystem} package name.`
      );
    }
    const reference = {
      ecosystem: input.ecosystem,
      name,
      ...input.sourceFile === void 0 ? {} : { source: findingSource(input.sourceFile, input.sourceLine) }
    };
    const key = referenceKey(reference);
    if (!references.has(key)) {
      references.set(key, reference);
    }
  }
  const now = options.now ?? /* @__PURE__ */ new Date();
  const loadedConfig = await loadConfig({
    rootDir: options.rootDir ?? ".",
    ...options.configPath === void 0 ? {} : { configPath: options.configPath },
    ...options.failOn === void 0 ? {} : { failOn: options.failOn },
    now
  });
  const goPrivatePatterns = [
    ...loadedConfig.config.go.privateModules,
    ...goPrivatePatternsFromEnvironment()
  ];
  const evaluations = await evaluateReferences({
    references: [...references.values()].filter(
      (reference) => !isPrivateGoModuleReference(reference, goPrivatePatterns)
    ),
    options,
    now,
    config: loadedConfig.config
  });
  return {
    results: evaluations.map((evaluation) => evaluation.result),
    findings: applySuppressions(
      evaluations.flatMap(
        ({ reference, findings }) => findings.map(
          (finding) => reference.source === void 0 ? finding : { ...finding, source: reference.source }
        )
      ),
      loadedConfig.config
    ),
    warnings: [
      ...loadedConfig.warnings,
      ...evaluations.flatMap((evaluation) => evaluation.warnings)
    ],
    registryFailures: evaluations.flatMap((evaluation) => evaluation.registryFailures),
    failOn: loadedConfig.config.failOn
  };
}
function evaluateReferences(input) {
  const registryClient = input.options.registryClient ?? new DefaultRegistryClient();
  return mapWithConcurrency(
    input.references,
    normalizedConcurrency(input.options.registryConcurrency),
    async (reference) => ({
      reference,
      ...await evaluateReference({
        reference,
        registryClient,
        now: input.now,
        config: input.config
      })
    })
  );
}
function findingSource(file, line) {
  return line === void 0 ? { file } : { file, line };
}
async function evaluateReference(input) {
  const registryPackage = await input.registryClient.getPackage({
    ecosystem: input.reference.ecosystem,
    name: input.reference.name
  });
  switch (registryPackage.status) {
    case "found": {
      const finding = buildPackageTooNewFinding(
        input.reference,
        registryPackage,
        input.config,
        input.now
      );
      const warnings = registryPackage.firstPublishedAt === void 0 ? [
        {
          message: `Package ${input.reference.name} returned no first publish timestamp; cooldown skipped.`
        }
      ] : [];
      return {
        result: registryPackage,
        findings: finding === void 0 ? [] : [finding],
        warnings,
        registryFailures: []
      };
    }
    case "not_found":
      if (isAmbiguousMavenSource(input.reference)) {
        const reason = input.reference.registrySource === "ambiguous-lockfile-source" ? "Gradle lockfiles do not record repository source" : "pom.xml declares custom repositories";
        return {
          result: registryPackage,
          findings: [],
          warnings: [
            {
              message: `Skipped Maven coordinate ${input.reference.name} because ${reason} and Maven Central did not prove the coordinate is public.`
            }
          ],
          registryFailures: []
        };
      }
      return {
        result: registryPackage,
        findings: [buildPackageNotFoundFinding(input.reference)],
        warnings: [],
        registryFailures: []
      };
    default:
      return {
        result: registryPackage,
        findings: [],
        warnings: [
          {
            message: `Registry check failed for ${input.reference.name}: ${registryPackage.message}`
          }
        ],
        registryFailures: [registryPackage]
      };
  }
}
function isPrivateGoModuleReference(reference, patterns) {
  return reference.ecosystem === "go" && patterns.some(
    (pattern) => splitGoPrivatePatternList(pattern).some(
      (splitPattern) => matchesGoPrivateModulePattern(reference.name, splitPattern)
    )
  );
}
function referenceKey(reference) {
  return `${reference.ecosystem}:${reference.name}`;
}
function isAmbiguousMavenSource(reference) {
  return reference.ecosystem === "maven" && (reference.registrySource === "ambiguous-custom-repository" || reference.registrySource === "ambiguous-lockfile-source");
}
async function mapWithConcurrency(inputs, concurrency, mapper) {
  const outputs = new Array(inputs.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < inputs.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const input = inputs[currentIndex];
      if (input !== void 0) {
        outputs[currentIndex] = await mapper(input);
      }
    }
  }
  const workerCount = Math.min(concurrency, inputs.length);
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      await worker();
    })
  );
  return outputs;
}
function normalizedConcurrency(input) {
  if (input === void 0 || !Number.isFinite(input)) {
    return defaultRegistryConcurrency;
  }
  return Math.max(1, Math.floor(input));
}

// src/core/severity.ts
var severityRank = {
  low: 0,
  medium: 1,
  high: 2
};
function isAtOrAboveSeverity(severity, threshold) {
  return severityRank[severity] >= severityRank[threshold];
}

// src/hook/install-commands.ts
var import_node_path2 = __toESM(require("node:path"), 1);
var shellPrefixes = /* @__PURE__ */ new Set([
  "sudo",
  "env",
  "command",
  "exec",
  "nohup",
  "time",
  "if",
  "then",
  "else",
  "elif",
  "do",
  "while",
  "until",
  "!",
  "{"
]);
var prefixesWithFlags = /* @__PURE__ */ new Set(["sudo", "env", "nohup", "time"]);
var sudoValueFlags = /* @__PURE__ */ new Set(["-u", "--user", "-g", "--group", "-h", "--host"]);
var envAssignment = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/su;
var publicRegistryHosts = /* @__PURE__ */ new Set([
  "registry.npmjs.org",
  "registry.npmjs.com",
  "registry.yarnpkg.com",
  "pypi.org",
  "pypi.python.org",
  "files.pythonhosted.org",
  "proxy.golang.org",
  "goproxy.io",
  "goproxy.cn",
  "crates.io",
  "index.crates.io",
  "static.crates.io",
  "rubygems.org",
  "index.rubygems.org",
  "api.nuget.org",
  "nuget.org",
  "www.nuget.org",
  "packagist.org",
  "repo.packagist.org"
]);
var publicRegistryNames = /* @__PURE__ */ new Set(["crates-io", "nuget.org", "pypi", "direct", "off"]);
var nonPublic = (value) => value.split(/[\s,|]+/u).filter((entry) => entry.length > 0).some((entry) => !isPublicRegistry(entry));
var anyValue = (value) => value.trim().length > 0;
var registryVariables = {
  NPM_CONFIG_REGISTRY: { ecosystem: "npm", overrides: nonPublic },
  YARN_REGISTRY: { ecosystem: "npm", overrides: nonPublic },
  YARN_NPM_REGISTRY_SERVER: { ecosystem: "npm", overrides: nonPublic },
  PIP_INDEX_URL: { ecosystem: "pypi", overrides: nonPublic },
  PIP_EXTRA_INDEX_URL: { ecosystem: "pypi", overrides: nonPublic },
  PIP_FIND_LINKS: { ecosystem: "pypi", overrides: anyValue },
  UV_INDEX_URL: { ecosystem: "pypi", overrides: nonPublic },
  UV_EXTRA_INDEX_URL: { ecosystem: "pypi", overrides: nonPublic },
  UV_DEFAULT_INDEX: { ecosystem: "pypi", overrides: nonPublic },
  UV_INDEX: { ecosystem: "pypi", overrides: nonPublic },
  UV_FIND_LINKS: { ecosystem: "pypi", overrides: anyValue },
  CARGO_REGISTRY_DEFAULT: { ecosystem: "crates", overrides: nonPublic },
  GOPROXY: { ecosystem: "go", overrides: nonPublic }
};
var goPrivateVariables = /* @__PURE__ */ new Set(["GOPRIVATE", "GONOPROXY"]);
var nodeFlags = {
  value: /* @__PURE__ */ new Set([
    "-w",
    "--workspace",
    "--prefix",
    "-C",
    "--cwd",
    "--filter",
    "--tag",
    "--save-prefix",
    "--loglevel",
    "--userconfig",
    "--cache"
  ]),
  source: /* @__PURE__ */ new Set(["--registry"])
};
var npxFlags = {
  value: /* @__PURE__ */ new Set(["-c", "--call", "--shell", "--shell-auto-fallback"]),
  source: nodeFlags.source
};
var npxPackageFlags = {
  replacing: /* @__PURE__ */ new Set(["-p", "--package"]),
  additional: /* @__PURE__ */ new Set()
};
var pipFlags = {
  value: /* @__PURE__ */ new Set([
    "-r",
    "--requirement",
    "-c",
    "--constraint",
    "-e",
    "--editable",
    "-t",
    "--target",
    "--platform",
    "--python-version",
    "--implementation",
    "--abi",
    "--root",
    "--prefix",
    "--src",
    "-b",
    "--build",
    "--proxy",
    "--timeout",
    "--retries",
    "--trusted-host",
    "--cert",
    "--client-cert",
    "--cache-dir",
    "--log",
    "--config-settings",
    "-C",
    "--report",
    "--progress-bar",
    "--python",
    "-p",
    "--group",
    "-G",
    "--extra",
    "-E",
    "--extras",
    "--package",
    "--project",
    "--directory",
    "-P",
    "--rev",
    "--tag",
    "--branch",
    "--pip-args",
    "--with-requirements",
    "--with-editable"
  ]),
  source: /* @__PURE__ */ new Set([
    "--git",
    "--path",
    "--url",
    "-i",
    "--index-url",
    "--extra-index-url",
    "-f",
    "--find-links",
    "--no-index",
    "--index",
    "--default-index",
    "--source"
  ])
};
var uvxPackageFlags = {
  replacing: /* @__PURE__ */ new Set(["--from", "--spec"]),
  additional: /* @__PURE__ */ new Set(["-w", "--with"])
};
var cargoFlags = {
  value: /* @__PURE__ */ new Set([
    "--features",
    "-F",
    "--rename",
    "--branch",
    "--tag",
    "--rev",
    "--target",
    "--target-dir",
    "-p",
    "--package",
    "--manifest-path",
    "-C",
    "--version",
    "--vers",
    "--root",
    "-j",
    "--jobs",
    "--config",
    "-Z",
    "--profile",
    "--color"
  ]),
  source: /* @__PURE__ */ new Set(["--git", "--path", "--registry", "--index"])
};
var goFlags = {
  value: /* @__PURE__ */ new Set([
    "-tags",
    "-ldflags",
    "-gcflags",
    "-asmflags",
    "-gccgoflags",
    "-mod",
    "-modfile",
    "-overlay",
    "-C",
    "-o",
    "-p",
    "-toolexec",
    "-buildmode",
    "-compiler",
    "-installsuffix",
    "-pkgdir",
    "-buildvcs",
    "-covermode",
    "-coverpkg"
  ]),
  source: /* @__PURE__ */ new Set()
};
var gemFlags = {
  value: /* @__PURE__ */ new Set([
    "-v",
    "--version",
    "-i",
    "--install-dir",
    "-n",
    "--bindir",
    "--platform",
    "--http-proxy",
    "--config-file",
    "-g",
    "--group",
    "-r",
    "--require",
    "--branch",
    "--ref",
    "--glob"
  ]),
  source: /* @__PURE__ */ new Set(["--git", "--github", "--path", "-s", "--source", "--clear-sources", "-l", "--local"])
};
var composerFlags = {
  value: /* @__PURE__ */ new Set([
    "-d",
    "--working-dir",
    "--with",
    "--prefer-install",
    "--audit-format",
    "--apcu-autoloader-prefix"
  ]),
  source: /* @__PURE__ */ new Set()
};
var dotnetFlags = {
  value: /* @__PURE__ */ new Set(["-v", "--version", "-f", "--framework", "--package-directory", "--project"]),
  source: /* @__PURE__ */ new Set(["-s", "--source"])
};
var goThreeElementHosts = /* @__PURE__ */ new Set([
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "codeberg.org",
  "golang.org"
]);
var goTwoElementHosts = /* @__PURE__ */ new Set([
  "gopkg.in",
  "google.golang.org",
  "k8s.io",
  "sigs.k8s.io",
  "go.uber.org"
]);
function extractInstallPackages(command, env = process.env) {
  const seen = /* @__PURE__ */ new Set();
  const packages = [];
  const variables = /* @__PURE__ */ new Map();
  for (const [name, value] of Object.entries(env)) {
    if (value !== void 0) {
      setVariable(variables, name, value);
    }
  }
  for (const tokens of splitCommands(command)) {
    const { tokens: commandTokens, assignments } = stripPrefixes(tokens);
    const [program, ...rest] = commandTokens;
    if (program === void 0) {
      for (const [name, value] of assignments) {
        variables.set(name, value);
      }
      continue;
    }
    if (program === "export" || program === "declare" || program === "typeset") {
      for (const token of rest) {
        const match = envAssignment.exec(token);
        if (match?.[1] !== void 0 && match[2] !== void 0) {
          setVariable(variables, match[1], match[2]);
        }
      }
      continue;
    }
    if (program === "unset") {
      for (const token of rest) {
        variables.delete(token.toUpperCase());
      }
      continue;
    }
    const extracted = extractFromCommand(commandTokens);
    if (extracted === void 0) {
      continue;
    }
    const effective = new Map([...variables, ...assignments]);
    if (usesAlternateRegistry(extracted.ecosystem, effective)) {
      continue;
    }
    const goPrivatePatterns = extracted.ecosystem === "go" ? [...goPrivateVariables].flatMap((name) => splitGoPrivatePatternList(effective.get(name))) : [];
    for (const raw of extracted.names) {
      const name = registryName(extracted.ecosystem, raw);
      const key = `${extracted.ecosystem}:${name ?? ""}`;
      if (name === void 0 || seen.has(key) || goPrivatePatterns.some((pattern) => matchesGoPrivateModulePattern(name, pattern))) {
        continue;
      }
      seen.add(key);
      packages.push({ ecosystem: extracted.ecosystem, name });
    }
  }
  return packages;
}
function setVariable(variables, name, value) {
  const upper = name.toUpperCase();
  if (upper in registryVariables || goPrivateVariables.has(upper)) {
    variables.set(upper, value);
  }
}
function usesAlternateRegistry(ecosystem, variables) {
  return Object.entries(registryVariables).some(([name, rule]) => {
    const value = variables.get(name);
    return rule.ecosystem === ecosystem && value !== void 0 && rule.overrides(value);
  });
}
function isPublicRegistry(value) {
  const trimmed = value.trim().toLowerCase();
  if (publicRegistryNames.has(trimmed)) {
    return true;
  }
  try {
    return publicRegistryHosts.has(
      new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`).hostname
    );
  } catch {
    return false;
  }
}
function splitCommands(command) {
  const commands = [];
  const frames = [];
  const heredocs = [];
  let tokens = [];
  let current = "";
  let hasToken = false;
  let quote;
  const endToken = () => {
    if (hasToken) {
      tokens.push(current);
    }
    current = "";
    hasToken = false;
  };
  const endCommand = () => {
    endToken();
    if (tokens.length > 0) {
      commands.push(stripRedirections(tokens));
    }
    tokens = [];
  };
  const suspend = (kind) => {
    endCommand();
    frames.push({ quote, kind, depth: 1 });
    quote = void 0;
  };
  const resume = () => {
    const frame = frames.pop();
    quote = frame?.quote;
    hasToken = quote !== void 0;
  };
  for (let index = 0; index < command.length; index += 1) {
    const char = command[index] ?? "";
    const next = command[index + 1];
    const frame = frames.at(-1);
    if (quote === "'") {
      if (char === "'") {
        quote = void 0;
      } else {
        current += char;
      }
      continue;
    }
    if (quote === '"') {
      if (char === '"') {
        quote = void 0;
      } else if (char === "\\" && next === "\n") {
        index += 1;
      } else if (char === "\\" && next !== void 0) {
        current += next;
        index += 1;
      } else if (char === "$" && next === "(") {
        suspend("paren");
        index += 1;
      } else if (char === "`") {
        suspend("backtick");
      } else {
        current += char;
      }
      continue;
    }
    if (char === "#" && !hasToken) {
      while (index + 1 < command.length && command[index + 1] !== "\n") {
        index += 1;
      }
    } else if (char === "'" || char === '"') {
      quote = char;
      hasToken = true;
    } else if (char === "\\" && next === "\n") {
      index += 1;
    } else if (char === "\\" && next !== void 0) {
      current += next;
      hasToken = true;
      index += 1;
    } else if (char === "$" && next === "(") {
      suspend("paren");
      index += 1;
    } else if (char === "(") {
      endCommand();
      if (frame?.kind === "paren") {
        frame.depth += 1;
      }
    } else if (char === ")") {
      endCommand();
      if (frame?.kind === "paren") {
        frame.depth -= 1;
        if (frame.depth === 0) {
          resume();
        }
      }
    } else if (char === "`") {
      if (frame?.kind === "backtick") {
        endCommand();
        resume();
      } else {
        suspend("backtick");
      }
    } else if (char === "<" && next === "<" && command[index + 2] === "<") {
      endToken();
      tokens.push("<<<");
      index += 2;
    } else if (char === "<" && next === "<") {
      endToken();
      index = readHeredocOperator(command, index, heredocs);
    } else if (char === "\n") {
      endCommand();
      if (heredocs.length > 0) {
        const bodies = skipHeredocBodies(command, index, heredocs.splice(0));
        index = bodies.position;
        for (const body of bodies.expanded) {
          for (const source of substitutions(body)) {
            commands.push(...splitCommands(source));
          }
        }
      }
    } else if (char === "&" || char === "|" || char === ";") {
      endCommand();
    } else if (char === " " || char === "	" || char === "\r") {
      endToken();
    } else {
      current += char;
      hasToken = true;
    }
  }
  endCommand();
  return commands;
}
function readHeredocOperator(command, start, heredocs) {
  let index = start + 2;
  const stripTabs = command[index] === "-";
  if (stripTabs) {
    index += 1;
  }
  while (command[index] === " " || command[index] === "	") {
    index += 1;
  }
  const open = command[index];
  if (open === "'" || open === '"') {
    const close = command.indexOf(open, index + 1);
    const end = close === -1 ? command.length : close;
    heredocs.push({ delimiter: command.slice(index + 1, end), stripTabs, expands: false });
    return end;
  }
  const escaped = open === "\\";
  if (escaped) {
    index += 1;
  }
  const delimiter = /^[^\s;&|()<>`]*/u.exec(command.slice(index))?.[0] ?? "";
  heredocs.push({ delimiter, stripTabs, expands: !escaped });
  return delimiter.length === 0 ? index - 1 : index + delimiter.length - 1;
}
function skipHeredocBodies(command, newline, heredocs) {
  const expanded = [];
  let position = newline;
  for (const heredoc of heredocs) {
    const lines = [];
    while (position < command.length) {
      const lineStart = position + 1;
      const lineEnd = command.indexOf("\n", lineStart);
      const line = command.slice(lineStart, lineEnd === -1 ? command.length : lineEnd);
      position = lineEnd === -1 ? command.length : lineEnd;
      if ((heredoc.stripTabs ? line.replace(/^\t+/u, "") : line) === heredoc.delimiter) {
        break;
      }
      lines.push(line);
    }
    if (heredoc.expands) {
      expanded.push(lines.join("\n"));
    }
  }
  return { position, expanded };
}
function substitutions(text2) {
  const sources = [];
  for (let index = 0; index < text2.length; index += 1) {
    const char = text2[index];
    if (char === "\\") {
      index += 1;
    } else if (char === "$" && text2[index + 1] === "(") {
      const end = closingParen(text2, index + 1);
      sources.push(text2.slice(index + 2, end));
      index = end;
    } else if (char === "`") {
      const end = closingBacktick(text2, index + 1);
      sources.push(text2.slice(index + 1, end));
      index = end;
    }
  }
  return sources;
}
function closingParen(text2, open) {
  let depth = 0;
  let quote;
  for (let index = open; index < text2.length; index += 1) {
    const char = text2[index];
    if (quote !== void 0) {
      if (char === quote) {
        quote = void 0;
      } else if (char === "\\") {
        index += 1;
      }
    } else if (char === "'" || char === '"') {
      quote = char;
    } else if (char === "\\") {
      index += 1;
    } else if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return text2.length;
}
function closingBacktick(text2, start) {
  for (let index = start; index < text2.length; index += 1) {
    if (text2[index] === "\\") {
      index += 1;
    } else if (text2[index] === "`") {
      return index;
    }
  }
  return text2.length;
}
function stripRedirections(tokens) {
  const result = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index] ?? "";
    if (/^\d*[<>]{1,3}$/u.test(token) || token === "&>") {
      index += 1;
      continue;
    }
    if (/^\d*[<>]/u.test(token) || token.startsWith("&>")) {
      continue;
    }
    result.push(token);
  }
  return result;
}
function stripPrefixes(tokens) {
  const remaining = [...tokens];
  const assignments = /* @__PURE__ */ new Map();
  const note = (token) => {
    const match = envAssignment.exec(token);
    if (match?.[1] === void 0 || match[2] === void 0) {
      return false;
    }
    setVariable(assignments, match[1], match[2]);
    return true;
  };
  while (remaining.length > 0) {
    const first = remaining[0] ?? "";
    if (note(first)) {
      remaining.shift();
      continue;
    }
    if (!shellPrefixes.has(first)) {
      break;
    }
    remaining.shift();
    while (remaining.length > 0) {
      const token = remaining[0] ?? "";
      if (first === "sudo" && sudoValueFlags.has(token)) {
        remaining.splice(0, 2);
      } else if (first === "env" && note(token)) {
        remaining.shift();
      } else if (prefixesWithFlags.has(first) && token.startsWith("-") && token.length > 1) {
        remaining.shift();
      } else {
        break;
      }
    }
  }
  return { tokens: remaining, assignments };
}
function extractFromCommand(tokens) {
  const [program = "", ...args] = tokens;
  switch (import_node_path2.default.posix.basename(program)) {
    case "npm":
      return subcommand(args, nodeFlags, { install: "npm", i: "npm", add: "npm" });
    case "pnpm":
    case "yarn":
    case "bun":
      return subcommand(args, nodeFlags, { install: "npm", i: "npm", add: "npm" }) ?? runner(args, npxFlags, { dlx: "npm", x: "npm" }, npxPackageFlags);
    case "npx":
    case "bunx":
      return runnerPackages(args, npxFlags, "npm", npxPackageFlags);
    case "pip":
    case "pip3":
      return subcommand(args, pipFlags, { install: "pypi" }, pipNames);
    case "python":
    case "python3":
    case "py":
      return args[0] === "-m" && args[1] === "pip" ? subcommand(args.slice(2), pipFlags, { install: "pypi" }, pipNames) : void 0;
    case "uv":
      if (args[0] === "pip" || args[0] === "tool") {
        return subcommand(args.slice(1), pipFlags, { install: "pypi" }, pipNames) ?? runner(args.slice(1), pipFlags, { run: "pypi" }, uvxPackageFlags);
      }
      return subcommand(args, pipFlags, { add: "pypi" }, pipNames);
    case "uvx":
      return runnerPackages(args, pipFlags, "pypi", uvxPackageFlags);
    case "pipx":
      return subcommand(args, pipFlags, { install: "pypi" }, pipNames) ?? runner(args, pipFlags, { run: "pypi" }, uvxPackageFlags);
    case "poetry":
    case "pdm":
      return subcommand(args, pipFlags, { add: "pypi" }, pipNames);
    case "cargo":
      return subcommand(args, cargoFlags, { add: "crates", install: "crates" });
    case "go":
      return subcommand(args, goFlags, { get: "go", install: "go" });
    case "gem":
      return subcommand(args, gemFlags, { install: "rubygems", i: "rubygems" });
    case "bundle":
    case "bundler":
      return subcommand(args, gemFlags, { add: "rubygems" });
    case "composer":
      return subcommand(args, composerFlags, { require: "packagist", req: "packagist", r: "packagist" });
    case "dotnet":
      return dotnetPackages(args);
    default:
      return void 0;
  }
}
function subcommand(args, flags, subcommands, refine = (names) => names) {
  const positionals = positionalArguments(args, flags);
  const [first, ...names] = positionals ?? [];
  const ecosystem = first === void 0 ? void 0 : subcommands[first];
  return ecosystem === void 0 ? void 0 : { ecosystem, names: refine(names) };
}
function runner(args, flags, subcommands, packageFlags) {
  const [first, ...rest] = args;
  const ecosystem = first === void 0 ? void 0 : subcommands[first];
  return ecosystem === void 0 ? void 0 : runnerPackages(rest, flags, ecosystem, packageFlags);
}
function runnerPackages(args, flags, ecosystem, packageFlags) {
  const positionals = positionalArguments(args, {
    value: /* @__PURE__ */ new Set([...flags.value, ...packageFlags.replacing, ...packageFlags.additional]),
    source: flags.source
  });
  if (positionals === void 0) {
    return void 0;
  }
  const replacing = flagValues(args, packageFlags.replacing);
  return {
    ecosystem,
    names: [
      ...flagValues(args, packageFlags.additional),
      ...replacing.length > 0 ? replacing : positionals.slice(0, 1)
    ]
  };
}
function dotnetPackages(args) {
  const positionals = positionalArguments(args, dotnetFlags);
  if (positionals === void 0) {
    return void 0;
  }
  const [first, second, third] = positionals;
  if (first === "add") {
    const index = positionals.indexOf("package");
    const name = index === -1 ? void 0 : positionals[index + 1];
    return name === void 0 ? void 0 : { ecosystem: "nuget", names: [name] };
  }
  if (first === "package" && second === "add" && third !== void 0) {
    return { ecosystem: "nuget", names: [third] };
  }
  return void 0;
}
function pipNames(names) {
  const result = [];
  for (let index = 0; index < names.length; index += 1) {
    if (names[index] === "@") {
      result.pop();
      index += 1;
      continue;
    }
    result.push(names[index] ?? "");
  }
  return result;
}
function positionalArguments(args, flags) {
  const positionals = [];
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index] ?? "";
    if (token === "--") {
      positionals.push(...args.slice(index + 1));
      break;
    }
    if (token.startsWith("-") && token.length > 1) {
      const [flag = "", inline] = token.split(/=(.*)/su);
      if (flags.source.has(flag)) {
        const value = inline ?? args[index + 1];
        if (value === void 0 || !isPublicRegistry(value)) {
          return void 0;
        }
      }
      if (inline === void 0 && (flags.value.has(flag) || flags.source.has(flag))) {
        index += 1;
      }
      continue;
    }
    positionals.push(token);
  }
  return positionals;
}
function flagValues(args, flags) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index] ?? "";
    const [flag = "", inline] = token.split(/=(.*)/su);
    if (!flags.has(flag)) {
      continue;
    }
    const value = inline ?? args[index + 1];
    if (inline === void 0) {
      index += 1;
    }
    if (value !== void 0) {
      values.push(value);
    }
  }
  return values;
}
function registryName(ecosystem, raw) {
  const spec = ecosystem === "npm" && raw.includes("@npm:") ? raw.slice(raw.indexOf("@npm:") + 5) : raw;
  if (looksNonRegistry(spec)) {
    return void 0;
  }
  const name = stripVersion(ecosystem, spec);
  if (ecosystem === "npm" && name.includes("/") && !name.startsWith("@")) {
    return void 0;
  }
  if (ecosystem === "pypi" && name.includes("/")) {
    return void 0;
  }
  return normalizePackageName(ecosystem, ecosystem === "go" ? goModuleGuess(name) : name);
}
function stripVersion(ecosystem, spec) {
  switch (ecosystem) {
    case "npm": {
      const at = spec.indexOf("@", spec.startsWith("@") ? 1 : 0);
      return at === -1 ? spec : spec.slice(0, at);
    }
    case "pypi":
      return spec.split(/[[=<>!~;@]/u)[0] ?? spec;
    case "crates":
    case "go":
      return spec.split("@")[0] ?? spec;
    case "rubygems":
    case "packagist":
      return spec.split(/[:=]/u)[0] ?? spec;
    case "maven":
    case "nuget":
      return spec;
  }
}
function goModuleGuess(modulePath) {
  const elements = modulePath.split("/");
  const host = elements[0] ?? "";
  if (goThreeElementHosts.has(host)) {
    return elements.slice(0, 3).join("/");
  }
  if (goTwoElementHosts.has(host)) {
    return elements.slice(0, 2).join("/");
  }
  return modulePath;
}
function looksNonRegistry(spec) {
  return spec.length === 0 || spec === "." || spec === ".." || spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/") || spec.startsWith("~") || spec.includes("://") || spec.includes("\\") || /^(git\+|git@|file:|link:|workspace:|github:|gitlab:|bitbucket:|gist:)/iu.test(spec) || /\.(tgz|tar\.gz|tar|zip|whl|gem|nupkg|crate)$/iu.test(spec);
}

// src/hook/run-hook.ts
var silent = { exitCode: 0, stdout: "", stderr: "" };
async function runHook(input) {
  let event;
  try {
    event = JSON.parse(input.stdin);
  } catch {
    return failure9("expected a Claude Code hook event as JSON on stdin.");
  }
  const command = bashCommand(event);
  if (command === void 0) {
    return silent;
  }
  const packages = extractInstallPackages(command, input.env);
  if (packages.length === 0) {
    return silent;
  }
  let result;
  try {
    result = await checkPackages({
      packages,
      rootDir: eventCwd(event) ?? input.cwd,
      ...input.registryClient === void 0 ? {} : { registryClient: input.registryClient },
      ...input.now === void 0 ? {} : { now: input.now }
    });
  } catch (error) {
    return failure9(error instanceof Error ? error.message : String(error));
  }
  const blocking = result.findings.some(
    (finding) => isAtOrAboveSeverity(finding.severity, result.failOn)
  );
  if (blocking) {
    return decision(
      "deny",
      `SlopLock blocked this install.

${describe(result.findings)}

Use a package that exists and has aged past the cooldown window. If this is a verified private package, add an allow entry with an expiry to sloplock.yml.`
    );
  }
  if (result.findings.length > 0) {
    return decision("ask", `SlopLock flagged this install.

${describe(result.findings)}`);
  }
  if (result.registryFailures.length > 0) {
    const names = result.registryFailures.map((entry) => `${entry.ecosystem} ${entry.name}`);
    return {
      exitCode: 0,
      stdout: `${JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          additionalContext: `SlopLock could not verify ${names.join(", ")} against the public registry: ${result.registryFailures[0]?.message ?? "registry check failed"}`
        }
      })}
`,
      stderr: ""
    };
  }
  return silent;
}
function bashCommand(event) {
  if (typeof event !== "object" || event === null) {
    return void 0;
  }
  const { tool_name: toolName, tool_input: toolInput } = event;
  if (toolName !== "Bash" || typeof toolInput !== "object" || toolInput === null) {
    return void 0;
  }
  const { command } = toolInput;
  return typeof command === "string" ? command : void 0;
}
function eventCwd(event) {
  const { cwd } = event;
  return typeof cwd === "string" && cwd.length > 0 ? cwd : void 0;
}
function describe(findings) {
  return findings.map(
    (finding) => `${finding.severity.toUpperCase()} ${finding.ecosystem} ${finding.package}: ${finding.evidence} ${finding.recommendation}`
  ).join("\n");
}
function decision(permissionDecision, reason) {
  return {
    exitCode: 0,
    stdout: `${JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision,
        permissionDecisionReason: reason
      }
    })}
`,
    stderr: ""
  };
}
function failure9(message) {
  return { exitCode: 1, stdout: "", stderr: `sloplock hook: ${message}
` };
}

// src/hook/main.ts
async function hookMain() {
  const outcome = await runHook({
    stdin: await (0, import_consumers.text)(process.stdin),
    cwd: process.cwd()
  });
  process.stdout.write(outcome.stdout);
  process.stderr.write(outcome.stderr);
  process.exitCode = outcome.exitCode;
}

// src/hook/index.ts
void hookMain().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`sloplock hook: ${message}
`);
  process.exitCode = 1;
});
/*! Bundled license information:

xmlchars/xml/1.0/ed5.js:
  (**
   * Character classes and associated utilities for the 5th edition of XML 1.0.
   *
   * @author Louis-Dominique Dubeau
   * @license MIT
   * @copyright Louis-Dominique Dubeau
   *)

xmlchars/xml/1.1/ed2.js:
  (**
   * Character classes and associated utilities for the 2nd edition of XML 1.1.
   *
   * @author Louis-Dominique Dubeau
   * @license MIT
   * @copyright Louis-Dominique Dubeau
   *)

xmlchars/xmlns/1.0/ed3.js:
  (**
   * Character class utilities for XML NS 1.0 edition 3.
   *
   * @author Louis-Dominique Dubeau
   * @license MIT
   * @copyright Louis-Dominique Dubeau
   *)

smol-toml/dist/date.js:
smol-toml/dist/error.js:
smol-toml/dist/primitive.js:
smol-toml/dist/util.js:
smol-toml/dist/extract.js:
smol-toml/dist/struct.js:
smol-toml/dist/parse.js:
smol-toml/dist/stringify.js:
smol-toml/dist/index.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)
*/
//# sourceMappingURL=index.cjs.map
