import React from 'react';
import {Check,LockKeyhole} from 'lucide-react';
import {clients,template,type Run} from './app/game';
import {Help} from './help';
type IncidentNode={id:string;title:string;client:string;status:string;selected:boolean;closed:boolean;locked:boolean;stabilized:boolean;pressure:number|null;i:number};
export function IncidentConstellation({run,locked,published,onSelect}:{run:Run;locked:boolean;published:boolean;onSelect:(i:number)=>void}){
  const queue:IncidentNode[]=run.cases.map((c,i)=>{
    const incident=template(c),sealed=locked||(published&&!c.closed);
    return {id:c.id,title:incident.title,client:clients[c.client].name,status:c.score+'/100',selected:i===run.selected,closed:c.closed,locked:sealed,stabilized:c.done.some(id=>incident.actions.find(a=>a.id===id)?.contain),pressure:c.closed||sealed?null:c.pressure,i};
  });
  const nodeHeight=142,nodeGap=58,stride=nodeHeight+nodeGap;
  const height=Math.max(1,queue.length)*nodeHeight+Math.max(0,queue.length-1)*nodeGap;
  const bends=queue.slice(1).map((_,i)=>({x:i%2===0?84:8,y:nodeHeight/2+i*stride+stride/2}));
  // Vertical tangents meet at each node; alternating bows open into the gaps.
  const route='M 40 71 '+bends.map(({x,y})=>`C 40 ${y-46}, ${x} ${y-42}, ${x} ${y} S 40 ${y+46}, 40 ${y+100}`).join(' ');
  return <section className="queue-visual constellation-queue" aria-label="Incident constellation">
    <div className="visual-heading"><span>INCIDENT<br/>{' '}CONSTELLATION <Help topic="pressure" label="Pressure and incident queue"/></span><span>{queue.filter(q=>!q.closed).length} {locked?'LOCKED':'OPEN'}</span></div>
    <div className="node-field" style={{'--node-gap':`${nodeGap}px`} as React.CSSProperties}>
      <svg className="constellation-thread" viewBox={`0 0 80 ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={route}/>
        <path className="travel-halo" d={route} pathLength="1000"/>
        <path className="travel-line" d={route} pathLength="1000"/>
        {bends.map(({x,y},i)=><g className="thread-star" key={i} style={{animationDelay:`${i*-2.5}s`}}><path d={`M ${x-4} ${y} h 8 M ${x} ${y-4} v 8`}/><circle cx={x} cy={y} r="1.6"/></g>)}
      </svg>
      {queue.map(q=>{
        const pressure=q.pressure??0;
        const high=!q.closed&&!q.locked&&!q.stabilized&&pressure>=85;
        const label=q.closed?`Closed · ${q.status}`:q.locked?'Locked preview':`${pressure}% pressure${q.stabilized?' · stabilized':high?' · high pressure':''}`;
        return <button key={q.id} className={'incident-node'+(q.selected?' selected':'')+(q.closed?' is-closed':'')+(q.locked?' is-locked':'')+(q.stabilized?' is-stabilized':'')+(high?' is-urgent':'')} aria-pressed={q.selected} aria-label={`${q.closed?"CLOSED ":q.locked?"LOCKED ":""}${q.title}. Incident ${q.i+1}. ${label}`} data-pressure={q.pressure??undefined} style={{'--pulse-duration':`${4.8-pressure*.03}s`} as React.CSSProperties} onClick={()=>onSelect(q.i)}>
          <span className="node-orbit" aria-hidden="true">
            <svg className="pressure-ring" viewBox="0 0 80 80"><circle className="ring-track" cx="40" cy="40" r="32" pathLength="100"/>{!q.locked&&<circle className="ring-value" cx="40" cy="40" r="32" pathLength="100" strokeDasharray="100" strokeDashoffset={q.closed?0:100-pressure} strokeOpacity={!q.closed&&pressure===0?0:1}/>}</svg>
            <span className="node-core">{q.closed?<Check size={19}/>:q.locked?<LockKeyhole size={16}/>:String(q.i+1).padStart(2,'0')}</span>
            {q.closed&&<span className="node-index">{String(q.i+1).padStart(2,'0')}</span>}
          </span>
          <span className="node-copy"><span className="node-client">{q.client}</span><strong>{q.title}</strong><span className="node-status">{q.closed?<><Check size={10}/> {q.status} · CLOSED</>:q.locked?<><LockKeyhole size={10}/> LOCKED PREVIEW</>:<><b>{pressure}%</b> {q.stabilized?'STABILIZED':high?'HIGH PRESSURE':'PRESSURE'}</>}</span></span>
          <span className="node-selection" aria-hidden="true"/>
        </button>
      })}
    </div>
    <p className="constellation-note"><span className="note-ring" aria-hidden="true"/>Ring fill shows pressure. It changes with your actions, not time spent reading. At 85%, each unstabilized incident costs 2 trust per turn.</p>
  </section>
}
