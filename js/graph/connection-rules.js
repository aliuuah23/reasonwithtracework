import { transitionEvidence } from '../evidence/pilot-evidence.js';
import { explainConnectionPair,proposedReasoningGap } from '../core/connection-explainer.js';
import { getFramework,frameworkRoleForNode } from '../core/frameworks.js';
export function connectionCheck(source,target,edges=[],evidence=null,{frameworkId='tracework'}={}){
 if(!source||!target)return {ok:false,reason:'A connection needs two thoughts.',detail:'Choose a destination node.'};
 if(source.id===target.id)return {ok:false,reason:'A node cannot connect to itself.',detail:'Separate the sentence into two thoughts if it contains two moves.'};
 if(edges.some(e=>e.source===source.id&&e.target===target.id))return {ok:false,reason:'These two thoughts are already connected.',detail:'Inspect or edit the existing wire instead of duplicating it.'};
 const explanation=explainConnectionPair(source,target);
 const gap=proposedReasoningGap(source,target,{frameworkId});
 const framework=getFramework(frameworkId);
 let frameworkNote='';
 if(frameworkId!=='tracework'&&frameworkId!=='freeform'&&framework){
  const from=frameworkRoleForNode(source,frameworkId),to=frameworkRoleForNode(target,frameworkId);
  frameworkNote=`The ${framework.shortLabel||framework.label} lens reads these as ${from?.label||source.type} and ${to?.label||target.type}.`;
 }
 // Role sequences are advisory: a designer may legitimately skip a category.
 // No pilot-frequency statistic is presented as a justification for the link.
 return {ok:true,reason:explanation.reason,detail:frameworkNote,gap,signal:'neutral',next:explanation.next};
}
export function connectionSignal(source,target,evidence=null){
 if(!source||!target||source.type==='note'||target.type==='note')return {band:'neutral',score:null};
 const empirical=transitionEvidence(source.type,target.type,evidence);
 return empirical?{band:empirical.band,score:empirical.score,evidence:empirical}:{band:'unseen',score:0,evidence:null};
}
