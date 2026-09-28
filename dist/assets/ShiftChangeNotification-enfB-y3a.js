import{j as n,g as h,k as e}from"./index-D5eU6uWF.js";import{C as o}from"./clock-BUkw1wxr.js";import{X as m}from"./x-C3-CLa1l.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=n("Calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=n("Printer",[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=n("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]),u=({previousShift:t,currentShift:s,onDismiss:i})=>{const[d,r]=h.useState(!1);if(h.useEffect(()=>{if(t&&s&&t.shiftType!==s.shiftType){r(!0);const a=setTimeout(()=>{r(!1)},1e4);return()=>clearTimeout(a)}},[t,s]),!d||!t||!s)return null;const l=a=>{switch(a){case"Morning":return"text-amber-400";case"Evening":return"text-rose-400";case"Night":return"text-purple-400";default:return"text-slate-400"}},c=a=>{switch(a){case"Morning":return"🌅";case"Evening":return"🌆";case"Night":return"🌙";default:return"🕐"}};return e.jsx("div",{className:"fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300",children:e.jsx("div",{className:"bg-slate-900 border border-amber-500/50 rounded-2xl p-4 shadow-2xl max-w-sm",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0",children:e.jsx(o,{className:"w-5 h-5 text-amber-400"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[e.jsx(x,{className:"w-4 h-4 text-amber-400"}),e.jsx("h3",{className:"text-sm font-extrabold text-white",children:"Shift Change Detected"})]}),e.jsxs("p",{className:"text-xs text-slate-300 mb-2",children:["Shift has changed from ",e.jsxs("span",{className:`font-bold ${l(t.shiftType)}`,children:[c(t.shiftType)," ",t.shiftName]})," to ",e.jsxs("span",{className:`font-bold ${l(s.shiftType)}`,children:[c(s.shiftType)," ",s.shiftName]})]}),e.jsx("p",{className:"text-[11px] text-slate-400",children:"Your login session remains active. Orders will now be tagged to the new shift."})]}),e.jsx("button",{onClick:()=>{r(!1),i&&i()},className:"p-1 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white",children:e.jsx(m,{className:"w-4 h-4"})})]})})})};export{b as C,y as P,u as S,x as T};
