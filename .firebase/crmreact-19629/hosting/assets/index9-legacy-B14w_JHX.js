System.register(["./index-legacy-CPQOcEg7.js"],(function(e,t){"use strict";var n,o,i;return{setters:[e=>{n=e.d,o=e.n,i=e.p}],execute:function(){e("startTapClick",(e=>{if(void 0===n)return;let u,v,f,p=10*-l,m=0;const L=e.getBoolean("animated",!0)&&e.getBoolean("rippleEffect",!0),h=new WeakMap,w=e=>{p=o(e),T(e)},E=()=>{f&&clearTimeout(f),f=void 0,u&&(S(!1),u=void 0)},g=e=>{u||y(t(e),e)},T=e=>{y(void 0,e)},y=(e,t)=>{if(e&&e===u)return;f&&clearTimeout(f),f=void 0;const{x:n,y:o}=i(t);if(u){if(h.has(u))throw new Error("internal error");u.classList.contains(a)||b(u,n,o),S(!0)}if(e){const t=h.get(e);t&&(clearTimeout(t),h.delete(e)),e.classList.remove(a);const i=()=>{b(e,n,o),f=void 0};s(e)?i():f=setTimeout(i,c)}u=e},b=(e,t,n)=>{if(m=Date.now(),e.classList.add(a),!L)return;const o=r(e);null!==o&&(R(),v=o.addRipple(t,n))},R=()=>{void 0!==v&&(v.then((e=>e())),v=void 0)},S=e=>{R();const t=u;if(!t)return;const n=d-Date.now()+m;if(e&&n>0&&!s(t)){const e=setTimeout((()=>{t.classList.remove(a),h.delete(t)}),d);h.set(t,e)}else t.classList.remove(a)};n.addEventListener("ionGestureCaptured",E),n.addEventListener("touchstart",(e=>{p=o(e),g(e)}),!0),n.addEventListener("touchcancel",w,!0),n.addEventListener("touchend",w,!0),n.addEventListener("pointercancel",E,!0),n.addEventListener("mousedown",(e=>{if(2===e.button)return;const t=o(e)-l;p<t&&g(e)}),!0),n.addEventListener("mouseup",(e=>{const t=o(e)-l;p<t&&T(e)}),!0)}));
/*!
             * (C) Ionic http://ionicframework.com - MIT License
             */
const t=e=>{if(void 0===e.composedPath)return e.target.closest(".ion-activatable");{const t=e.composedPath();for(let e=0;e<t.length-2;e++){const n=t[e];if(!(n instanceof ShadowRoot)&&n.classList.contains("ion-activatable"))return n}}},s=e=>e.classList.contains("ion-activatable-instant"),r=e=>{if(e.shadowRoot){const t=e.shadowRoot.querySelector("ion-ripple-effect");if(t)return t}return e.querySelector("ion-ripple-effect")},a="ion-activated",c=100,d=150,l=2500}}}));
