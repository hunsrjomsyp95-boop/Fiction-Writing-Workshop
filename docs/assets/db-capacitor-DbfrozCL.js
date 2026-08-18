const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./web-BVWGWIit.js","./index-jgVsv-40.js","./index-_YheFhw8.css"])))=>i.map(i=>d[i]);
import{_ as W}from"./index-jgVsv-40.js";/*! Capacitor: https://capacitorjs.com/ - MIT License */var R;(function(s){s.Unimplemented="UNIMPLEMENTED",s.Unavailable="UNAVAILABLE"})(R||(R={}));class O extends Error{constructor(e,t,r){super(e),this.message=e,this.code=t,this.data=r}}const Q=s=>{var e,t;return s!=null&&s.androidBridge?"android":!((t=(e=s==null?void 0:s.webkit)===null||e===void 0?void 0:e.messageHandlers)===null||t===void 0)&&t.bridge?"ios":"web"},H=s=>{const e=s.CapacitorCustomPlatform||null,t=s.Capacitor||{},r=t.Plugins=t.Plugins||{},n=()=>e!==null?e.name:Q(s),i=()=>n()!=="web",o=E=>{const l=u.get(E);return!!(l!=null&&l.platforms.has(n())||a(E))},a=E=>{var l;return(l=t.PluginHeaders)===null||l===void 0?void 0:l.find(f=>f.name===E)},c=E=>s.console.error(E),u=new Map,D=(E,l={})=>{const f=u.get(E);if(f)return console.warn(`Capacitor plugin "${E}" already registered. Cannot register plugins twice.`),f.proxy;const w=n(),v=a(E);let N;const Y=async()=>(!N&&w in l?N=typeof l[w]=="function"?N=await l[w]():N=l[w]:e!==null&&!N&&"web"in l&&(N=typeof l.web=="function"?N=await l.web():N=l.web),N),$=(T,d)=>{var h,L;if(v){const A=v==null?void 0:v.methods.find(m=>d===m.name);if(A)return A.rtype==="promise"?m=>t.nativePromise(E,d.toString(),m):(m,C)=>t.nativeCallback(E,d.toString(),m,C);if(T)return(h=T[d])===null||h===void 0?void 0:h.bind(T)}else{if(T)return(L=T[d])===null||L===void 0?void 0:L.bind(T);throw new O(`"${E}" plugin is not implemented on ${w}`,R.Unimplemented)}},g=T=>{let d;const h=(...L)=>{const A=Y().then(m=>{const C=$(m,T);if(C){const I=C(...L);return d=I==null?void 0:I.remove,I}else throw new O(`"${E}.${T}()" is not implemented on ${w}`,R.Unimplemented)});return T==="addListener"&&(A.remove=async()=>d()),A};return h.toString=()=>`${T.toString()}() { [capacitor code] }`,Object.defineProperty(h,"name",{value:T,writable:!1,configurable:!1}),h},F=g("addListener"),X=g("removeListener"),K=(T,d)=>{const h=F({eventName:T},d),L=async()=>{const m=await h;X({eventName:T,callbackId:m},d)},A=new Promise(m=>h.then(()=>m({remove:L})));return A.remove=async()=>{console.warn("Using addListener() without 'await' is deprecated."),await L()},A},P=new Proxy({},{get(T,d){switch(d){case"$$typeof":return;case"toJSON":return()=>({});case"addListener":return v?K:F;case"removeListener":return X;default:return g(d)}}});return r[E]=P,u.set(E,{name:E,proxy:P,platforms:new Set([...Object.keys(l),...v?[w]:[]])}),P};return t.convertFileSrc||(t.convertFileSrc=E=>E),t.getPlatform=n,t.handleError=c,t.isNativePlatform=i,t.isPluginAvailable=o,t.registerPlugin=D,t.Exception=O,t.DEBUG=!!t.DEBUG,t.isLoggingEnabled=!!t.isLoggingEnabled,t},J=s=>s.Capacitor=H(s),S=J(typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{}),U=S.registerPlugin;class b{constructor(){this.listeners={},this.retainedEventArguments={},this.windowListeners={}}addListener(e,t){let r=!1;this.listeners[e]||(this.listeners[e]=[],r=!0),this.listeners[e].push(t);const i=this.windowListeners[e];i&&!i.registered&&this.addWindowListener(i),r&&this.sendRetainedArgumentsForEvent(e);const o=async()=>this.removeListener(e,t);return Promise.resolve({remove:o})}async removeAllListeners(){this.listeners={};for(const e in this.windowListeners)this.removeWindowListener(this.windowListeners[e]);this.windowListeners={}}notifyListeners(e,t,r){const n=this.listeners[e];if(!n){if(r){let i=this.retainedEventArguments[e];i||(i=[]),i.push(t),this.retainedEventArguments[e]=i}return}n.forEach(i=>i(t))}hasListeners(e){var t;return!!(!((t=this.listeners[e])===null||t===void 0)&&t.length)}registerWindowListener(e,t){this.windowListeners[t]={registered:!1,windowEventName:e,pluginEventName:t,handler:r=>{this.notifyListeners(t,r)}}}unimplemented(e="not implemented"){return new S.Exception(e,R.Unimplemented)}unavailable(e="not available"){return new S.Exception(e,R.Unavailable)}async removeListener(e,t){const r=this.listeners[e];if(!r)return;const n=r.indexOf(t);this.listeners[e].splice(n,1),this.listeners[e].length||this.removeWindowListener(this.windowListeners[e])}addWindowListener(e){window.addEventListener(e.windowEventName,e.handler),e.registered=!0}removeWindowListener(e){e&&(window.removeEventListener(e.windowEventName,e.handler),e.registered=!1)}sendRetainedArgumentsForEvent(e){const t=this.retainedEventArguments[e];t&&(delete this.retainedEventArguments[e],t.forEach(r=>{this.notifyListeners(e,r)}))}}const j=s=>encodeURIComponent(s).replace(/%(2[346B]|5E|60|7C)/g,decodeURIComponent).replace(/[()]/g,escape),q=s=>s.replace(/(%[\dA-F]{2})+/gi,decodeURIComponent);class V extends b{async getCookies(){const e=document.cookie,t={};return e.split(";").forEach(r=>{if(r.length<=0)return;let[n,i]=r.replace(/=/,"CAP_COOKIE").split("CAP_COOKIE");n=q(n).trim(),i=q(i).trim(),t[n]=i}),t}async setCookie(e){try{const t=j(e.key),r=j(e.value),n=e.expires?`; expires=${e.expires.replace("expires=","")}`:"",i=(e.path||"/").replace("path=",""),o=e.url!=null&&e.url.length>0?`domain=${e.url}`:"";document.cookie=`${t}=${r||""}${n}; path=${i}; ${o};`}catch(t){return Promise.reject(t)}}async deleteCookie(e){try{document.cookie=`${e.key}=; Max-Age=0`}catch(t){return Promise.reject(t)}}async clearCookies(){try{const e=document.cookie.split(";")||[];for(const t of e)document.cookie=t.replace(/^ +/,"").replace(/=.*/,`=;expires=${new Date().toUTCString()};path=/`)}catch(e){return Promise.reject(e)}}async clearAllCookies(){try{await this.clearCookies()}catch(e){return Promise.reject(e)}}}U("CapacitorCookies",{web:()=>new V});const z=async s=>new Promise((e,t)=>{const r=new FileReader;r.onload=()=>{const n=r.result;e(n.indexOf(",")>=0?n.split(",")[1]:n)},r.onerror=n=>t(n),r.readAsDataURL(s)}),Z=(s={})=>{const e=Object.keys(s);return Object.keys(s).map(n=>n.toLocaleLowerCase()).reduce((n,i,o)=>(n[i]=s[e[o]],n),{})},ee=(s,e=!0)=>s?Object.entries(s).reduce((r,n)=>{const[i,o]=n;let a,c;return Array.isArray(o)?(c="",o.forEach(u=>{a=e?encodeURIComponent(u):u,c+=`${i}=${a}&`}),c.slice(0,-1)):(a=e?encodeURIComponent(o):o,c=`${i}=${a}`),`${r}&${c}`},"").substr(1):null,te=(s,e={})=>{const t=Object.assign({method:s.method||"GET",headers:s.headers},e),n=Z(s.headers)["content-type"]||"";if(typeof s.data=="string")t.body=s.data;else if(n.includes("application/x-www-form-urlencoded")){const i=new URLSearchParams;for(const[o,a]of Object.entries(s.data||{}))i.set(o,a);t.body=i.toString()}else if(n.includes("multipart/form-data")||s.data instanceof FormData){const i=new FormData;if(s.data instanceof FormData)s.data.forEach((a,c)=>{i.append(c,a)});else for(const a of Object.keys(s.data))i.append(a,s.data[a]);t.body=i;const o=new Headers(t.headers);o.delete("content-type"),t.headers=o}else(n.includes("application/json")||typeof s.data=="object")&&(t.body=JSON.stringify(s.data));return t};class re extends b{async request(e){const t=te(e,e.webFetchExtra),r=ee(e.params,e.shouldEncodeUrlParams),n=r?`${e.url}?${r}`:e.url,i=await fetch(n,t),o=i.headers.get("content-type")||"";let{responseType:a="text"}=i.ok?e:{};o.includes("application/json")&&(a="json");let c,u;switch(a){case"arraybuffer":case"blob":u=await i.blob(),c=await z(u);break;case"json":c=await i.json();break;case"document":case"text":default:c=await i.text()}const D={};return i.headers.forEach((E,l)=>{D[l]=E}),{data:c,headers:D,status:i.status,url:i.url}}async get(e){return this.request(Object.assign(Object.assign({},e),{method:"GET"}))}async post(e){return this.request(Object.assign(Object.assign({},e),{method:"POST"}))}async put(e){return this.request(Object.assign(Object.assign({},e),{method:"PUT"}))}async patch(e){return this.request(Object.assign(Object.assign({},e),{method:"PATCH"}))}async delete(e){return this.request(Object.assign(Object.assign({},e),{method:"DELETE"}))}}U("CapacitorHttp",{web:()=>new re});var x;(function(s){s.Dark="DARK",s.Light="LIGHT",s.Default="DEFAULT"})(x||(x={}));var G;(function(s){s.StatusBar="StatusBar",s.NavigationBar="NavigationBar"})(G||(G={}));class se extends b{async setStyle(){this.unavailable("not available for web")}async setAnimation(){this.unavailable("not available for web")}async show(){this.unavailable("not available for web")}async hide(){this.unavailable("not available for web")}}U("SystemBars",{web:()=>new se});class ne{constructor(e){this.sqlite=e,this._connectionDict=new Map}async initWebStore(){try{return await this.sqlite.initWebStore(),Promise.resolve()}catch(e){return Promise.reject(e)}}async saveToStore(e){try{return await this.sqlite.saveToStore({database:e}),Promise.resolve()}catch(t){return Promise.reject(t)}}async saveToLocalDisk(e){try{return await this.sqlite.saveToLocalDisk({database:e}),Promise.resolve()}catch(t){return Promise.reject(t)}}async getFromLocalDiskToStore(e){const t=e??!0;try{return await this.sqlite.getFromLocalDiskToStore({overwrite:t}),Promise.resolve()}catch(r){return Promise.reject(r)}}async echo(e){try{const t=await this.sqlite.echo({value:e});return Promise.resolve(t)}catch(t){return Promise.reject(t)}}async isSecretStored(){try{const e=await this.sqlite.isSecretStored();return Promise.resolve(e)}catch(e){return Promise.reject(e)}}async setEncryptionSecret(e){try{return await this.sqlite.setEncryptionSecret({passphrase:e}),Promise.resolve()}catch(t){return Promise.reject(t)}}async changeEncryptionSecret(e,t){try{return await this.sqlite.changeEncryptionSecret({passphrase:e,oldpassphrase:t}),Promise.resolve()}catch(r){return Promise.reject(r)}}async clearEncryptionSecret(){try{return await this.sqlite.clearEncryptionSecret(),Promise.resolve()}catch(e){return Promise.reject(e)}}async checkEncryptionSecret(e){try{const t=await this.sqlite.checkEncryptionSecret({passphrase:e});return Promise.resolve(t)}catch(t){return Promise.reject(t)}}async addUpgradeStatement(e,t){try{return e.endsWith(".db")&&(e=e.slice(0,-3)),await this.sqlite.addUpgradeStatement({database:e,upgrade:t}),Promise.resolve()}catch(r){return Promise.reject(r)}}async createConnection(e,t,r,n,i){try{e.endsWith(".db")&&(e=e.slice(0,-3)),await this.sqlite.createConnection({database:e,encrypted:t,mode:r,version:n,readonly:i});const o=new M(e,i,this.sqlite),a=i?`RO_${e}`:`RW_${e}`;return this._connectionDict.set(a,o),Promise.resolve(o)}catch(o){return Promise.reject(o)}}async closeConnection(e,t){try{e.endsWith(".db")&&(e=e.slice(0,-3)),await this.sqlite.closeConnection({database:e,readonly:t});const r=t?`RO_${e}`:`RW_${e}`;return this._connectionDict.delete(r),Promise.resolve()}catch(r){return Promise.reject(r)}}async isConnection(e,t){const r={};e.endsWith(".db")&&(e=e.slice(0,-3));const n=t?`RO_${e}`:`RW_${e}`;return r.result=this._connectionDict.has(n),Promise.resolve(r)}async retrieveConnection(e,t){e.endsWith(".db")&&(e=e.slice(0,-3));const r=t?`RO_${e}`:`RW_${e}`;if(this._connectionDict.has(r)){const n=this._connectionDict.get(r);return typeof n<"u"?Promise.resolve(n):Promise.reject(`Connection ${e} is undefined`)}else return Promise.reject(`Connection ${e} does not exist`)}async getNCDatabasePath(e,t){try{const r=await this.sqlite.getNCDatabasePath({path:e,database:t});return Promise.resolve(r)}catch(r){return Promise.reject(r)}}async createNCConnection(e,t){try{await this.sqlite.createNCConnection({databasePath:e,version:t});const r=new M(e,!0,this.sqlite),n=`RO_${e})`;return this._connectionDict.set(n,r),Promise.resolve(r)}catch(r){return Promise.reject(r)}}async closeNCConnection(e){try{await this.sqlite.closeNCConnection({databasePath:e});const t=`RO_${e})`;return this._connectionDict.delete(t),Promise.resolve()}catch(t){return Promise.reject(t)}}async isNCConnection(e){const t={},r=`RO_${e})`;return t.result=this._connectionDict.has(r),Promise.resolve(t)}async retrieveNCConnection(e){if(this._connectionDict.has(e)){const t=`RO_${e})`,r=this._connectionDict.get(t);return typeof r<"u"?Promise.resolve(r):Promise.reject(`Connection ${e} is undefined`)}else return Promise.reject(`Connection ${e} does not exist`)}async isNCDatabase(e){try{const t=await this.sqlite.isNCDatabase({databasePath:e});return Promise.resolve(t)}catch(t){return Promise.reject(t)}}async retrieveAllConnections(){return this._connectionDict}async closeAllConnections(){const e=new Map;try{for(const t of this._connectionDict.keys()){const r=t.substring(3),n=t.substring(0,3)==="RO_";await this.sqlite.closeConnection({database:r,readonly:n}),e.set(t,null)}for(const t of e.keys())this._connectionDict.delete(t);return Promise.resolve()}catch(t){return Promise.reject(t)}}async checkConnectionsConsistency(){try{const e=[...this._connectionDict.keys()],t=[],r=[];for(const i of e)t.push(i.substring(0,2)),r.push(i.substring(3));const n=await this.sqlite.checkConnectionsConsistency({dbNames:r,openModes:t});return n.result||(this._connectionDict=new Map),Promise.resolve(n)}catch(e){return this._connectionDict=new Map,Promise.reject(e)}}async importFromJson(e){try{const t=await this.sqlite.importFromJson({jsonstring:e});return Promise.resolve(t)}catch(t){return Promise.reject(t)}}async isJsonValid(e){try{const t=await this.sqlite.isJsonValid({jsonstring:e});return Promise.resolve(t)}catch(t){return Promise.reject(t)}}async copyFromAssets(e){const t=e??!0;try{return await this.sqlite.copyFromAssets({overwrite:t}),Promise.resolve()}catch(r){return Promise.reject(r)}}async getFromHTTPRequest(e,t){const r=t??!0;try{return await this.sqlite.getFromHTTPRequest({url:e,overwrite:r}),Promise.resolve()}catch(n){return Promise.reject(n)}}async isDatabaseEncrypted(e){e.endsWith(".db")&&(e=e.slice(0,-3));try{const t=await this.sqlite.isDatabaseEncrypted({database:e});return Promise.resolve(t)}catch(t){return Promise.reject(t)}}async isInConfigEncryption(){try{const e=await this.sqlite.isInConfigEncryption();return Promise.resolve(e)}catch(e){return Promise.reject(e)}}async isInConfigBiometricAuth(){try{const e=await this.sqlite.isInConfigBiometricAuth();return Promise.resolve(e)}catch(e){return Promise.reject(e)}}async isDatabase(e){e.endsWith(".db")&&(e=e.slice(0,-3));try{const t=await this.sqlite.isDatabase({database:e});return Promise.resolve(t)}catch(t){return Promise.reject(t)}}async getDatabaseList(){try{const t=(await this.sqlite.getDatabaseList()).values;t.sort();const r={values:t};return Promise.resolve(r)}catch(e){return Promise.reject(e)}}async getMigratableDbList(e){const t=e||"default";try{const r=await this.sqlite.getMigratableDbList({folderPath:t});return Promise.resolve(r)}catch(r){return Promise.reject(r)}}async addSQLiteSuffix(e,t){const r=e||"default",n=t||[];try{const i=await this.sqlite.addSQLiteSuffix({folderPath:r,dbNameList:n});return Promise.resolve(i)}catch(i){return Promise.reject(i)}}async deleteOldDatabases(e,t){const r=e||"default",n=t||[];try{const i=await this.sqlite.deleteOldDatabases({folderPath:r,dbNameList:n});return Promise.resolve(i)}catch(i){return Promise.reject(i)}}async moveDatabasesAndAddSuffix(e,t){const r=e||"default",n=t||[];return this.sqlite.moveDatabasesAndAddSuffix({folderPath:r,dbNameList:n})}}class M{constructor(e,t,r){this.dbName=e,this.readonly=t,this.sqlite=r}getConnectionDBName(){return this.dbName}getConnectionReadOnly(){return this.readonly}async open(){try{return await this.sqlite.open({database:this.dbName,readonly:this.readonly}),Promise.resolve()}catch(e){return Promise.reject(e)}}async close(){try{return await this.sqlite.close({database:this.dbName,readonly:this.readonly}),Promise.resolve()}catch(e){return Promise.reject(e)}}async beginTransaction(){try{const e=await this.sqlite.beginTransaction({database:this.dbName});return Promise.resolve(e)}catch(e){return Promise.reject(e)}}async commitTransaction(){try{const e=await this.sqlite.commitTransaction({database:this.dbName});return Promise.resolve(e)}catch(e){return Promise.reject(e)}}async rollbackTransaction(){try{const e=await this.sqlite.rollbackTransaction({database:this.dbName});return Promise.resolve(e)}catch(e){return Promise.reject(e)}}async isTransactionActive(){try{const e=await this.sqlite.isTransactionActive({database:this.dbName});return Promise.resolve(e)}catch(e){return Promise.reject(e)}}async loadExtension(e){try{return await this.sqlite.loadExtension({database:this.dbName,path:e,readonly:this.readonly}),Promise.resolve()}catch(t){return Promise.reject(t)}}async enableLoadExtension(e){try{return await this.sqlite.enableLoadExtension({database:this.dbName,toggle:e,readonly:this.readonly}),Promise.resolve()}catch(t){return Promise.reject(t)}}async getUrl(){try{const e=await this.sqlite.getUrl({database:this.dbName,readonly:this.readonly});return Promise.resolve(e)}catch(e){return Promise.reject(e)}}async getVersion(){try{const e=await this.sqlite.getVersion({database:this.dbName,readonly:this.readonly});return Promise.resolve(e)}catch(e){return Promise.reject(e)}}async getTableList(){try{const e=await this.sqlite.getTableList({database:this.dbName,readonly:this.readonly});return Promise.resolve(e)}catch(e){return Promise.reject(e)}}async execute(e,t=!0,r=!0){try{if(this.readonly)return Promise.reject("not allowed in read-only mode");{const n=await this.sqlite.execute({database:this.dbName,statements:e,transaction:t,readonly:!1,isSQL92:r});return Promise.resolve(n)}}catch(n){return Promise.reject(n)}}async query(e,t,r=!0){let n;try{return t&&t.length>0?n=await this.sqlite.query({database:this.dbName,statement:e,values:t,readonly:this.readonly,isSQL92:!0}):n=await this.sqlite.query({database:this.dbName,statement:e,values:[],readonly:this.readonly,isSQL92:r}),n=await this.reorderRows(n),Promise.resolve(n)}catch(i){return Promise.reject(i)}}async run(e,t,r=!0,n="no",i=!0){let o;try{return this.readonly?Promise.reject("not allowed in read-only mode"):(t&&t.length>0?o=await this.sqlite.run({database:this.dbName,statement:e,values:t,transaction:r,readonly:!1,returnMode:n,isSQL92:!0}):o=await this.sqlite.run({database:this.dbName,statement:e,values:[],transaction:r,readonly:!1,returnMode:n,isSQL92:i}),o.changes=await this.reorderRows(o.changes),Promise.resolve(o))}catch(a){return Promise.reject(a)}}async executeSet(e,t=!0,r="no",n=!0){let i;try{return this.readonly?Promise.reject("not allowed in read-only mode"):(i=await this.sqlite.executeSet({database:this.dbName,set:e,transaction:t,readonly:!1,returnMode:r,isSQL92:n}),i.changes=await this.reorderRows(i.changes),Promise.resolve(i))}catch(o){return Promise.reject(o)}}async isExists(){try{const e=await this.sqlite.isDBExists({database:this.dbName,readonly:this.readonly});return Promise.resolve(e)}catch(e){return Promise.reject(e)}}async isTable(e){try{const t=await this.sqlite.isTableExists({database:this.dbName,table:e,readonly:this.readonly});return Promise.resolve(t)}catch(t){return Promise.reject(t)}}async isDBOpen(){try{const e=await this.sqlite.isDBOpen({database:this.dbName,readonly:this.readonly});return Promise.resolve(e)}catch(e){return Promise.reject(e)}}async delete(){try{return this.readonly?Promise.reject("not allowed in read-only mode"):(await this.sqlite.deleteDatabase({database:this.dbName,readonly:!1}),Promise.resolve())}catch(e){return Promise.reject(e)}}async createSyncTable(){try{if(this.readonly)return Promise.reject("not allowed in read-only mode");{const e=await this.sqlite.createSyncTable({database:this.dbName,readonly:!1});return Promise.resolve(e)}}catch(e){return Promise.reject(e)}}async setSyncDate(e){try{return this.readonly?Promise.reject("not allowed in read-only mode"):(await this.sqlite.setSyncDate({database:this.dbName,syncdate:e,readonly:!1}),Promise.resolve())}catch(t){return Promise.reject(t)}}async getSyncDate(){try{const e=await this.sqlite.getSyncDate({database:this.dbName,readonly:this.readonly});let t="";return e.syncDate>0&&(t=new Date(e.syncDate*1e3).toISOString()),Promise.resolve(t)}catch(e){return Promise.reject(e)}}async exportToJson(e,t=!1){try{const r=await this.sqlite.exportToJson({database:this.dbName,jsonexportmode:e,readonly:this.readonly,encrypted:t});return Promise.resolve(r)}catch(r){return Promise.reject(r)}}async deleteExportedRows(){try{return this.readonly?Promise.reject("not allowed in read-only mode"):(await this.sqlite.deleteExportedRows({database:this.dbName,readonly:!1}),Promise.resolve())}catch(e){return Promise.reject(e)}}async executeTransaction(e,t=!0){let r=0,n=!1;if(this.readonly)return Promise.reject("not allowed in read-only mode");if(await this.sqlite.beginTransaction({database:this.dbName}),n=await this.sqlite.isTransactionActive({database:this.dbName}),!n)return Promise.reject("After Begin Transaction, no transaction active");try{for(const a of e){if(typeof a!="object"||!("statement"in a))throw new Error("Error a task.statement must be provided");if("values"in a&&a.values&&a.values.length>0){const c=a.statement.toUpperCase().includes("RETURNING")?"all":"no",u=await this.sqlite.run({database:this.dbName,statement:a.statement,values:a.values,transaction:!1,readonly:!1,returnMode:c,isSQL92:t});if(u.changes.changes<0)throw new Error("Error in transaction method run ");r+=u.changes.changes}else{const c=await this.sqlite.execute({database:this.dbName,statements:a.statement,transaction:!1,readonly:!1});if(c.changes.changes<0)throw new Error("Error in transaction method execute ");r+=c.changes.changes}}const i=await this.sqlite.commitTransaction({database:this.dbName});r+=i.changes.changes;const o={changes:{changes:r}};return Promise.resolve(o)}catch(i){const o=i.message?i.message:i;return await this.sqlite.rollbackTransaction({database:this.dbName}),Promise.reject(o)}}async reorderRows(e){const t=e;if(e!=null&&e.values&&typeof e.values[0]=="object"&&Object.keys(e.values[0]).includes("ios_columns")){const r=e.values[0].ios_columns,n=[];for(let i=1;i<e.values.length;i++){const o=e.values[i],a={};for(const c of r)a[c]=o[c];n.push(a)}t.values=n}return Promise.resolve(t)}}const ie=U("CapacitorSQLite",{web:()=>W(()=>import("./web-BVWGWIit.js"),__vite__mapDeps([0,1,2]),import.meta.url).then(s=>new s.CapacitorSQLiteWeb),electron:()=>window.CapacitorCustomPlatform.plugins.CapacitorSQLite}),_="novel-studio";let y=null,p=null;async function oe(){return p=new ne(ie),(await p.isDatabase(_)).result?y=await p.retrieveConnection(_,!1):y=await p.createConnection(_,!1,"no-encryption",1,!1),await y.open(),await ae(y),y}async function ae(s){await s.execute(`
    CREATE TABLE IF NOT EXISTS novels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      genre TEXT DEFAULT '',
      target_words INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      order_index INTEGER NOT NULL DEFAULT 0,
      status TEXT DEFAULT '草稿',
      summary TEXT DEFAULT '',
      scene TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      word_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS chapter_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      content TEXT NOT NULL,
      change_summary TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS outlines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES outlines(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      type TEXT DEFAULT '节点',
      order_index INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      alias TEXT DEFAULT '',
      role TEXT DEFAULT '配角',
      gender TEXT DEFAULT '',
      age TEXT DEFAULT '',
      appearance TEXT DEFAULT '',
      personality TEXT DEFAULT '',
      background TEXT DEFAULT '',
      relationships TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS worlds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT DEFAULT '其他',
      content TEXT DEFAULT '',
      world_name TEXT DEFAULT '主世界',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      type TEXT DEFAULT '未分类',
      content TEXT DEFAULT '',
      source TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      ai_classified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS typo_dict (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wrong TEXT NOT NULL UNIQUE,
      right TEXT NOT NULL,
      note TEXT DEFAULT '',
      source TEXT DEFAULT '内置'
    );

    CREATE TABLE IF NOT EXISTS typo_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER REFERENCES novels(id) ON DELETE CASCADE,
      chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
      wrong TEXT NOT NULL,
      right TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      fixed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS foreshadowings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      type TEXT DEFAULT '普通',
      status TEXT DEFAULT '计划',
      chapter_id INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
      setup_desc TEXT DEFAULT '',
      call_desc TEXT DEFAULT '',
      resolve_desc TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      story_time TEXT DEFAULT '',
      description TEXT DEFAULT '',
      location TEXT DEFAULT '',
      chapter_id INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
      status TEXT DEFAULT '进行中',
      order_index INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      char_a_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      char_b_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      type TEXT DEFAULT '认识',
      label TEXT DEFAULT '',
      direction TEXT DEFAULT '双向',
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT DEFAULT '物品',
      description TEXT DEFAULT '',
      owner_id INTEGER REFERENCES characters(id) ON DELETE SET NULL,
      location TEXT DEFAULT '',
      importance TEXT DEFAULT '普通',
      tags TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER REFERENCES novels(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT DEFAULT '通用',
      system_prompt TEXT DEFAULT '',
      user_prompt TEXT DEFAULT '',
      params TEXT DEFAULT '[]',
      builtin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS word_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      day TEXT NOT NULL,
      words INTEGER DEFAULT 0,
      UNIQUE(novel_id, day)
    );

    CREATE TABLE IF NOT EXISTS ai_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day TEXT NOT NULL,
      model TEXT DEFAULT '',
      prompt_tokens INTEGER DEFAULT 0,
      completion_tokens INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS typing_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      day TEXT NOT NULL,
      hour TEXT NOT NULL,
      words INTEGER DEFAULT 0,
      UNIQUE(novel_id, day, hour)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS world_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      era TEXT DEFAULT '架空',
      item TEXT NOT NULL,
      type TEXT DEFAULT '史实',
      content TEXT DEFAULT '',
      verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT DEFAULT '',
      tokens INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `),await s.execute(`
    CREATE INDEX IF NOT EXISTS idx_ai_conv_novel ON ai_conversations(novel_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_chapters_novel ON chapters(novel_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_characters_novel ON characters(novel_id);
    CREATE INDEX IF NOT EXISTS idx_worlds_novel ON worlds(novel_id);
    CREATE INDEX IF NOT EXISTS idx_materials_novel ON materials(novel_id);
    CREATE INDEX IF NOT EXISTS idx_outlines_novel ON outlines(novel_id);
    CREATE INDEX IF NOT EXISTS idx_foreshadowings_novel ON foreshadowings(novel_id);
    CREATE INDEX IF NOT EXISTS idx_timeline_events_novel ON timeline_events(novel_id);
    CREATE INDEX IF NOT EXISTS idx_relations_novel ON relations(novel_id);
    CREATE INDEX IF NOT EXISTS idx_items_novel ON items(novel_id);
    CREATE INDEX IF NOT EXISTS idx_prompts_novel ON prompts(novel_id);
    CREATE INDEX IF NOT EXISTS idx_world_rules_novel ON world_rules(novel_id);
    CREATE INDEX IF NOT EXISTS idx_typo_records_novel ON typo_records(novel_id);
    CREATE INDEX IF NOT EXISTS idx_word_log_novel ON word_log(novel_id);
    CREATE INDEX IF NOT EXISTS idx_typing_stats_novel ON typing_stats(novel_id);
  `),await ce(s)}async function ce(s){const e=await s.query("SELECT COUNT(*) as count FROM typo_dict");e.values&&e.values[0]&&e.values[0].count===0&&await s.execute(`
      INSERT OR IGNORE INTO typo_dict (wrong, right, note, source) VALUES 
      ('的地得', '的地得', '的地得用法区分', '内置'),
      ('他她它', '他她它', '他她它用法区分', '内置')
    `);const t=await s.query("SELECT COUNT(*) as count FROM prompts");t.values&&t.values[0]&&t.values[0].count===0&&await s.execute(`
      INSERT OR IGNORE INTO prompts (name, category, system_prompt, user_prompt, builtin) VALUES 
      ('续写', '写作辅助', '你是一位专业的小说作家，擅长续写故事。请根据上下文自然地续写下去。', '{{content}}', 1),
      ('润色', '写作辅助', '你是一位文学编辑，擅长润色文字。请帮助改进以下文字，保持原意但提升表达质量。', '{{content}}', 1),
      ('校对', '写作辅助', '你是一位专业校对员，请检查以下文字中的错别字、语法错误，并给出修改建议。', '{{content}}', 1)
    `)}async function k(s,e=[]){if(!y)throw new Error("数据库未初始化");return(await y.query(s,e)).values||[]}async function Ee(s,e=[]){if(!y)throw new Error("数据库未初始化");return await y.run(s,e)}async function B(s,e=[]){const t=await k(s,e);return t.length>0?t[0]:null}async function le(s,e=[]){const t=await B(s,e);return t?Object.values(t)[0]:null}const de=Object.freeze(Object.defineProperty({__proto__:null,execute:Ee,getOne:B,getScalar:le,initDatabase:oe,query:k},Symbol.toStringTag,{value:"Module"}));export{b as W,le as a,de as d,Ee as e,B as g,k as q};
