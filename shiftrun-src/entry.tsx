import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import Home from './app/page';
import {normalizeSave,type Save} from './app/progress';
function App(){
 const [published,setPublished]=useState<Save>(),[showProfile,setShowProfile]=useState(location.hash==='#khanfarris'),[error,setError]=useState('');
 useEffect(()=>{fetch('khanfarris-profile.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>setPublished(normalizeSave(data.save))).catch(()=>setError('Published profile could not be loaded. Your progress is still available.'));const handler=()=>setShowProfile(location.hash==='#khanfarris');addEventListener('hashchange',handler);return()=>removeEventListener('hashchange',handler)},[]);
 const toggle=()=>{const next=!showProfile;setShowProfile(next);history.replaceState(null,'',next?'#khanfarris':location.pathname);};
 if(showProfile&&!published)return <main className="shell"><p role="status">{error||'Loading khanfarris profile…'}</p><button onClick={toggle}>Return to your progress</button></main>;
 return <div className={showProfile?'published-profile':'visitor-profile'}><Home key={showProfile?'khanfarris':'visitor'} profile={showProfile?published:undefined} onToggle={toggle}/></div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
