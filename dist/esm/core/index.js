import"reflect-metadata";class e{init(e){this.args=e,this.ready(e)}}var t;!function(e){e.SINGLETON="SINGLETON",e.TRANSIENT="TRANSIENT"}(t||(t={}));class o{constructor(e,t,o,i){this.options=e,this.moduleClass=t,this.isSingleton=o,this.moduleManagerInstance=i,this.providers=new Map,this.imports=[],this.exports=new Set,this.initialized=!1,this.initializing=!1,this.rootModule=null,this.instanceCache=new Map}get name(){return this.moduleClass.name}isExported(e){const t=h(e);return this.exports.has(t)}getLocalProvider(e){const t=h(e);return this.providers.get(t)||null}async resolveProvider(e){const o=h(e),i=this.getLocalProvider(o);if(i&&i.scope===t.TRANSIENT)return await i.resolve();if(this.instanceCache.has(o))return this.instanceCache.get(o);if(i){const e=await i.resolve();return i.scope===t.SINGLETON&&this.instanceCache.set(o,e),e}for(const e of this.imports)if(e.isExported(o))try{return await e.resolveProvider(o)}catch(e){}if(this.rootModule&&this!==this.rootModule)try{return await this.rootModule.resolveProvider(o)}catch(e){}const s=this.moduleManagerInstance.findParentModules(this.moduleClass);for(const e of s){const t=this.moduleManagerInstance.getLoadedModule(e);if(t)try{return await t.resolveProvider(o)}catch(e){}}throw new Error(`Provider ${c(o)} not found in module ${this.name}`)}async initialize(e=null){var i,s,n;if(!this.initialized)if(this.initializing)await new Promise((e=>{const t=setInterval((()=>{this.initializing||(clearInterval(t),e())}),10)}));else{this.initializing=!0;try{if(this.rootModule=e||this,null===(i=this.options.imports)||void 0===i?void 0:i.length)for(const e of this.options.imports){let i=this.moduleManagerInstance.getLoadedModule(e);if(!i){const t=d(e);i=new o(l(e),e,t,this.moduleManagerInstance),await i.initialize(this.rootModule),this.moduleManagerInstance.registerModule(e,i)}if(this.imports.push(i),this.options.exports)for(const e of this.options.exports){const o=h(e);if(i.isExported(o)&&!this.providers.has(o)){const e=new u(o,"token",this);e.sourceModule=i.name,e.factory=()=>this.instanceCache.get(o),e.scope=t.SINGLETON,this.providers.set(o,e),this.instanceCache.set(o,await i.resolveProvider(o))}}}if(null===(s=this.options.providers)||void 0===s?void 0:s.length)for(const e of this.options.providers)await this.registerProvider(e);if(null===(n=this.options.exports)||void 0===n?void 0:n.length)for(const e of this.options.exports){const o=h(e);if(this.exports.add(o),!this.providers.has(o)){let e=!1;for(const i of this.imports)if(i.isExported(o)){e=!0;const s=new u(o,"token",this);s.sourceModule=i.name,s.factory=()=>this.instanceCache.get(o),s.scope=t.SINGLETON,this.providers.set(o,s),this.instanceCache.set(o,await i.resolveProvider(o));break}e||console.warn(`Module ${this.name} exports token ${c(o)} not found`)}}await this.preInitializeExports(),this.initialized=!0}finally{this.initializing=!1}}}async preInitializeExports(){for(const e of this.exports)if(!this.instanceCache.has(e))try{const t=this.providers.get(e);if(t){const o=await t.resolve();this.instanceCache.set(e,o)}}catch(t){console.error(`Failed to pre-initialize export ${c(e)}`)}}async registerProvider(e){var o;const s=h(e.provide);if(this.providers.has(s))return;const n=new u(s,"class",this);if(n.sourceModule=this.name,"useClass"in e){const o=e,a=o.useClass;n.scope=o.scope||function(e){return Reflect.getMetadata(r,e)||null}(a)||t.SINGLETON;const l=function(e){try{const t=Reflect.getMetadata(i,e)||{},o=Object.keys(t).length>0?Math.max(...Object.keys(t).map(Number)):-1,s=new Array(o+1).fill(null);for(const[e,o]of Object.entries(t))s[Number(e)]=o;return s}catch(t){return console.warn(`Failed to get tokens for ${null==e?void 0:e.name}`),[]}}(a);n.dependencies=l.map((e=>h(e)));const d=[];for(const e of n.dependencies){const t=this.providers.has(e);let o=!1;for(const t of this.imports)if(t.isExported(e)){o=!0;break}const i=this.rootModule!==this&&null!==this.rootModule&&this.rootModule.providers.has(e);t||o||i||d.push(e)}if(d.length>0){const e=d.map((e=>"function"==typeof e?e.name:String(e))).join(", ");throw new Error(`Cannot register provider ${c(s)} (${a.name}) in module ${this.name}: missing dependencies [${e}]. Make sure all dependencies are available through the module's providers, imports, or root module.`)}n.factory=(...e)=>new a(...e)}else if("useValue"in e){const o=e;n.type="value",n.scope=t.SINGLETON,n.instance=o.useValue}else if("useFactory"in e){const o=e;n.type="factory",n.scope=t.SINGLETON,o.deps&&(n.dependencies=o.deps.map((e=>h(e)))),n.factory=(...e)=>o.useFactory(...e)}else if("useToken"in e){const o=e;n.type="token",n.scope=t.SINGLETON,n.dependencies=[h(o.useToken)],n.factory=e=>e}if(this.providers.set(s,n),null===(o=this.options.exports)||void 0===o?void 0:o.some((e=>h(e)===s)))try{const e=await n.resolve();this.instanceCache.set(s,e)}catch(e){console.error(`Failed to pre-initialize provider ${c(s)}`)}}dispose(){for(const e of this.providers.values())e.dispose();this.providers.clear(),this.exports.clear(),this.imports=[],this.initialized=!1,this.rootModule=null,this.instanceCache.clear()}}const i=Symbol.for("flexdi.INJECT_METADATA_KEY"),s=Symbol.for("flexdi.INJECTABLE_METADATA_KEY"),n=Symbol.for("flexdi.MODULE_METADATA_KEY"),r=Symbol.for("flexdi.SCOPE_METADATA_KEY"),a=Symbol.for("flexdi.SINGLETON_MODULE_METADATA_KEY");function l(e){const t=Reflect.getMetadata(n,e);if(!t)throw new Error(`${e.name} is not a valid module`);return t}function d(e){return!0===Reflect.getMetadata(a,e)}const c=e=>"string"==typeof e||"symbol"==typeof e?String(e):"function"==typeof e?e.name:String(e),h=e=>"string"==typeof e||"symbol"==typeof e||"function"==typeof e?e:String(e);class u{constructor(e,o,i){this.token=e,this.type=o,this.moduleRef=i,this.instance=null,this.factory=null,this.dependencies=[],this.scope=t.SINGLETON,this.sourceModule=""}async resolve(){if(this.scope===t.SINGLETON&&null!==this.instance)return this.instance;if(!this.factory)throw new Error(`Cannot resolve provider ${c(this.token)}`);const e=await Promise.all(this.dependencies.map((async e=>{try{return await this.moduleRef.resolveProvider(e)}catch(t){if(this.moduleRef.rootModule&&this.moduleRef!==this.moduleRef.rootModule)try{return await this.moduleRef.rootModule.resolveProvider(e)}catch(e){return}return}}))),o=this.dependencies.filter(((t,o)=>void 0===e[o]));if(o.length>0)throw new Error(`Cannot resolve dependencies for ${c(this.token)}: missing ${o.join(", ")}`);try{const o=this.factory(...e),i=o instanceof Promise?await o:o;return this.scope===t.SINGLETON&&(this.instance=i),i}catch(e){throw e}}dispose(){var e;(null===(e=this.instance)||void 0===e?void 0:e.onDisposeInstance)&&this.instance.onDisposeInstance(),this.instance=null}}class f{constructor(){this.moduleRefs=new Map,this.singletonModuleRefs=new Map,this.rootModuleRef=null,this.moduleImports=new Map,this.initializationPromises=new Map}registerModule(e,t){if(t.isSingleton?this.singletonModuleRefs.has(e.name)||this.singletonModuleRefs.set(e.name,t):this.moduleRefs.set(e.name,t),t.options.imports)for(const o of t.options.imports)this.moduleImports.has(o.name)||this.moduleImports.set(o.name,new Set),this.moduleImports.get(o.name).add(e.name)}isRootModule(e){var t;return(null===(t=this.rootModuleRef)||void 0===t?void 0:t.moduleClass)===e}findParentModules(e){const t=this.moduleImports.get(e.name)||new Set,o=[];for(const e of t){const t=this.moduleRefs.get(e);(null==t?void 0:t.moduleClass)&&o.push(t.moduleClass)}return o}getLoadedModule(e){var t,o;return null!==(o=null!==(t=this.moduleRefs.get(e.name))&&void 0!==t?t:this.singletonModuleRefs.get(e.name))&&void 0!==o?o:null}isModuleLoaded(e){const t=this.getLoadedModule(e);return!!t&&t.initialized}async loadModule(e,t=!1){if(this.isModuleLoaded(e))return new e;const i=this.initializationPromises.get(e.name);if(i)return await i,new e;const s=d(e),n=l(e),r=new o(n,e,s,this);let a;t?(this.rootModuleRef=r,a=r.initialize(r)):a=r.initialize(this.rootModuleRef),this.initializationPromises.set(e.name,a);try{return await a,this.registerModule(e,r),new e}finally{this.initializationPromises.delete(e.name)}}getService(e,t){var o,i;const s=this.getLoadedModule(e);if(!s)throw new Error(`Module ${e.name} not loaded`);const n=h(t);if(!s.isExported(n)){if(null===(o=this.rootModuleRef)||void 0===o?void 0:o.instanceCache.has(n))return this.rootModuleRef.instanceCache.get(n);throw new Error(`Token ${c(n)} not exported from module ${e.name}`)}if(s.instanceCache.has(n))return s.instanceCache.get(n);if(null===(i=this.rootModuleRef)||void 0===i?void 0:i.instanceCache.has(n))return this.rootModuleRef.instanceCache.get(n);throw new Error(`Provider ${c(n)} not pre-initialized in module ${e.name}`)}unloadModule(e){const t=this.getLoadedModule(e);if(!t||t.isSingleton)return;if(t===this.rootModuleRef)return void console.warn("Cannot unload root module");const o=this.findDependentModules(e);if(o.length>0)console.warn(`Cannot unload module ${e.name}, still imported by: ${o.join(", ")}`);else{t.dispose(),this.moduleRefs.delete(e.name),this.moduleImports.delete(e.name);for(const t of this.moduleImports.values())t.delete(e.name);if(t.options.imports)for(const e of t.options.imports)0===this.findDependentModules(e).length&&this.unloadModule(e)}}findDependentModules(e){const t=[];for(const[o,i]of this.moduleRefs.entries())i.imports.some((t=>t.moduleClass.name===e.name))&&t.push(o);return t}}class p{static getInstance(){return p._instance}static setInstance(e){p._instance=e}static resetInstance(){p.setInstance(new f)}}p._instance=new f;const m=async(e,t)=>{await p.getInstance().loadModule(e,t)};function v(e){return t=>{Reflect.defineMetadata(n,e,t)}}function M(e=t.SINGLETON){return t=>{Reflect.defineMetadata(s,!0,t),Reflect.defineMetadata(r,e,t)}}function g(e){return(t,o,s)=>{const n=Reflect.getMetadata(i,t)||{};n[s]=e,Reflect.defineMetadata(i,n,t)}}function w(){return e=>{Reflect.defineMetadata(a,!0,e)}}export{e as BasicPresenter,s as INJECTABLE_METADATA_KEY,i as INJECT_METADATA_KEY,g as Inject,M as Injectable,n as MODULE_METADATA_KEY,v as Module,f as ModuleManager,p as ModuleManagerFactory,u as ProviderRef,r as SCOPE_METADATA_KEY,a as SINGLETON_MODULE_METADATA_KEY,t as Scope,w as Singleton,l as getModuleOptions,c as getTokenDebugName,h as getTokenName,d as isSingletonModule,m as preloadModule};
//# sourceMappingURL=index.js.map
