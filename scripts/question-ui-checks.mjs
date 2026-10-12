// Actual QuestionScreen hooks host, without browser/DOM claims.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'question-ui-'));
try{
 await build({entryPoints:['src/screens/QuestionScreen/QuestionScreen.tsx'],outfile:path.join(temp,'screen.mjs'),bundle:true,platform:'node',format:'esm',jsx:'automatic',define:{'import.meta.env':JSON.stringify({BASE_URL:'/',DEV:false})},plugins:[{name:'hooks-host',setup(b){b.onResolve({filter:/^react$/},a=>a.importer.endsWith('/QuestionScreen.tsx')?{path:'hooks',namespace:'test'}:undefined);b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const useState=(...a)=>globalThis.screenHooks.useState(...a);export const useRef=(...a)=>globalThis.screenHooks.useRef(...a);export const useMemo=(...a)=>globalThis.screenHooks.useMemo(...a);export const useEffect=()=>{};',loader:'js'}));}}]});
 const {QuestionScreen}=await import(pathToFileURL(path.join(temp,'screen.mjs')));
 const collect=(e,name)=>{const all=[];function visit(e){if(!e)return;if(Array.isArray(e)){e.forEach(visit);return;}if(typeof e!=='object')return;if(e.type?.name===name)all.push(e);visit(e.props?.children);}visit(e);return all;};
 for(const type of ['multipleChoice','multipleSelect']){
  const q={id:type,lessonId:'test',type,prompt:'test',options:['alpha','beta','gamma','delta'],explanation:'unchanged',...(type==='multipleChoice'?{correctAnswer:'beta'}:{correctAnswers:['beta','delta']})};
  const states=[],refs=[],memos=[];let si=0,ri=0,mi=0;const results=[];
  globalThis.screenHooks={useState(initial){const i=si++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return[states[i],next=>{states[i]=typeof next==='function'?next(states[i]):next;}];},useRef(initial){const i=ri++;return refs[i]??(refs[i]={current:initial});},useMemo(fn,deps){const i=mi++,m=memos[i];if(!m||deps.some((d,j)=>d!==m.deps[j]))memos[i]={deps,value:fn()};return memos[i].value;}};
  const render=()=>{si=ri=mi=0;return QuestionScreen({questions:[q],instanceSeed:'fixed',onNavigate:()=>{},onResult:()=>{},onReviewChange:r=>results.push(r)});};
  let tree=render();const labels=collect(tree,'OptionButton').map(o=>o.props.label);assert.deepEqual(collect(render(),'OptionButton').map(o=>o.props.label),labels);assert(labels.every((l,i)=>l.startsWith(['①','②','③','④'][i])));
  const answers=type==='multipleChoice'?['beta']:['beta','delta'];
  for(const a of answers){collect(tree,'OptionButton').find(o=>o.props.label.endsWith(' '+a)).props.onClick();tree=render();assert(collect(tree,'OptionButton').find(o=>o.props.label.endsWith(' '+a)).props.selected);}
  if(type==='multipleSelect'){collect(tree,'OptionButton').find(o=>o.props.label.endsWith(' beta')).props.onClick();tree=render();assert(!collect(tree,'OptionButton').find(o=>o.props.label.endsWith(' beta')).props.selected);collect(tree,'OptionButton').find(o=>o.props.label.endsWith(' beta')).props.onClick();tree=render();}
  collect(tree,'QuestionReviewFooter')[0].props.onSubmit();tree=render();assert.equal(results.length,1);assert(results[0].isCorrect);assert.deepEqual(collect(tree,'OptionButton').map(o=>o.props.label),labels);assert(collect(tree,'OptionButton').every(o=>o.props.submitted&&o.props.correct===answers.some(a=>o.props.label.endsWith(' '+a))));collect(tree,'QuestionReviewFooter')[0].props.onSubmit();assert.equal(results.length,1);
 }
 console.log('Actual QuestionScreen fixed order/numbering/select/deselect/grade/highlight/submit lock: PASS');
}finally{delete globalThis.screenHooks;fs.rmSync(temp,{recursive:true,force:true});}
