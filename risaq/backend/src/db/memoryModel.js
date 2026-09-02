// Minimal in-process stand-in for a Mongoose Model, used only when
// MONGODB_URI=memory (no MongoDB server reachable — e.g. a quick local trial
// with nothing installed). Implements just the subset of the Mongoose Model
// API this codebase actually calls: find/findOne/findById/create/
// findOneAndUpdate/countDocuments, plus chainable select/sort/limit/populate
///lean() on find(). Data lives only in this process's memory and is lost on
// restart — real MongoDB (see config/db.js) is what production should use.
let idCounter = 1;
function generateId(prefix) {
  return `${prefix}_${(idCounter++).toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function matches(doc, filter = {}) {
  return Object.entries(filter).every(([key, value]) => value === undefined || String(doc[key]) === String(value));
}

class MemoryQuery {
  constructor(docs, refs) {
    this._docs = docs;
    this._refs = refs;
    this._populateFields = [];
  }
  select() {
    return this;
  }
  sort(spec) {
    const [[field, dir]] = Object.entries(spec);
    const mul = dir === -1 || dir === "desc" ? -1 : 1;
    this._docs = [...this._docs].sort((a, b) => (a[field] > b[field] ? mul : a[field] < b[field] ? -mul : 0));
    return this;
  }
  limit(n) {
    this._docs = this._docs.slice(0, n);
    return this;
  }
  populate(field) {
    this._populateFields.push(field);
    return this;
  }
  lean() {
    return Promise.resolve(this._materialize());
  }
  then(resolve, reject) {
    Promise.resolve(this._materialize()).then(resolve, reject);
  }
  _materialize() {
    return this._docs.map((doc) => {
      const copy = { ...doc };
      for (const field of this._populateFields) {
        const store = this._refs?.[field]?.();
        if (store) copy[field] = store.find((d) => String(d._id) === String(doc[field])) || null;
      }
      return copy;
    });
  }
}

export function createMemoryModel(name, { defaults = {}, refs = {} } = {}) {
  const store = [];

  function attach(doc) {
    doc.save = async () => doc;
    // Exclude the attached functions themselves — structuredClone can't
    // clone functions, and Mongoose's toObject() wouldn't include them either.
    doc.toObject = () => {
      const { save, toObject, ...plain } = doc;
      return structuredClone(plain);
    };
    return doc;
  }

  return {
    _store: store,
    find(filter = {}) {
      return new MemoryQuery(
        store.filter((d) => matches(d, filter)),
        refs
      );
    },
    async findOne(filter = {}) {
      const doc = store.find((d) => matches(d, filter));
      return doc ? attach(doc) : null;
    },
    async findById(id) {
      const doc = store.find((d) => String(d._id) === String(id));
      return doc ? attach(doc) : null;
    },
    async countDocuments(filter = {}) {
      return store.filter((d) => matches(d, filter)).length;
    },
    async create(data) {
      const doc = { _id: generateId(name.toLowerCase()), createdAt: new Date(), ...structuredClone(defaults), ...structuredClone(data) };
      store.push(doc);
      return attach(doc);
    },
    async findOneAndUpdate(filter, update, opts = {}) {
      let doc = store.find((d) => matches(d, filter));
      if (!doc && opts.upsert) {
        doc = { _id: generateId(name.toLowerCase()), createdAt: new Date() };
        store.push(doc);
      }
      if (doc) Object.assign(doc, structuredClone(update));
      return doc ? attach(doc) : null;
    },
  };
}

export const isMemoryMode = process.env.MONGODB_URI === "memory";
